import { changeUserPassword } from "../services/account.service.js";

export async function changePassword(req, res, next) {
  try {
    const result = await changeUserPassword({
      userId: req.user._id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });

    res.status(200).json({
      status: "success",
      message: "Password changed successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}