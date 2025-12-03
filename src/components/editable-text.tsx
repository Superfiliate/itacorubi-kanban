"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface EditableTextProps {
  value: string
  onSave: (value: string) => Promise<void>
  className?: string
  inputClassName?: string
  placeholder?: string
  as?: "h1" | "h2" | "span" | "p"
}

export function EditableText({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = "Untitled",
  as: Component = "span",
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = useCallback(async (newValue: string) => {
    const trimmedValue = newValue.trim()
    if (trimmedValue && trimmedValue !== value) {
      await onSave(trimmedValue)
    } else {
      setEditValue(value)
    }
  }, [value, onSave])

  const handleBlur = () => {
    setIsEditing(false)
    handleSave(editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setIsEditing(false)
      handleSave(editValue)
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(value)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setEditValue(newValue)

    // Debounced auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      handleSave(newValue)
    }, 1000)
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-auto py-1", inputClassName)}
        placeholder={placeholder}
      />
    )
  }

  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer rounded px-1 transition-colors hover:bg-accent",
        className
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </Component>
  )
}
