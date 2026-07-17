import DailyUsage from "../models/DailyUsage.js";
import User from "../models/User.js";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);

  return date.toISOString().slice(0, 10);
}

function buildDateRange({ startDate, endDate }) {
  return {
    startDate: startDate || getDateDaysAgo(13),
    endDate: endDate || getTodayKey()
  };
}

export async function getAdminUsageDashboard({
  startDate,
  endDate,
  page = 1,
  limit = 20,
  search
}) {
  const range = buildDateRange({
    startDate,
    endDate
  });

  const usageMatch = {
    usageDate: {
      $gte: range.startDate,
      $lte: range.endDate
    }
  };

  const [summary, dailySeries, usersResult] = await Promise.all([
    getUsageSummary(usageMatch),
    getDailyUsageSeries(usageMatch, range),
    getUsageByUser({
      usageMatch,
      page,
      limit,
      search
    })
  ]);

  return {
    range,
    summary,
    dailySeries,
    users: usersResult.users,
    pagination: usersResult.pagination
  };
}

async function getUsageSummary(usageMatch) {
  const rows = await DailyUsage.aggregate([
    {
      $match: usageMatch
    },
    {
      $group: {
        _id: null,
        totalChatMessages: {
          $sum: "$chatMessages"
        },
        totalEvaluations: {
          $sum: "$evaluations"
        },
        activeUserIds: {
          $addToSet: "$userId"
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalChatMessages: 1,
        totalEvaluations: 1,
        activeUsers: {
          $size: "$activeUserIds"
        }
      }
    }
  ]);

  return (
    rows[0] || {
      totalChatMessages: 0,
      totalEvaluations: 0,
      activeUsers: 0
    }
  );
}

async function getDailyUsageSeries(usageMatch, range) {
  const rows = await DailyUsage.aggregate([
    {
      $match: usageMatch
    },
    {
      $group: {
        _id: "$usageDate",
        chatMessages: {
          $sum: "$chatMessages"
        },
        evaluations: {
          $sum: "$evaluations"
        },
        activeUsers: {
          $addToSet: "$userId"
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        chatMessages: 1,
        evaluations: 1,
        activeUsers: {
          $size: "$activeUsers"
        }
      }
    },
    {
      $sort: {
        date: 1
      }
    }
  ]);

  const rowByDate = rows.reduce((map, row) => {
    map[row.date] = row;
    return map;
  }, {});

  return listDatesBetween(range.startDate, range.endDate).map((date) => {
    return (
      rowByDate[date] || {
        date,
        chatMessages: 0,
        evaluations: 0,
        activeUsers: 0
      }
    );
  });
}

async function getUsageByUser({ usageMatch, page, limit, search }) {
  const skip = (page - 1) * limit;

  const usageRows = await DailyUsage.aggregate([
    {
      $match: usageMatch
    },
    {
      $group: {
        _id: "$userId",
        chatMessages: {
          $sum: "$chatMessages"
        },
        evaluations: {
          $sum: "$evaluations"
        },
        daysActive: {
          $addToSet: "$usageDate"
        }
      }
    },
    {
      $project: {
        userId: "$_id",
        _id: 0,
        chatMessages: 1,
        evaluations: 1,
        totalActions: {
          $add: ["$chatMessages", "$evaluations"]
        },
        daysActive: {
          $size: "$daysActive"
        }
      }
    },
    {
      $sort: {
        totalActions: -1,
        chatMessages: -1
      }
    }
  ]);

  const userIds = usageRows.map((row) => row.userId);

  const userFilter = {
    _id: {
      $in: userIds
    }
  };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    userFilter.$or = [
      {
        name: regex
      },
      {
        email: regex
      }
    ];
  }

  const users = await User.find(userFilter)
    .select("name email role isActive createdAt lastLoginAt")
    .lean();

  const userById = users.reduce((map, user) => {
    map[String(user._id)] = user;
    return map;
  }, {});

  const enrichedRows = usageRows
    .filter((row) => userById[String(row.userId)])
    .map((row) => {
      const user = userById[String(row.userId)];

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          status: user.isActive ? "active" : "disabled",
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        },
        chatMessages: row.chatMessages || 0,
        evaluations: row.evaluations || 0,
        totalActions: row.totalActions || 0,
        daysActive: row.daysActive || 0
      };
    });

  const total = enrichedRows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    users: enrichedRows.slice(skip, skip + limit),
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

function listDatesBetween(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(`${startDate}T00:00:00.000Z`);
  const finalDate = new Date(`${endDate}T00:00:00.000Z`);

  while (currentDate <= finalDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}