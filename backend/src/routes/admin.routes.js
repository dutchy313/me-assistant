import express from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/health", requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Admin route is working",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;