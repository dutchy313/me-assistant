import api from "./axios";

export async function prepareVectorCollection() {
  const response = await api.post("/admin/vectors/prepare-collection");
  return response.data;
}

export async function embedPendingChunks(limit = 25) {
  const response = await api.post("/admin/vectors/embed-chunks", {
    limit
  });

  return response.data;
}

export async function resetFailedEmbeddings() {
  const response = await api.post("/admin/vectors/reset-failed");
  return response.data;
}

export async function getVectorStats() {
  const response = await api.get("/admin/vectors/stats");
  return response.data;
}

export async function semanticVectorSearch(payload) {
  const response = await api.post("/admin/vectors/search", payload);
  return response.data;
}