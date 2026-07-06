import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { sendLoginOtpEmail } from "./email.service.js";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return process.env.JWT_SECRET;
}

function getTempJwtSecret() {
  if (!process.env.LOGIN_TEMP_JWT_SECRET) {
    throw new Error("LOGIN_TEMP_JWT_SECRET is missing in environment variables");
  }

  return process.env.LOGIN_TEMP_JWT_SECRET;
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    }
  );
}

function signLoginTempToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      purpose: "login_2fa"
    },
    getTempJwtSecret(),
    {
      expiresIn: process.env.LOGIN_TEMP_JWT_EXPIRES_IN || "10m"
    }
  );
}

function createPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

function createSixDigitOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function registerUser({ name, email, password, companyWebsite }) {
  // Honeypot anti-bot check.
  // The frontend will include this as a hidden field.
  // Real users will leave it empty.
  if (companyWebsite) {
    throw new AppError("Signup could not be completed", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash
  });

  const token = signAccessToken(user);

  return {
    token,
    user: createPublicUser(user)
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been disabled", 403);
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordIsValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const otpEnabled = process.env.EMAIL_OTP_ENABLED === "true";

  if (!otpEnabled) {
    user.lastLoginAt = new Date();
    await user.save();

    return {
      requiresOtp: false,
      token: signAccessToken(user),
      user: createPublicUser(user)
    };
  }

  const otp = createSixDigitOtp();
  const otpHash = await bcrypt.hash(otp, 12);

  const expiresMinutes = Number(process.env.EMAIL_OTP_EXPIRES_MINUTES || 10);
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

  user.loginOtpHash = otpHash;
  user.loginOtpExpiresAt = expiresAt;
  await user.save();

  await sendLoginOtpEmail({
    to: user.email,
    name: user.name,
    otp
  });

  return {
    requiresOtp: true,
    tempToken: signLoginTempToken(user),
    message: "A 6-digit login code has been sent to your email"
  };
}

export async function verifyLoginOtp({ tempToken, otp }) {
  let payload;

  try {
    payload = jwt.verify(tempToken, getTempJwtSecret());
  } catch (error) {
    throw new AppError("Invalid or expired temporary login token", 401);
  }

  if (payload.purpose !== "login_2fa") {
    throw new AppError("Invalid token purpose", 401);
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError("User not found or inactive", 401);
  }

  if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
    throw new AppError("No active login code found", 400);
  }

  if (user.loginOtpExpiresAt < new Date()) {
    user.loginOtpHash = null;
    user.loginOtpExpiresAt = null;
    await user.save();

    throw new AppError("Login code has expired", 401);
  }

  const otpIsValid = await bcrypt.compare(otp, user.loginOtpHash);

  if (!otpIsValid) {
    throw new AppError("Invalid login code", 401);
  }

  user.loginOtpHash = null;
  user.loginOtpExpiresAt = null;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAccessToken(user),
    user: createPublicUser(user)
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).select(
    "name email role isActive createdAt updatedAt lastLoginAt"
  );

  if (!user || !user.isActive) {
    throw new AppError("User not found", 404);
  }

  return createPublicUser(user);
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }
}