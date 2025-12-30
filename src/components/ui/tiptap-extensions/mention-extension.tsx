"use client";

import { ReactRenderer, ReactNodeViewRenderer } from "@tiptap/react";
import Mention from "@tiptap/extension-mention";
import { type SuggestionProps } from "@tiptap/suggestion";
import { MentionList, type MentionListRef, type MentionContributor } from "./mention-list";
import { MentionNodeView } from "./mention-node-view";

/**
 * Create a configured Mention extension with contributor suggestions.
 *
 * This extension:
 * - Uses a custom React node view to render mentions with contributor colors
 * - Looks up contributors by ID to display their current name/color (updates when edited)
 * - Stores contributorsRef in extension storage for access by the node view
 *
 * The contributorsRef allows updating contributors without recreating the extension.
 */
export function createMentionExtension(
  contributorsRef: React.MutableRefObject<MentionContributor[]>,
) {
  return Mention.extend({
    // Store contributorsRef in extension storage so node view can access it
    addStorage() {
      return {
        contributorsRef,
      };
    },

    // Use custom React node view for rendering mentions with contributor colors
    addNodeView() {
      return ReactNodeViewRenderer(MentionNodeView);
    },
  }).configure({
    HTMLAttributes: {
      class: "mention",
    },
    suggestion: {
      char: "@",
      allowSpaces: false,
      items: ({ query }) => {
        return contributorsRef.current
          .filter((contributor) => contributor.name.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 10);
      },
      render: () => {
        let component: ReactRenderer<MentionListRef> | null = null;
        let popup: HTMLDivElement | null = null;

        return {
          onStart: (props: SuggestionProps<MentionContributor>) => {
            component = new ReactRenderer(MentionList, {
              props: {
                items: props.items,
                command: props.command,
              },
              editor: props.editor,
            });

            if (!props.clientRect) return;

            popup = document.createElement("div");
            popup.style.position = "absolute";
            popup.style.zIndex = "50";
            document.body.appendChild(popup);

            const rect = props.clientRect();
            if (rect) {
              popup.style.left = `${rect.left + window.scrollX}px`;
              popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
            }

            popup.appendChild(component.element);
          },

          onUpdate: (props: SuggestionProps<MentionContributor>) => {
            component?.updateProps({
              items: props.items,
              command: props.command,
            });

            if (!props.clientRect || !popup) return;

            const rect = props.clientRect();
            if (rect) {
              popup.style.left = `${rect.left + window.scrollX}px`;
              popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
            }
          },

          onKeyDown: (props: { event: KeyboardEvent }) => {
            if (props.event.key === "Escape") {
              popup?.remove();
              component?.destroy();
              return true;
            }

            return component?.ref?.onKeyDown(props) ?? false;
          },

          onExit: () => {
            popup?.remove();
            component?.destroy();
          },
        };
      },
    },
  });
}

export { type MentionContributor };
