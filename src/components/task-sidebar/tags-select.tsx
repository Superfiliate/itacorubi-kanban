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
import { TagBadge } from "@/components/tag-badge";
import { useAddTag, useRemoveTag, useCreateAndAddTag } from "@/hooks/use-task";
import type { ContributorColor } from "@/db/schema";
import { ensureTagHasHash } from "@/lib/tag-utils";

interface TagsSelectProps {
  taskId: string;
  boardId: string;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: ContributorColor;
    };
  }>;
  allTags: Array<{
    id: string;
    name: string;
    color: ContributorColor;
  }>;
}

export function TagsSelect({ taskId, boardId, tags, allTags }: TagsSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Mutations
  const addTagMutation = useAddTag(boardId);
  const removeTagMutation = useRemoveTag(boardId);
  const createAndAddMutation = useCreateAndAddTag(boardId);

  const tagIds = new Set(tags.map((t) => t.tag.id));

  const handleSelect = (tagId: string) => {
    if (tagIds.has(tagId)) {
      removeTagMutation.mutate({ taskId, tagId });
    } else {
      addTagMutation.mutate({ taskId, tagId });
    }
    // Close after selecting to avoid focus/escape closing the whole sidebar (Sheet)
    setOpen(false);
    setInputValue("");
  };

  const handleCreateNew = () => {
    const name = inputValue.trim();
    if (name) {
      // Ensure tag name starts with "#" (the hook will also ensure this, but we do it here for consistency)
      const normalizedName = ensureTagHasHash(name);
      createAndAddMutation.mutate({ taskId, name: normalizedName });
      setInputValue("");
      setOpen(false);
    }
  };

  const filteredTags = inputValue
    ? allTags.filter((t) => t.name.toLowerCase().includes(inputValue.toLowerCase()))
    : allTags;

  const showCreateOption =
    inputValue.trim() &&
    !allTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  const labelId = "tags-label";
  const listboxId = "tags-listbox";

  return (
    <div className="space-y-2">
      <span id={labelId} className="text-label">
        Tags
      </span>

      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map(({ tag }) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => handleSelect(tag.id)}
            />
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            asInput
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-labelledby={labelId}
            className="w-full justify-between"
          >
            {tags.length === 0 ? "Select tags..." : `${tags.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent id={listboxId} className="w-[300px] p-0" align="start">
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
                    className="w-full px-2 py-1.5 text-left text-body hover:bg-accent"
                  >
                    Create &quot;{inputValue.trim()}&quot;
                  </button>
                ) : (
                  "Type a name to add a tag"
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem key={tag.id} value={tag.id} onSelect={() => handleSelect(tag.id)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        tagIds.has(tag.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <TagBadge name={tag.name} color={tag.color} />
                  </CommandItem>
                ))}
                {showCreateOption && (
                  <CommandItem onSelect={handleCreateNew}>
                    <span className="text-muted-foreground">Create</span>
                    &nbsp;&quot;{inputValue.trim()}&quot;
                  </CommandItem>
                )}
                {filteredTags.length > 0 && !inputValue.trim() && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground/70">
                    Type to add a new tag
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
