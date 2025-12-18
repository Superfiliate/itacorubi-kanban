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
import {
  useAddStakeholder,
  useRemoveStakeholder,
  useCreateAndAddStakeholder,
} from "@/hooks/use-task";
import type { ContributorColor } from "@/db/schema";

interface StakeholdersSelectProps {
  taskId: string;
  boardId: string;
  stakeholders: Array<{
    contributor: {
      id: string;
      name: string;
      color: ContributorColor;
    };
  }>;
  contributors: Array<{
    id: string;
    name: string;
    color: ContributorColor;
  }>;
}

export function StakeholdersSelect({
  taskId,
  boardId,
  stakeholders,
  contributors,
}: StakeholdersSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Mutations
  const addStakeholderMutation = useAddStakeholder(boardId);
  const removeStakeholderMutation = useRemoveStakeholder(boardId);
  const createAndAddMutation = useCreateAndAddStakeholder(boardId);

  const stakeholderIds = new Set(stakeholders.map((s) => s.contributor.id));

  const handleSelect = (contributorId: string) => {
    if (stakeholderIds.has(contributorId)) {
      removeStakeholderMutation.mutate({ taskId, contributorId });
    } else {
      addStakeholderMutation.mutate({ taskId, contributorId });
    }
    // Close after selecting to avoid focus/escape closing the whole sidebar (Sheet)
    setOpen(false);
    setInputValue("");
  };

  const handleCreateNew = () => {
    const name = inputValue.trim();
    if (name) {
      createAndAddMutation.mutate({ taskId, name });
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
    <div className="space-y-2">
      <label className="text-label">Stakeholders</label>

      {/* Selected stakeholders */}
      {stakeholders.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {stakeholders.map(({ contributor }) => (
            <ContributorBadge
              key={contributor.id}
              name={contributor.name}
              color={contributor.color}
              onRemove={() => handleSelect(contributor.id)}
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
            aria-label="Stakeholders"
            className="w-full justify-between"
          >
            {stakeholders.length === 0
              ? "Select stakeholders..."
              : `${stakeholders.length} selected`}
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
                    className="w-full px-2 py-1.5 text-left text-body hover:bg-accent"
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
                        stakeholderIds.has(contributor.id) ? "opacity-100" : "opacity-0",
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
    </div>
  );
}
