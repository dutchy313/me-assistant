import mongoose from "mongoose";
import User from "../models/User.js";
import DailyUsage from "../models/DailyUsage.js";
import { badRequest, forbidden, notFound } from "../utils/AppError.js";
import { ALL_ROLES } from "../constants/roles.js";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function listAdminUsers({
  page = 1,
  limit = 20,
  search,
  role,
  status
}) {
  const filter = {};

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      {
        name: searchRegex
      },
      {
        email: searchRegex
      }
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (status === "active") {
    filter.isActive = true;
  }

  if (status === "disabled") {
    filter.isActive = false;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role isActive lastLoginAt createdAt updatedAt")
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  const usageByUserId = await getTodayUsageByUserId(
    users.map((user) => user._id)
  );

  const enrichedUsers = users.map((user) => ({
    ...user,
    status: user.isActive ? "active" : "disabled",
    todayUsage: usageByUserId[String(user._id)] || {
      chatMessages: 0,
      evaluations: 0
    }
  }));

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    users: enrichedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    }
  };
}

export async function updateAdminUserRole({
  targetUserId,
  role,
  currentAdminUserId
}) {
  validateObjectId(targetUserId, "Invalid user id");

  if (!ALL_ROLES.includes(role)) {
    throw badRequest("Role is invalid");
  }

  if (String(targetUserId) === String(currentAdminUserId)) {
    throw forbidden(
      "You cannot change your own role. Ask another admin to make this change."
    );
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    throw notFound("User not found");
  }

  user.role = role;
  await user.save();

  return serializeAdminUser(user);
}

export async function updateAdminUserStatus({
  targetUserId,
  status,
  currentAdminUserId
}) {
  validateObjectId(targetUserId, "Invalid user id");

  if (!["active", "disabled"].includes(status)) {
    throw badRequest("Status is invalid");
  }

  if (String(targetUserId) === String(currentAdminUserId)) {
    throw forbidden(
      "You cannot disable or reactivate your own account. Ask another admin to make this change."
    );
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    throw notFound("User not found");
  }

  user.isActive = status === "active";
  await user.save();

  return serializeAdminUser(user);
}

async function getTodayUsageByUserId(userIds = []) {
  if (userIds.length === 0) {
    return {};
  }

  const usageRows = await DailyUsage.find({
    userId: {
      $in: userIds
    },
    usageDate: getTodayKey()
  }).lean();

  return usageRows.reduce((map, usage) => {
    map[String(usage.userId)] = {
      chatMessages: usage.chatMessages || 0,
      evaluations: usage.evaluations || 0
    };

    return map;
  }, {});
}

function serializeAdminUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    status: user.isActive ? "active" : "disabled",
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function validateObjectId(value, message) {
  if (!mongoose.isValidObjectId(value)) {
    throw badRequest(message);
  }
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}