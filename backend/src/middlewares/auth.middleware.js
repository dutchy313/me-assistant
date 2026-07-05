import { verifyAccessToken } from "../services/auth.service.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select(
      "name email role isActive"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: "fail",
        message: "User not found or inactive"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      status: "fail",
      message: "Admin access required"
    });
  }

  next();
}