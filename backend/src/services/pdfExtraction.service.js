import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");

const pdfParse = pdfParseModule.default || pdfParseModule;

export async function extractTextFromPdfBuffer(pdfBuffer) {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("PDF buffer is empty");
  }

  if (typeof pdfParse !== "function") {
    throw new Error(
      "pdf-parse did not load as a function. Please install pdf-parse@1.1.1."
    );
  }

  const parsed = await pdfParse(pdfBuffer);

  const rawText = parsed.text || "";
  const text = normalizeExtractedText(rawText);

  return {
    text,
    rawTextLength: rawText.length,
    cleanedTextLength: text.length,
    pageCount: parsed.numpages || 0,
    info: parsed.info || {}
  };
}

function normalizeExtractedText(text) {
  if (!text) {
    return "";
  }

  let cleanedText = text;

  cleanedText = normalizeLineEndings(cleanedText);
  cleanedText = removePdfControlCharacters(cleanedText);
  cleanedText = normalizeCommonLigatures(cleanedText);
  cleanedText = fixBrokenHyphenatedWords(cleanedText);
  cleanedText = normalizeSpacing(cleanedText);
  cleanedText = removeLikelyNoiseLines(cleanedText);
  cleanedText = mergeBrokenParagraphLines(cleanedText);
  cleanedText = normalizeFinalWhitespace(cleanedText);

  return cleanedText;
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function removePdfControlCharacters(text) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\u000c/g, "\n")
    .replace(/[\u0001-\u0008\u000b\u000e-\u001f\u007f]/g, "");
}

function normalizeCommonLigatures(text) {
  return text
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe");
}

function fixBrokenHyphenatedWords(text) {
  let cleanedText = text;

  cleanedText = cleanedText.replace(
    /([A-Za-z])-\s*\n\s*([a-z])/g,
    "$1$2"
  );

  cleanedText = cleanedText.replace(
    /([A-Za-z])-\s+([a-z]{2,})/g,
    "$1$2"
  );

  cleanedText = cleanedText.replace(
    /([A-Za-z]{3,})-\s+([A-Za-z]{2,})/g,
    "$1$2"
  );

  return cleanedText;
}

function normalizeSpacing(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n");
}

function removeLikelyNoiseLines(text) {
  const lines = text.split("\n");
  const cleanedLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      cleanedLines.push("");
      continue;
    }

    if (isLikelyNoiseLine(trimmedLine)) {
      continue;
    }

    cleanedLines.push(trimmedLine);
  }

  return cleanedLines.join("\n");
}

function isLikelyNoiseLine(line) {
  const lowerLine = line.toLowerCase();

  if (line.length <= 2 && /^\d+$/.test(line)) {
    return true;
  }

  if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line)) {
    return true;
  }

  if (/^\d+\s*$/.test(line) && Number(line) > 0 && Number(line) < 10000) {
    return true;
  }

  if (lowerLine.includes("stockman print.indd")) {
    return true;
  }

  if (lowerLine.includes(".indd")) {
    return true;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}/.test(line)) {
    return true;
  }

  if (/^isbn\s+/i.test(line) && line.length < 40) {
    return true;
  }

  if (/^copyright\s+©?/i.test(line) && line.length < 120) {
    return true;
  }

  if (/^all rights reserved\.?$/i.test(line)) {
    return true;
  }

  if (/^printed in/i.test(line) && line.length < 80) {
    return true;
  }

  if (/^chapter\s+\d+$/i.test(line)) {
    return false;
  }

  if (looksLikeMostlySymbols(line)) {
    return true;
  }

  return false;
}

function looksLikeMostlySymbols(line) {
  if (line.length < 10) {
    return false;
  }

  const symbolCount = (line.match(/[^A-Za-z0-9\s.,;:?!'"()[\]{}\-–—/]/g) || [])
    .length;

  return symbolCount / line.length > 0.45;
}

function mergeBrokenParagraphLines(text) {
  const lines = text.split("\n");
  const paragraphs = [];
  let currentParagraph = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = "";
      }

      paragraphs.push("");
      continue;
    }

    if (shouldStartNewParagraph(line, currentParagraph)) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }

      currentParagraph = line;
      continue;
    }

    if (!currentParagraph) {
      currentParagraph = line;
      continue;
    }

    if (shouldMergeWithPreviousLine(currentParagraph, line)) {
      currentParagraph = `${currentParagraph} ${line}`;
    } else {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = line;
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs.join("\n");
}

function shouldStartNewParagraph(line, currentParagraph) {
  if (!currentParagraph) {
    return false;
  }

  if (/^chapter\s+\d+/i.test(line)) {
    return true;
  }

  if (/^(figure|table|box)\s+\d+(\.\d+)?/i.test(line)) {
    return true;
  }

  if (/^\d+(\.\d+)*\s+[A-Z]/.test(line)) {
    return true;
  }

  if (/^[A-Z][A-Z\s:,-]{8,}$/.test(line) && line.length < 100) {
    return true;
  }

  if (currentParagraph.endsWith(".") && /^[A-Z][A-Za-z\s]{2,}:$/.test(line)) {
    return true;
  }

  return false;
}

function shouldMergeWithPreviousLine(previousLine, currentLine) {
  if (!previousLine) {
    return false;
  }

  if (/^[•\-–—]\s+/.test(currentLine)) {
    return false;
  }

  if (/^\d+[\).]\s+/.test(currentLine)) {
    return false;
  }

  if (/^(figure|table|box)\s+\d+(\.\d+)?/i.test(currentLine)) {
    return false;
  }

  if (/^chapter\s+\d+/i.test(currentLine)) {
    return false;
  }

  if (/^[A-Z][A-Z\s:,-]{8,}$/.test(currentLine) && currentLine.length < 100) {
    return false;
  }

  if (previousLine.endsWith(".") || previousLine.endsWith("?") || previousLine.endsWith("!")) {
    if (/^[A-Z]/.test(currentLine)) {
      return false;
    }
  }

  return true;
}

function normalizeFinalWhitespace(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ +([.,;:?!])/g, "$1")
    .replace(/([([{]) +/g, "$1")
    .replace(/ +([)\]}])/g, "$1")
    .trim();
}