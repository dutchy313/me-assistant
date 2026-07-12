import api from "./axios";

export async function getAdminDocuments({
  page = 1,
  limit = 20,
  status = "",
  metadataStatus = "",
  ocrStatus = ""
} = {}) {
  const response = await api.get("/admin/documents", {
    params: {
      page,
      limit,
      status,
      metadataStatus,
      ocrStatus
    }
  });

  return response.data;
}

export async function getSingleDocument(documentId) {
  const response = await api.get(`/admin/documents/${documentId}`);
  return response.data;
}

export async function updateDocumentMetadata(documentId, payload) {
  const response = await api.patch(
    `/admin/documents/${documentId}/metadata`,
    payload
  );

  return response.data;
}

export async function suggestDocumentMetadata(documentId) {
  const response = await api.post(
    `/admin/documents/${documentId}/suggest-metadata`
  );

  return response.data;
}

export async function suggestMetadataBatch(limit = 3) {
  const response = await api.post("/admin/documents/suggest-metadata-batch", {
    limit
  });

  return response.data;
}

export async function reprocessDocument(documentId) {
  const response = await api.post(`/admin/documents/${documentId}/reprocess`);
  return response.data;
}

export async function runOcrDocument(documentId) {
  const response = await api.post(`/admin/documents/${documentId}/run-ocr`);
  return response.data;
}

export async function prepareOcrQueue() {
  const response = await api.post("/admin/documents/prepare-ocr-queue");
  return response.data;
}

export async function syncGoogleDriveDocuments() {
  const response = await api.post("/admin/documents/sync-drive");
  return response.data;
}

export async function processPendingDocuments(limit = 3) {
  const response = await api.post("/admin/documents/process", {
    limit
  });

  return response.data;
}

export async function resetFailedDocuments() {
  const response = await api.post("/admin/documents/reset-failed");
  return response.data;
}

export async function getIngestionLogs() {
  const response = await api.get("/admin/documents/logs");
  return response.data;
}

export async function disableDocument(documentId) {
  const response = await api.patch(`/admin/documents/${documentId}/disable`);
  return response.data;
}