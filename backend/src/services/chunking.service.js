const DEFAULT_CHUNK_SIZE = 3000;
const DEFAULT_OVERLAP_SIZE = 350;

export function splitTextIntoChunks(text, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const overlapSize = options.overlapSize || DEFAULT_OVERLAP_SIZE;

  if (!text || !text.trim()) {
    return [];
  }

  const cleanText = text.trim();
  const chunks = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanText.length) {
    const targetEnd = Math.min(start + chunkSize, cleanText.length);
    const end = findSmartBreak(cleanText, start, targetEnd);

    const chunkText = cleanText.slice(start, end).trim();

    if (chunkText.length > 0) {
      chunks.push({
        chunkIndex,
        text: chunkText,
        tokenCount: estimateTokenCount(chunkText)
      });

      chunkIndex += 1;
    }

    if (end >= cleanText.length) {
      break;
    }

    start = Math.max(0, end - overlapSize);
  }

  return chunks;
}

function findSmartBreak(text, start, targetEnd) {
  if (targetEnd >= text.length) {
    return text.length;
  }

  const searchWindow = text.slice(start, targetEnd);

  const paragraphBreak = searchWindow.lastIndexOf("\n\n");
  if (paragraphBreak > 1000) {
    return start + paragraphBreak;
  }

  const sentenceBreak = Math.max(
    searchWindow.lastIndexOf(". "),
    searchWindow.lastIndexOf("? "),
    searchWindow.lastIndexOf("! ")
  );

  if (sentenceBreak > 1000) {
    return start + sentenceBreak + 1;
  }

  const spaceBreak = searchWindow.lastIndexOf(" ");
  if (spaceBreak > 1000) {
    return start + spaceBreak;
  }

  return targetEnd;
}

export function estimateTokenCount(text) {
  if (!text) return 0;

  return Math.ceil(text.length / 4);
}