import { getAdminUsageDashboard } from "../services/adminUsage.service.js";

export async function getAdminUsage(req, res, next) {
  try {
    const query = req.validatedQuery || req.query || {};

    const result = await getAdminUsageDashboard({
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
      search: query.search
    });

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
}