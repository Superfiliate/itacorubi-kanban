"use client"

import { useState } from "react"
import { Check, X, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { addAssignee, removeAssignee, createAndAssignContributor } from "@/actions/contributors"

interface AssigneesSelectProps {
  taskId: string
  boardId: string
  assignees: Array<{
    contributor: {
      id: string
      name: string
    }
  }>
  contributors: Array<{
    id: string
    name: string
  }>
}

export function AssigneesSelect({
  taskId,
  boardId,
  assignees,
  contributors,
}: AssigneesSelectProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const assigneeIds = new Set(assignees.map((a) => a.contributor.id))

  const handleSelect = async (contributorId: string) => {
    if (assigneeIds.has(contributorId)) {
      await removeAssignee(taskId, contributorId, boardId)
    } else {
      await addAssignee(taskId, contributorId, boardId)
    }
  }

  const handleCreateNew = async () => {
    const name = inputValue.trim()
    if (name) {
      await createAndAssignContributor(taskId, boardId, name)
      setInputValue("")
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
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Assignees</label>

      {/* Selected assignees */}
      {assignees.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {assignees.map(({ contributor }) => (
            <Badge
              key={contributor.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {contributor.name}
              <button
                onClick={() => handleSelect(contributor.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {assignees.length === 0
              ? "Select assignees..."
              : `${assignees.length} selected`}
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
                  "No contributors found."
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
                        assigneeIds.has(contributor.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {contributor.name}
                  </CommandItem>
                ))}
                {showCreateOption && (
                  <CommandItem onSelect={handleCreateNew}>
                    <span className="text-muted-foreground">Create</span>
                    &nbsp;&quot;{inputValue.trim()}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
