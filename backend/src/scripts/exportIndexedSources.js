import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Document from "../models/Document.js";
import SourceChunk from "../models/SourceChunk.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../../INDEXED_SOURCES.md"
);

function escapeMarkdown(value = "") {
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function getDisplayTitle(document) {
  return (
    document.canonicalTitle?.trim() ||
    document.title?.trim() ||
    document.fileName?.trim() ||
    "Untitled resource"
  );
}

function getAuthors(document) {
  if (Array.isArray(document.authors) && document.authors.length > 0) {
    return document.authors.filter(Boolean).join(", ");
  }

  if (document.author?.trim()) {
    return document.author.trim();
  }

  return "Not specified";
}

function getYear(document) {
  return document.publicationYear || "—";
}

function getPublisher(document) {
  return document.publisher?.trim() || "—";
}

function formatSourceType(sourceType = "") {
  const value = sourceType?.trim();

  if (!value) {
    return "Other";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function main() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to backend/.env before running this script."
    );
  }

  console.log("Connecting to MongoDB...");

  await mongoose.connect(mongodbUri);

  console.log("MongoDB connected.");

  /*
   * Step 1:
   * Find documents that the application considers indexed and active.
   */
  const indexedDocuments = await Document.find({
    status: "indexed",
    isActive: true
  })
    .select({
      title: 1,
      canonicalTitle: 1,
      author: 1,
      authors: 1,
      publicationYear: 1,
      publisher: 1,
      citationLabel: 1,
      sourceType: 1,
      fileName: 1,
      totalChunks: 1,
      indexedAt: 1,
      metadataStatus: 1
    })
    .lean();

  if (indexedDocuments.length === 0) {
    console.log("No indexed documents were found.");
    return;
  }

  /*
   * Step 2:
   * Count active, successfully embedded chunks for each indexed document.
   *
   * This prevents us from publishing a resource in the README when its
   * document record says "indexed" but it does not actually have usable
   * vectors/chunks.
   */
  const documentIds = indexedDocuments.map((document) => document._id);

  const embeddedChunkCounts = await SourceChunk.aggregate([
    {
      $match: {
        documentId: {
          $in: documentIds
        },
        embeddingStatus: "embedded",
        isActive: true
      }
    },
    {
      $group: {
        _id: "$documentId",
        embeddedChunks: {
          $sum: 1
        }
      }
    }
  ]);

  const embeddedCountByDocumentId = new Map(
    embeddedChunkCounts.map((item) => [
      String(item._id),
      item.embeddedChunks
    ])
  );

  /*
   * Step 3:
   * Keep only resources that genuinely have embedded chunks.
   */
  const usableDocuments = indexedDocuments
    .map((document) => ({
      ...document,
      embeddedChunks:
        embeddedCountByDocumentId.get(String(document._id)) || 0
    }))
    .filter((document) => document.embeddedChunks > 0)
    .sort((a, b) =>
      getDisplayTitle(a).localeCompare(getDisplayTitle(b), undefined, {
        sensitivity: "base"
      })
    );

  /*
   * Step 4:
   * Produce README-friendly Markdown.
   */
  const generatedAt = new Date().toISOString();

  const lines = [
    "# M&E Assistant Knowledge Base",
    "",
    "M&E Assistant is a source-backed Monitoring and Evaluation assistant for lecturers, students, trainees, and practitioners.",
    "",
    "The resources below form part of the assistant's private retrieval knowledge base. They have been successfully processed and contain embedded source chunks that can be retrieved when answering Monitoring and Evaluation questions.",
    "",
    `**Successfully indexed and retrievable resources:** ${usableDocuments.length}`,
    "",
    `**Last generated:** ${generatedAt}`,
    "",
    "## Indexed Source Library",
    "",
    "| # | Resource | Author / Organisation | Year | Type | Publisher | Embedded Chunks |",
    "|---:|---|---|---:|---|---|---:|"
  ];

  usableDocuments.forEach((document, index) => {
    const title = escapeMarkdown(getDisplayTitle(document));
    const authors = escapeMarkdown(getAuthors(document));
    const year = escapeMarkdown(getYear(document));
    const type = escapeMarkdown(formatSourceType(document.sourceType));
    const publisher = escapeMarkdown(getPublisher(document));
    const embeddedChunks = document.embeddedChunks;

    lines.push(
      `| ${index + 1} | ${title} | ${authors} | ${year} | ${type} | ${publisher} | ${embeddedChunks.toLocaleString()} |`
    );
  });

  lines.push(
    "",
    "## About the Source Library",
    "",
    "The source library contains books, manuals, guides, reports, and other Monitoring and Evaluation resources used to support source-backed responses.",
    "",
    "M&E Assistant retrieves relevant passages from this private library and uses those passages as context when generating answers. Where available, responses include citations that allow users to trace information back to the underlying source.",
    "",
    "> **Copyright notice:** Listing a resource here does not imply that the source document is licensed for redistribution. Copyrighted source files are not distributed through this repository.",
    "",
    "> **Important:** M&E Assistant is designed to support learning and professional practice. AI-generated responses should still be assessed using appropriate professional judgement, contextual knowledge, and the original cited sources.",
    ""
  );

  await fs.writeFile(
    OUTPUT_PATH,
    `${lines.join("\n")}\n`,
    "utf8"
  );

  const indexedButNotEmbedded =
    indexedDocuments.length - usableDocuments.length;

  const totalEmbeddedChunks = usableDocuments.reduce(
    (sum, document) => sum + document.embeddedChunks,
    0
  );

  console.log("");
  console.log("Export complete.");
  console.log(`Document records marked indexed: ${indexedDocuments.length}`);
  console.log(
    `Indexed documents with embedded chunks: ${usableDocuments.length}`
  );
  console.log(
    `Indexed documents without usable embedded chunks: ${indexedButNotEmbedded}`
  );
  console.log(
    `Total embedded chunks represented: ${totalEmbeddedChunks.toLocaleString()}`
  );
  console.log(`Output: ${OUTPUT_PATH}`);
}

main()
  .catch((error) => {
    console.error("");
    console.error("Failed to export indexed sources.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });