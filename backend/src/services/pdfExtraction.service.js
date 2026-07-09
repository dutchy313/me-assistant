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

  const text = normalizeExtractedText(parsed.text || "");

  return {
    text,
    pageCount: parsed.numpages || 0,
    info: parsed.info || {}
  };
}

function normalizeExtractedText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}