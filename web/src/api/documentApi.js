import api from "./axios";

export async function getAdminDocuments() {
  const response = await api.get("/admin/documents");
  return response.data;
}

export async function syncGoogleDriveDocuments() {
  const response = await api.post("/admin/documents/sync-drive");
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