"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateTaskColumn } from "@/actions/tasks"

interface StatusSelectProps {
  taskId: string
  boardId: string
  currentColumnId: string
  columns: Array<{
    id: string
    name: string
  }>
}

export function StatusSelect({
  taskId,
  boardId,
  currentColumnId,
  columns,
}: StatusSelectProps) {
  const handleValueChange = async (columnId: string) => {
    if (columnId !== currentColumnId) {
      await updateTaskColumn(taskId, columnId, boardId)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-label">Status</label>
      <Select value={currentColumnId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {columns.map((column) => (
            <SelectItem key={column.id} value={column.id}>
              {column.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
