// Cool emojis for randomizing board/column/task names
export const RANDOM_EMOJIS = [
  "🚀",
  "⚡",
  "🎯",
  "💡",
  "🔥",
  "✨",
  "🌟",
  "💎",
  "🎨",
  "🧠",
  "🤖",
  "⚓",
  "🏆",
  "🎪",
  "🌈",
  "🦄",
  "🍀",
  "🎸",
  "🎲",
  "🧩",
  "🎭",
  "🔮",
  "🧲",
  "🎬",
  "🛸",
  "🌊",
  "🦋",
  "🔔",
  "🎁",
  "🏄",
  "🎤",
  "🧪",
  "🔑",
  "🌸",
  "🍕",
] as const;

export function getRandomEmoji(): string {
  const index = Math.floor(Math.random() * RANDOM_EMOJIS.length);
  return RANDOM_EMOJIS[index];
}
