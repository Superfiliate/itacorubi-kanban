"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ContributorBadge } from "@/components/contributor-badge"
import type { ContributorColor } from "@/db/schema"
import { getRandomContributorColor } from "@/lib/contributor-colors"
import { useBoardStore } from "@/stores/board-store"
import { flushBoardOutbox } from "@/lib/outbox/flush"
import { useQueryClient } from "@tanstack/react-query"
import { boardKeys, type BoardData } from "@/hooks/use-board"

interface ContributorSelectProps {
  boardId: string
  selectedContributorId: string | null
  onContributorChange: (contributorId: string | null) => void
  contributors: Array<{
    id: string
    name: string
    color: ContributorColor
  }>
  placeholder?: string
  allowNone?: boolean
}

export function ContributorSelect({
  boardId,
  selectedContributorId,
  onContributorChange,
  contributors,
  placeholder = "Select contributor...",
  allowNone = false,
}: ContributorSelectProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const queryClient = useQueryClient()

  const selectedContributor = contributors.find((c) => c.id === selectedContributorId)

  const handleSelect = (contributorId: string | null) => {
    onContributorChange(contributorId)
    setOpen(false)
    setInputValue("")
  }

  const handleCreateNew = async () => {
    const name = inputValue.trim()
    if (name) {
      const contributorId = crypto.randomUUID()
      const color = getRandomContributorColor()

      useBoardStore.getState().createContributorLocal({ boardId, contributorId, name, color })

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          contributors: [...old.contributors, { id: contributorId, boardId, name, color }],
        }
      })

      useBoardStore.getState().enqueue({
        type: "createContributor",
        boardId,
        payload: { contributorId, name, color },
      })
      void flushBoardOutbox(boardId)

      onContributorChange(contributorId)
      setInputValue("")
      setOpen(false)
    }
  }

  const filteredContributors = inputValue
    ? contributors.filter((c) =>
        c.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : contributors

  const showCreateOption =
    inputValue.trim() &&
    !contributors.some(
      (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
    )

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
            <ContributorBadge
              name={selectedContributor.name}
              color={selectedContributor.color}
            />
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
              {allowNone && (
                <CommandItem onSelect={() => handleSelect(null)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedContributorId === null
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
              )}
              {filteredContributors.map((contributor) => (
                <CommandItem
                  key={contributor.id}
                  value={contributor.id}
                  onSelect={() => handleSelect(contributor.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedContributorId === contributor.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <ContributorBadge
                    name={contributor.name}
                    color={contributor.color}
                  />
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
  )
}
