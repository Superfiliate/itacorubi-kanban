"use client";

import { useState } from "react";
import { Users, Share2, Tag } from "lucide-react";
import { EditableText } from "@/components/editable-text";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SyncIndicator } from "@/components/sync-indicator";
import {
  ContributorsDialog,
  type ContributorWithStats,
} from "@/components/board/contributors-dialog";
import { TagsDialog, type TagWithStats } from "@/components/board/tags-dialog";
import { ShareDialog } from "@/components/board/share-dialog";
import { useUpdateBoardTitle } from "@/hooks/use-board";

interface BoardHeaderProps {
  boardId: string;
  title: string;
  contributors: ContributorWithStats[];
  tags: TagWithStats[];
}

export function BoardHeader({ boardId, title, contributors, tags }: BoardHeaderProps) {
  const [isContributorsOpen, setIsContributorsOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const updateTitleMutation = useUpdateBoardTitle(boardId);

  const handleSave = (newTitle: string) => {
    updateTitleMutation.mutate(newTitle);
  };

  return (
    <header className="flex items-center gap-4 border-b glass glass-strong rounded-none px-6 py-4">
      <EditableText
        value={title}
        onSave={handleSave}
        as="h1"
        className="text-heading-lg"
        inputClassName="text-heading-lg"
      />
      <div className="ml-auto flex items-center gap-2">
        <SyncIndicator boardId={boardId} />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsShareOpen(true)}
          title="Share board"
          aria-label="Share board"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsContributorsOpen(true)}
          title="Manage contributors"
          aria-label="Manage contributors"
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsTagsOpen(true)}
          title="Manage tags"
          aria-label="Manage tags"
        >
          <Tag className="h-4 w-4" />
        </Button>
        <ThemeToggle boardId={boardId} />
      </div>

      <ShareDialog boardId={boardId} open={isShareOpen} onOpenChange={setIsShareOpen} />
      <ContributorsDialog
        boardId={boardId}
        contributors={contributors}
        open={isContributorsOpen}
        onOpenChange={setIsContributorsOpen}
      />
      <TagsDialog boardId={boardId} tags={tags} open={isTagsOpen} onOpenChange={setIsTagsOpen} />
    </header>
  );
}
