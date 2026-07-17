import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { badRequest, notFound } from "../utils/AppError.js";

export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword
}) {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw notFound("User account not found");
  }

  if (!user.isActive) {
    throw badRequest(
      "This account has been disabled. Please contact an administrator."
    );
  }

  const currentPasswordIsCorrect = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!currentPasswordIsCorrect) {
    throw badRequest("Current password is incorrect");
  }

  const newPasswordIsSameAsOld = await bcrypt.compare(
    newPassword,
    user.passwordHash
  );

  if (newPasswordIsSameAsOld) {
    throw badRequest("New password must be different from your current password");
  }

  const saltRounds = 12;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await user.save();

  return {
    changedAt: new Date().toISOString()
  };
}