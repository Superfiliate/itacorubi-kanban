"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/lib/query-client"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </NextThemesProvider>
    </QueryProvider>
  )
}
