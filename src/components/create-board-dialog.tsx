"use client";

import { useState, useEffect } from "react";
import { createBoard } from "@/actions/boards";
import { RANDOM_EMOJIS } from "@/lib/emojis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

// Generate a strong, URL-safe password using Web Crypto
function generateSuggestedPassword(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const buffer = new Uint8Array(length * 2); // extra space to allow discards
  let password = "";
  let cursor = 0;

  const fillBuffer = () => {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(buffer);
    } else {
      // Fallback for environments without Web Crypto (should be rare)
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
    }
    cursor = 0;
  };

  fillBuffer();

  while (password.length < length) {
    if (cursor >= buffer.length) {
      fillBuffer();
    }

    const byte = buffer[cursor++];
    // 62 * 4 = 248 → discard high values to avoid modulo bias
    if (byte >= 248) continue;
    password += chars[byte % chars.length];
  }

  return password;
}

// Generate a creative suggested title with emoji
function generateSuggestedTitle(): string {
  const titles = [
    "My Awesome Board",
    "Project Hub",
    "Team Workspace",
    "Task Central",
    "The Command Center",
    "Ideas & Dreams",
    "Action Items",
    "The Launchpad",
    "Creative Space",
    "Mission Control",
    "The Workspace",
    "Project Pipeline",
    "Task Tracker",
    "The Dashboard",
    "Workflow Hub",
    "The Boardroom",
    "Project Canvas",
    "Task Master",
    "The Playground",
    "Innovation Lab",
  ];

  const emoji = RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];
  const title = titles[Math.floor(Math.random() * titles.length)];

  return `${emoji} ${title}`;
}

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Generate suggested title and password when dialog opens
  useEffect(() => {
    if (open) {
      // Always generate new suggestions when opening
      const suggestedTitle = generateSuggestedTitle();
      const suggestedPassword = generateSuggestedPassword();
      setTitle(suggestedTitle);
      setPassword(suggestedPassword);
    } else {
      // Clear fields when closing
      setTitle("");
      setPassword("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await createBoard(title.trim(), password.trim());
      // If we get here, redirect didn't happen (shouldn't happen)
      setIsCreating(false);
    } catch (error: unknown) {
      // Check if this is a redirect error (NEXT_REDIRECT)
      // Next.js redirect() throws a special error that we should let propagate
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        // This is a Next.js redirect - let it propagate
        throw error;
      }
      console.error("Failed to create board:", error);
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Board</DialogTitle>
          <DialogDescription>
            Give your board a title and set a password to protect it. Both fields have been
            prefilled with suggestions, but you can change them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-label">
                Title
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter board title"
                // oxlint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-label">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                This password will be required to access the board. Make sure to save it or share it
                with collaborators.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !password.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
