import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export async function checkApiHealth() {
  const response = await axios.get(`${API_BASE_URL}/health`);
  return response.data;
}