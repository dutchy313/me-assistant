import api from "./axios";

export async function submitProductFeedback(payload) {
  const response = await api.post("/feedback/product", payload);
  return response.data;
}

export async function submitSessionFeedback(payload) {
  const response = await api.post("/feedback/sessions", payload);
  return response.data;
}

export async function submitAnswerFeedback(payload) {
  const response = await api.post("/feedback/answers", payload);
  return response.data;
}

export async function submitSourceFeedback(payload) {
  const response = await api.post("/feedback/sources", payload);
  return response.data;
}

export async function getFeedbackSummary() {
  const response = await api.get("/feedback/summary");
  return response.data;
}

export async function getRecentFeedback() {
  const response = await api.get("/feedback/recent");
  return response.data;
}