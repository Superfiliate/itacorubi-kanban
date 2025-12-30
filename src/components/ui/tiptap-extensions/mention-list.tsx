"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MailX } from "lucide-react";
import { cn } from "@/lib/utils";
import { contributorColorStyles } from "@/lib/contributor-colors";
import type { ContributorColor } from "@/db/schema";

export interface MentionContributor {
  id: string;
  name: string;
  color: ContributorColor;
  email?: string | null;
}

export interface MentionListProps {
  items: MentionContributor[];
  command: (item: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command({ id: item.id, label: item.name });
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="rounded-md border bg-popover p-2 shadow-md">
          <span className="text-sm text-muted-foreground">No contributors found</span>
        </div>
      );
    }

    return (
      <div className="rounded-md border bg-popover shadow-md overflow-hidden">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors",
              index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
            )}
            onClick={() => selectItem(index)}
          >
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                contributorColorStyles[item.color],
              )}
            >
              {item.name}
            </span>
            {!item.email && (
              <span
                className="text-muted-foreground"
                title="No email configured - won't receive notification"
              >
                <MailX className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        ))}
      </div>
    );
  },
);

MentionList.displayName = "MentionList";
