import api from "./axios";

export async function getAdminUsers({
  page = 1,
  limit = 20,
  search = "",
  role = "",
  status = ""
} = {}) {
  const response = await api.get("/admin/users", {
    params: {
      page,
      limit,
      search,
      role,
      status
    }
  });

  return response.data;
}

export async function updateAdminUserRole({ userId, role }) {
  const response = await api.patch(`/admin/users/${userId}/role`, {
    role
  });

  return response.data;
}

export async function updateAdminUserStatus({ userId, status }) {
  const response = await api.patch(`/admin/users/${userId}/status`, {
    status
  });

  return response.data;
}