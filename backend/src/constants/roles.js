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

export const ALL_ROLES = [
  USER_ROLES.USER,
  USER_ROLES.REVIEWER,
  USER_ROLES.ADMIN
];

export function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

export function canReviewQuality(role) {
  return role === USER_ROLES.REVIEWER || role === USER_ROLES.ADMIN;
}

export function canManageSystem(role) {
  return role === USER_ROLES.ADMIN;
}