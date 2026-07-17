import express from "express";
import {
  getAdminUsers,
  patchAdminUserRole,
  patchAdminUserStatus
} from "../controllers/adminUser.controller.js";
import { getAdminUsage } from "../controllers/adminUsage.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateQuery
} from "../middlewares/requestValidation.middleware.js";
import {
  adminUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema
} from "../validations/adminUser.validation.js";
import { adminUsageQuerySchema } from "../validations/adminUsage.validation.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/health", (req, res) => {
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

router.get("/usage", validateQuery(adminUsageQuerySchema), getAdminUsage);

router.get("/users", validateQuery(adminUsersQuerySchema), getAdminUsers);

router.patch(
  "/users/:userId/role",
  validateBody(updateUserRoleSchema),
  patchAdminUserRole
);

router.patch(
  "/users/:userId/status",
  validateBody(updateUserStatusSchema),
  patchAdminUserStatus
);

export default router;