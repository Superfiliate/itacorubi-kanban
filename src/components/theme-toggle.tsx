"use client"

import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import { Moon, Sun, Monitor, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getBoardStorageUsage } from "@/actions/storage"
import { formatFileSize, MAX_BOARD_STORAGE } from "@/lib/storage/constants"

interface ThemeToggleProps {
  boardId?: string
}

export function ThemeToggle({ boardId }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  // Fetch storage usage if boardId is provided
  const { data: storageUsage } = useQuery({
    queryKey: ["board-storage", boardId],
    queryFn: () => getBoardStorageUsage(boardId!),
    enabled: !!boardId,
    staleTime: 30000, // 30 seconds
  })

  const storagePercentage = storageUsage !== undefined
    ? Math.round((storageUsage / MAX_BOARD_STORAGE) * 100)
    : 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        {/* Storage usage section - only show when boardId is provided */}
        {boardId && storageUsage !== undefined && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <HardDrive className="h-3 w-3" />
                <span>Board Storage</span>
              </div>
              <div className="text-sm font-medium">
                {formatFileSize(storageUsage)} / {formatFileSize(MAX_BOARD_STORAGE)}
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    storagePercentage > 90
                      ? "bg-destructive"
                      : storagePercentage > 70
                      ? "bg-amber-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {storagePercentage}% used
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
