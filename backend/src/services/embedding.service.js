import OpenAI from "openai";

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export function getEmbeddingConfig() {
  return {
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    dimensions: Number(process.env.OPENAI_EMBEDDING_DIMENSIONS || 1536)
  };
}

export async function createEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error("Text is required to create an embedding");
  }

  const client = getOpenAIClient();
  const { model, dimensions } = getEmbeddingConfig();

  const response = await client.embeddings.create({
    model,
    input: text,
    dimensions
  });

  const embedding = response.data?.[0]?.embedding;

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("OpenAI did not return a valid embedding");
  }

  return {
    embedding,
    model,
    dimensions,
    usage: response.usage || null
  };
}