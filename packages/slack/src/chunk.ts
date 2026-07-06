const MAX_CHUNK_CHARS = 1000;

/**
 * Splits taught text into chunks of at most MAX_CHUNK_CHARS, preferring
 * paragraph boundaries so each chunk embeds as a coherent fact.
 */
export function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) {
    return [text];
  }

  const pieces = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .flatMap(hardSplit);

  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length + 2 > MAX_CHUNK_CHARS) {
      chunks.push(current);
      current = piece;
    } else {
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

/** A single paragraph over the limit gets cut at the limit. */
function hardSplit(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHUNK_CHARS) {
    return [paragraph];
  }
  const parts: string[] = [];
  for (let i = 0; i < paragraph.length; i += MAX_CHUNK_CHARS) {
    parts.push(paragraph.slice(i, i + MAX_CHUNK_CHARS));
  }
  return parts;
}
