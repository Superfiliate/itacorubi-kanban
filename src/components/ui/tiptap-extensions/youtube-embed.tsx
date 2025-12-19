import { Node, mergeAttributes, nodePasteRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { YouTubeEmbedView } from "./youtube-embed-view";

export interface YouTubeEmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      setYouTubeEmbed: (options: { videoId: string }) => ReturnType;
    };
  }
}

/**
 * Extract YouTube video ID from various URL formats.
 * Returns the video ID or null if not a valid YouTube URL.
 */
function extractYouTubeVideoId(url: string): string | null {
  // youtube.com/watch?v=ID (v parameter can be anywhere in query string)
  const watchMatch = url.match(/youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Combined regex to match any YouTube URL format.
 * Uses a simpler pattern that catches all formats, then extracts ID in getAttributes.
 */
const YOUTUBE_URL_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)[^\s]*/g;

/**
 * TipTap extension for embedding YouTube videos.
 * Automatically converts pasted YouTube URLs into embedded players.
 */
export const YouTubeEmbed = Node.create<YouTubeEmbedOptions>({
  name: "youtubeEmbed",

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
        tag: "div[data-youtube-embed]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { videoId } = HTMLAttributes;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-youtube-embed": "",
        class: "my-2",
      }),
      [
        "iframe",
        {
          src: embedUrl,
          frameborder: "0",
          allowfullscreen: "true",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          class: "w-full aspect-video rounded-md",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeEmbedView);
  },

  addCommands() {
    return {
      setYouTubeEmbed:
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
        find: YOUTUBE_URL_REGEX,
        type: this.type,
        getAttributes: (match) => {
          // Extract video ID from the full matched URL
          const videoId = extractYouTubeVideoId(match[0]);
          return videoId ? { videoId } : false;
        },
      }),
    ];
  },
});
