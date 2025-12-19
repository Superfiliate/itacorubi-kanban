import { Node, mergeAttributes, nodePasteRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { LoomEmbedView } from "./loom-embed-view";

export interface LoomEmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    loomEmbed: {
      setLoomEmbed: (options: { videoId: string }) => ReturnType;
    };
  }
}

/**
 * Regex to match Loom share URLs and extract the video ID.
 * Matches:
 * - https://www.loom.com/share/{videoId}
 * - https://loom.com/share/{videoId}
 * - With optional query params
 */
const LOOM_URL_REGEX = /https?:\/\/(www\.)?loom\.com\/share\/([a-zA-Z0-9]+)(\?[^\s]*)?/g;

/**
 * TipTap extension for embedding Loom videos.
 * Automatically converts pasted Loom share URLs into embedded players.
 */
export const LoomEmbed = Node.create<LoomEmbedOptions>({
  name: "loomEmbed",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      videoId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-loom-embed]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { videoId } = HTMLAttributes;
    const embedUrl = `https://www.loom.com/embed/${videoId}`;

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-loom-embed": "",
        class: "my-2",
      }),
      [
        "iframe",
        {
          src: embedUrl,
          frameborder: "0",
          allowfullscreen: "true",
          class: "w-full aspect-video rounded-md",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LoomEmbedView);
  },

  addCommands() {
    return {
      setLoomEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: LOOM_URL_REGEX,
        type: this.type,
        getAttributes: (match) => {
          // match[2] is the videoId captured group
          return { videoId: match[2] };
        },
      }),
    ];
  },
});
