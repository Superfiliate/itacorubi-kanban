/**
 * Environment Variable Validation
 *
 * This module validates required environment variables at build time.
 * If validation fails in production, the build will fail with clear error messages,
 * preventing Vercel from deploying a broken app.
 *
 * Usage: Import this module in next.config.ts to run validation during build.
 */

import { z } from "zod";

// Check if we're in a Vercel production deployment
// VERCEL_ENV is set by Vercel to "production", "preview", or "development"
// We only require production env vars when actually deployed to Vercel production
const isVercelProduction = process.env.VERCEL_ENV === "production";

/**
 * Server-side environment variables schema
 * These are only available on the server and validated at build time.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database (Turso) - Required in production
  TURSO_DATABASE_URL: z
    .url({ message: "TURSO_DATABASE_URL must be a valid URL" })
    .optional()
    .refine((val) => !isVercelProduction || (val && val.length > 0), {
      message: "TURSO_DATABASE_URL is required in production",
    }),

  TURSO_AUTH_TOKEN: z
    .string()
    .min(1, "TURSO_AUTH_TOKEN cannot be empty")
    .optional()
    .refine((val) => !isVercelProduction || (val && val.length > 0), {
      message: "TURSO_AUTH_TOKEN is required in production",
    }),

  // Cron job authentication - Required in production
  CRON_SECRET: z
    .string()
    .min(16, "CRON_SECRET must be at least 16 characters for security")
    .optional()
    .refine((val) => !isVercelProduction || (val && val.length > 0), {
      message: "CRON_SECRET is required in production for cron job authentication",
    }),

  // Email (Resend) - Required in production for notifications
  RESEND_API_KEY: z
    .string()
    .refine((val) => !val || val.startsWith("re_"), {
      message: "RESEND_API_KEY must start with 're_'",
    })
    .optional()
    .refine((val) => !isVercelProduction || (val && val.length > 0), {
      message: "RESEND_API_KEY is required in production for email notifications",
    }),

  // File storage (Vercel Blob) - Required in production for file uploads
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .min(1, "BLOB_READ_WRITE_TOKEN cannot be empty")
    .optional()
    .refine((val) => !isVercelProduction || (val && val.length > 0), {
      message: "BLOB_READ_WRITE_TOKEN is required in production for file uploads",
    }),

  // Email sender address - Optional with default
  EMAIL_FROM: z.email({ message: "EMAIL_FROM must be a valid email address" }).optional(),

  // Vercel-provided variables (automatically set by Vercel)
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),

  // Base URL for the app - Optional, auto-detected from VERCEL_URL
  NEXT_PUBLIC_BASE_URL: z.url({ message: "NEXT_PUBLIC_BASE_URL must be a valid URL" }).optional(),
});

/**
 * Format Zod errors into a clear, readable message
 */
function formatEnvErrors(zodError: z.ZodError): string {
  const lines: string[] = ["", "❌ Environment validation failed!", ""];

  const missingInProd: string[] = [];
  const invalidFormat: string[] = [];

  for (const issue of zodError.issues) {
    const path = issue.path.join(".");
    const message = issue.message;

    if (message.includes("required in production")) {
      missingInProd.push(`  ${path}: ${message}`);
    } else {
      invalidFormat.push(`  ${path}: ${message}`);
    }
  }

  if (missingInProd.length > 0) {
    lines.push("Missing required environment variables for production:");
    lines.push(...missingInProd);
    lines.push("");
  }

  if (invalidFormat.length > 0) {
    lines.push("Invalid format:");
    lines.push(...invalidFormat);
    lines.push("");
  }

  lines.push("Please configure these in your Vercel project settings.");
  lines.push("");

  return lines.join("\n");
}

/**
 * Validate environment variables
 * Throws an error with detailed messages if validation fails
 */
function validateEnv() {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessage = formatEnvErrors(result.error);
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.data;
}

// Run validation immediately when this module is imported
export const env = validateEnv();

// Export the schema for testing or type inference
export type Env = z.infer<typeof serverEnvSchema>;
