"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ContributorBadge } from "@/components/contributor-badge";
import { useQueryClient } from "@tanstack/react-query";
import { boardKeys, type BoardData } from "@/hooks/use-board";
import type { ContributorColor } from "@/db/schema";
import { getRandomContributorColor } from "@/lib/contributor-colors";
import { useBoardStore } from "@/stores/board-store";
import { flushBoardOutbox } from "@/lib/outbox/flush";

function getStorageKey(boardId: string) {
  return `kanban-author-${boardId}`;
}

export function getRememberedAuthor(boardId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getStorageKey(boardId));
}

export function setRememberedAuthor(boardId: string, authorId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(boardId), authorId);
}

interface AuthorSelectProps {
  boardId: string;
  selectedAuthorId: string | null;
  onAuthorChange: (authorId: string) => void;
  contributors: Array<{
    id: string;
    name: string;
    color: ContributorColor;
  }>;
  placeholder?: string;
}

export function AuthorSelect({
  boardId,
  selectedAuthorId,
  onAuthorChange,
  contributors,
  placeholder = "Select author...",
}: AuthorSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const queryClient = useQueryClient();

  const selectedContributor = contributors.find((c) => c.id === selectedAuthorId);

  const handleSelect = (contributorId: string) => {
    onAuthorChange(contributorId);
    setRememberedAuthor(boardId, contributorId);
    setOpen(false);
  };

  const handleCreateNew = async () => {
    const name = inputValue.trim();
    if (name) {
      const contributorId = crypto.randomUUID();
      const color = getRandomContributorColor();

      useBoardStore.getState().createContributorLocal({ boardId, contributorId, name, color });

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old;
        return {
          ...old,
          contributors: [...old.contributors, { id: contributorId, boardId, name, color }],
        };
      });

      useBoardStore.getState().enqueue({
        type: "createContributor",
        boardId,
        payload: { contributorId, name, color },
      });
      void flushBoardOutbox(boardId);

      onAuthorChange(contributorId);
      setRememberedAuthor(boardId, contributorId);
      setInputValue("");
      setOpen(false);
    }
  };

  const filteredContributors = inputValue
    ? contributors.filter((c) => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    : contributors;

  const showCreateOption =
    inputValue.trim() &&
    !contributors.some((c) => c.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          asInput
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className="w-full justify-between"
        >
          {selectedContributor ? (
            <ContributorBadge name={selectedContributor.name} color={selectedContributor.color} />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <button
                  onClick={handleCreateNew}
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  Create &quot;{inputValue.trim()}&quot;
                </button>
              ) : (
                "Type a name to add someone"
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredContributors.map((contributor) => (
                <CommandItem
                  key={contributor.id}
                  value={contributor.id}
                  onSelect={() => handleSelect(contributor.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedAuthorId === contributor.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <ContributorBadge name={contributor.name} color={contributor.color} />
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem onSelect={handleCreateNew}>
                  <span className="text-muted-foreground">Create</span>
                  &nbsp;&quot;{inputValue.trim()}&quot;
                </CommandItem>
              )}
              {filteredContributors.length > 0 && !inputValue.trim() && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground/70">
                  Type to add someone new
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
