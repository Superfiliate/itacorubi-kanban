"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTaskColumn } from "@/hooks/use-task";

interface StatusSelectProps {
  taskId: string;
  boardId: string;
  currentColumnId: string;
  columns: Array<{
    id: string;
    name: string;
  }>;
}

export function StatusSelect({ taskId, boardId, currentColumnId, columns }: StatusSelectProps) {
  const updateTaskColumnMutation = useUpdateTaskColumn(boardId);

  const handleValueChange = (columnId: string) => {
    if (columnId !== currentColumnId) {
      updateTaskColumnMutation.mutate({ taskId, newColumnId: columnId });
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="status-select" className="text-label">
        Status
      </label>
      <Select value={currentColumnId} onValueChange={handleValueChange}>
        <SelectTrigger id="status-select" className="w-full" aria-label="Status">
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
  );
}
