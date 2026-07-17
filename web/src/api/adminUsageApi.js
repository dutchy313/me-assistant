import api from "./axios";

export async function getAdminUsage({
  startDate = "",
  endDate = "",
  page = 1,
  limit = 20,
  search = ""
} = {}) {
  const response = await api.get("/admin/usage", {
    params: {
      startDate,
      endDate,
      page,
      limit,
      search
    }
  });

  return response.data;
}