import api from "./axios";

export async function askChatQuestion(payload) {
  const response = await api.post("/chat/ask", payload);
  return response.data;
}

export async function getChatSessions() {
  const response = await api.get("/chat/sessions");
  return response.data;
}

export async function getChatMessages(sessionId) {
  const response = await api.get(`/chat/sessions/${sessionId}/messages`);
  return response.data;
}

export async function clearChatHistory() {
  const response = await api.delete("/chat/sessions");
  return response.data;
}