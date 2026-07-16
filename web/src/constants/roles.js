export const USER_ROLES = Object.freeze({
  USER: "user",
  REVIEWER: "reviewer",
  ADMIN: "admin"
});

export const ROLE_LABELS = Object.freeze({
  user: "User",
  reviewer: "Reviewer",
  admin: "Admin"
});

export function hasRole(user, allowedRoles = []) {
  if (!user?.role) {
    return false;
  }

  return allowedRoles.includes(user.role);
}

export function isAdmin(user) {
  return user?.role === USER_ROLES.ADMIN;
}

export function isReviewerOrAdmin(user) {
  return (
    user?.role === USER_ROLES.REVIEWER || user?.role === USER_ROLES.ADMIN
  );
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "User";
}