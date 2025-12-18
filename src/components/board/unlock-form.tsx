"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { unlockBoard } from "@/actions/unlock";

interface UnlockFormProps {
  boardId: string;
  initialPassword?: string;
  initialError?: string | null;
}

export function UnlockForm({ boardId, initialPassword, initialError }: UnlockFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState(initialPassword || "");
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Update error when initialError changes (e.g., from query params)
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const performUnlock = useCallback(
    async (passwordToUse: string) => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await unlockBoard(boardId, passwordToUse);
        if (result.success) {
          router.push(`/boards/${boardId}`);
          router.refresh();
        } else {
          setError(result.error || "Invalid password");
        }
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [boardId, router],
  );

  // Auto-submit when password is pre-filled and there's no error
  useEffect(() => {
    if (initialPassword && !initialError && !hasAutoSubmitted && !isLoading && password) {
      setHasAutoSubmitted(true);
      performUnlock(password);
    }
  }, [initialPassword, initialError, hasAutoSubmitted, isLoading, password, performUnlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performUnlock(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <PasswordInput
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          disabled={isLoading}
          aria-invalid={error ? true : undefined}
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Unlocking..." : "Unlock Board"}
      </Button>
    </form>
  );
}
