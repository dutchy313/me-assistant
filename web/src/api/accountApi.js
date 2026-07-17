import api from "./axios";

export async function changePassword({
  currentPassword,
  newPassword,
  confirmNewPassword
}) {
  const response = await api.patch("/account/change-password", {
    currentPassword,
    newPassword,
    confirmNewPassword
  });

  return response.data;
}