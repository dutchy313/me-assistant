import crypto from "crypto";

function getQdrantConfig() {
  if (!process.env.QDRANT_URL) {
    throw new Error("QDRANT_URL is missing");
  }

  if (!process.env.QDRANT_API_KEY) {
    throw new Error("QDRANT_API_KEY is missing");
  }

  return {
    url: process.env.QDRANT_URL.replace(/\/$/, ""),
    apiKey: process.env.QDRANT_API_KEY,
    collectionName:
      process.env.QDRANT_COLLECTION_NAME || "me_assistant_chunks",
    dimensions: Number(process.env.OPENAI_EMBEDDING_DIMENSIONS || 1536)
  };
}

async function qdrantRequest(path, options = {}) {
  const { url, apiKey } = getQdrantConfig();

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      data?.status?.error ||
        data?.message ||
        `Qdrant request failed: ${response.status}`
    );
  }

  return data;
}

export async function ensureQdrantCollection() {
  const { collectionName, dimensions } = getQdrantConfig();

  try {
    await qdrantRequest(`/collections/${collectionName}`, {
      method: "GET"
    });

    return {
      collectionName,
      created: false
    };
  } catch (error) {
    await qdrantRequest(`/collections/${collectionName}`, {
      method: "PUT",
      body: JSON.stringify({
        vectors: {
          size: dimensions,
          distance: "Cosine"
        }
      })
    });

    return {
      collectionName,
      created: true
    };
  }
}

export async function upsertChunkVector({ pointId, vector, payload }) {
  const { collectionName } = getQdrantConfig();

  return qdrantRequest(`/collections/${collectionName}/points?wait=true`, {
    method: "PUT",
    body: JSON.stringify({
      points: [
        {
          id: pointId,
          vector,
          payload
        }
      ]
    })
  });
}

export async function searchChunkVectors({ vector, limit = 5 }) {
  const { collectionName } = getQdrantConfig();

  return qdrantRequest(`/collections/${collectionName}/points/query`, {
    method: "POST",
    body: JSON.stringify({
      query: vector,
      limit,
      with_payload: true
    })
  });
}

export function createQdrantPointId(chunkId) {
  const hash = crypto
    .createHash("sha256")
    .update(chunkId.toString())
    .digest("hex")
    .slice(0, 32);

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32)
  ].join("-");
}