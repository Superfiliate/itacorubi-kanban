"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { contributorColorStyles } from "@/lib/contributor-colors";
import type { ContributorColor } from "@/db/schema";

export interface MentionContributorData {
  id: string;
  name: string;
  color: ContributorColor;
  email?: string | null;
}

/**
 * React component for rendering mention nodes in Tiptap.
 *
 * This component looks up the contributor by ID to display their current name and color,
 * ensuring that mentions automatically update when contributors are edited.
 *
 * The contributorsRef is passed via extension storage to access the latest contributor data.
 */
export function MentionNodeView({ node, extension }: NodeViewProps) {
  const { id, label } = node.attrs as { id: string; label: string };

  // Get contributors from extension storage (set by the extension configuration)
  const contributorsRef = extension.storage
    .contributorsRef as React.MutableRefObject<MentionContributorData[]> | null;

  // Look up the contributor by ID to get their current name and color
  const contributor = contributorsRef?.current.find((c) => c.id === id);

  // Use current data if found, otherwise fall back to stored label with default color
  const displayName = contributor?.name ?? label;
  const color: ContributorColor = contributor?.color ?? "blue";

  return (
    <NodeViewWrapper
      as="span"
      className={cn(
        "mention inline-flex items-center rounded-md px-1.5 py-0 text-xs font-medium",
        contributorColorStyles[color],
      )}
    >
      @{displayName}
    </NodeViewWrapper>
  );
}
