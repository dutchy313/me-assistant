import express from "express";
import { changePassword } from "../controllers/account.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/requestValidation.middleware.js";
import { changePasswordSchema } from "../validations/account.validation.js";

const router = express.Router();

router.use(requireAuth);

router.patch(
  "/change-password",
  validateBody(changePasswordSchema),
  changePassword
);

export default router;