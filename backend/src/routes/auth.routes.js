import express from "express";
import { login, me, register, verifyOtp } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
  verifyLoginOtpSchema
} from "../validations/auth.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify-login-otp", validate(verifyLoginOtpSchema), verifyOtp);

router.get("/me", requireAuth, me);

export default router;