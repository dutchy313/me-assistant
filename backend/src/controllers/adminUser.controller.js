import {
  listAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus
} from "../services/adminUser.service.js";

export async function getAdminUsers(req, res, next) {
  try {
    const query = req.validatedQuery || req.query || {};

    const result = await listAdminUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      status: query.status
    });

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function patchAdminUserRole(req, res, next) {
  try {
    const user = await updateAdminUserRole({
      targetUserId: req.params.userId,
      role: req.body.role,
      currentAdminUserId: req.user._id
    });

    res.status(200).json({
      status: "success",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function patchAdminUserStatus(req, res, next) {
  try {
    const user = await updateAdminUserStatus({
      targetUserId: req.params.userId,
      status: req.body.status,
      currentAdminUserId: req.user._id
    });

    res.status(200).json({
      status: "success",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}