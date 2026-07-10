import api from "./axios";

export async function testRetrieval(payload) {
  const response = await api.post("/admin/retrieval/test", payload);
  return response.data;
}

export async function getSourceQualitySummary() {
  const response = await api.get("/admin/retrieval/source-quality");
  return response.data;
}

export async function previewChunk(chunkId) {
  const response = await api.get(`/admin/retrieval/chunks/${chunkId}`);
  return response.data;
}