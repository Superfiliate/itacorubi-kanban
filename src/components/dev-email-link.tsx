"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Link to the dev email viewer, only shown in development/test environments.
 * Checks if the dev API is accessible to determine visibility.
 */
export function DevEmailLink({ variant = "button" }: { variant?: "button" | "link" }) {
  const [isDevEnv, setIsDevEnv] = useState(false);

  useEffect(() => {
    // Check if the dev email API is accessible
    fetch("/api/dev/emails", { method: "HEAD" })
      .then((res) => {
        setIsDevEnv(res.ok);
      })
      .catch(() => {
        setIsDevEnv(false);
      });
  }, []);

  if (!isDevEnv) return null;

  if (variant === "link") {
    return (
      <Link
        href="/dev/emails"
        className="text-sm text-muted-foreground hover:text-foreground underline"
      >
        📬 Dev Emails
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      asChild
      title="View dev emails"
      aria-label="View dev emails"
    >
      <Link href="/dev/emails">
        <Mail className="h-4 w-4" />
      </Link>
    </Button>
  );
}
