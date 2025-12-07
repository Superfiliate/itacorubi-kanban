"use client"

import { useState, useEffect } from "react"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

interface ShareDialogProps {
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ boardId, open, onOpenChange }: ShareDialogProps) {
  const [password, setPassword] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && !password) {
      fetchPassword()
    }
  }, [open, password])

  const fetchPassword = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/password`)
      if (response.ok) {
        const data = await response.json()
        setPassword(data.password)
      }
    } catch (error) {
      console.error("Failed to fetch password:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const boardUrl = typeof window !== "undefined"
    ? `${window.location.origin}/boards/${boardId}`
    : ""

  const publicUrl = typeof window !== "undefined" && password
    ? `${window.location.origin}/boards/${boardId}/unlock?password=${encodeURIComponent(password)}`
    : ""

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Board
          </DialogTitle>
          <DialogDescription>
            Share this board with others using the URL and password, or create a public link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with Password Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Share with Password</h3>

            {/* Board URL */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Board URL</label>
              <div className="flex gap-2">
                <Input
                  value={boardUrl}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(boardUrl, "url")}
                  title="Copy URL"
                >
                  {copiedField === "url" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Password</label>
              <div className="flex gap-2">
                <PasswordInput
                  value={password || ""}
                  readOnly
                  className="flex-1 font-mono text-xs"
                  placeholder={isLoading ? "Loading..." : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => password && copyToClipboard(password, "password")}
                  disabled={!password}
                  title="Copy password"
                >
                  {copiedField === "password" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Public Link Section */}
          <div className="space-y-3 border-t border-border pt-6">
            <h3 className="text-sm font-medium">Public Link</h3>
            <p className="text-xs text-muted-foreground">
              Anyone with this link will have the password prefilled, but still needs to click unlock.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Public URL</label>
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="flex-1 font-mono text-xs"
                  placeholder={password ? "" : "Loading..."}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => publicUrl && copyToClipboard(publicUrl, "public")}
                  disabled={!publicUrl}
                  title="Copy public link"
                >
                  {copiedField === "public" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
