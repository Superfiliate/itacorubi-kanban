"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface EditableTextProps {
  value: string
  onSave: (value: string) => void | Promise<void>
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
  // Edit value is only used when editing - always initialized from prop when editing starts
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // When starting to edit, sync internal value with current prop value
  const startEditing = useCallback(() => {
    setEditValue(value)
    setIsEditing(true)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSave = useCallback((newValue: string) => {
    const trimmedValue = newValue.trim()
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue)
    } else if (!trimmedValue) {
      // Revert to prop value if empty
      setEditValue(value)
    }
  }, [onSave, value])

  const handleBlur = useCallback(() => {
    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsEditing(false)
    handleSave(editValue)
  }, [editValue, handleSave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // Clear any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsEditing(false)
      handleSave(editValue)
    } else if (e.key === "Escape") {
      // Clear any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsEditing(false)
      setEditValue(value)
    }
  }, [editValue, handleSave, value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setEditValue(newValue)

    // Debounced auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      const trimmedValue = newValue.trim()
      if (trimmedValue) {
        onSave(trimmedValue)
      }
    }, 1000)
  }, [onSave])

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
      onClick={startEditing}
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
