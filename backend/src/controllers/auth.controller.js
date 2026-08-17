import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  verifyLoginOtp
} from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser({
    ...req.body,
    ipAddress: req.ip
  });

  res.status(201).json({
    status: "success",
    message: "Account created successfully",
    data: result
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    status: "success",
    message: result.requiresOtp ? "Login code sent" : "Logged in successfully",
    data: result
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await verifyLoginOtp(req.body);

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    data: result
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      user
    }
  });
});