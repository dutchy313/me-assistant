import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { forbidden, unauthorized } from "../utils/AppError.js";
import { USER_ROLES } from "../constants/roles.js";

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(unauthorized("You must be logged in to continue"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = getUserIdFromDecodedToken(decoded);

    if (!userId) {
      return next(unauthorized("Your session is invalid. Please log in again."));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(
        unauthorized("This account no longer exists. Please log in again.")
      );
    }

    if (!user.isActive) {
      return next(
        unauthorized(
          "This account has been disabled. Please contact an administrator."
        )
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(unauthorized("Your session has expired. Please log in again."));
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized("You must be logged in to continue"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        forbidden(
          "You do not have permission to access this area. Please contact an administrator if you need access."
        )
      );
    }

    return next();
  };
}

export const requireAdmin = requireRole(USER_ROLES.ADMIN);

export const requireReviewerOrAdmin = requireRole(
  USER_ROLES.REVIEWER,
  USER_ROLES.ADMIN
);

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}

function getUserIdFromDecodedToken(decoded) {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  return (
    decoded.id ||
    decoded.userId ||
    decoded._id ||
    decoded.sub ||
    decoded.user?.id ||
    decoded.user?._id ||
    null
  );
}