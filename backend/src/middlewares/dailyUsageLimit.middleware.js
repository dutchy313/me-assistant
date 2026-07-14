import DailyUsage from "../models/DailyUsage.js";
import { tooManyRequests } from "../utils/AppError.js";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getNumberEnv(name, fallback) {
  const value = Number(process.env[name]);

  if (Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export function enforceDailyChatLimit() {
  return async (req, res, next) => {
    try {
      const limit = getNumberEnv("DAILY_CHAT_LIMIT_PER_USER", 100);
      const usageDate = getTodayKey();

      const usage = await DailyUsage.findOneAndUpdate(
        {
          userId: req.user._id,
          usageDate
        },
        {
          $setOnInsert: {
            userId: req.user._id,
            usageDate
          }
        },
        {
          new: true,
          upsert: true
        }
      );

      if (usage.chatMessages >= limit) {
        return next(
          tooManyRequests(
            `You have reached today's chat limit of ${limit} messages. Please try again tomorrow.`
          )
        );
      }

      req.dailyUsage = usage;
      req.dailyUsageField = "chatMessages";

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function enforceDailyEvaluationLimit() {
  return async (req, res, next) => {
    try {
      const limit = getNumberEnv("DAILY_EVALUATION_LIMIT_PER_ADMIN", 50);
      const usageDate = getTodayKey();

      const usage = await DailyUsage.findOneAndUpdate(
        {
          userId: req.user._id,
          usageDate
        },
        {
          $setOnInsert: {
            userId: req.user._id,
            usageDate
          }
        },
        {
          new: true,
          upsert: true
        }
      );

      if (usage.evaluations >= limit) {
        return next(
          tooManyRequests(
            `You have reached today's evaluation limit of ${limit}. Please try again tomorrow.`
          )
        );
      }

      req.dailyUsage = usage;
      req.dailyUsageField = "evaluations";

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export async function incrementDailyUsage(req, amount = 1) {
  if (!req.dailyUsage || !req.dailyUsageField) {
    return;
  }

  await DailyUsage.updateOne(
    {
      _id: req.dailyUsage._id
    },
    {
      $inc: {
        [req.dailyUsageField]: amount
      }
    }
  );
}
