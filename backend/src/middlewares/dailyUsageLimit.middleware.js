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

function normalizeUsageAmount(value, fallback = 1) {
  const amount = Number(value);

  if (Number.isNaN(amount) || amount < 0) {
    return fallback;
  }

  return Math.floor(amount);
}

function resolveAmount(amountOrResolver, req) {
  if (typeof amountOrResolver === "function") {
    return normalizeUsageAmount(amountOrResolver(req), 1);
  }

  return normalizeUsageAmount(amountOrResolver, 1);
}

async function reserveDailyUsage({
  req,
  field,
  limit,
  amount,
  limitMessage
}) {
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
      },
      $inc: {
        [field]: amount
      }
    },
    {
    returnDocument: "after",
    upsert: true,
    setDefaultsOnInsert: true
    }
  );

  if (usage[field] > limit) {
    await DailyUsage.updateOne(
      {
        _id: usage._id
      },
      {
        $inc: {
          [field]: -amount
        }
      }
    );

    throw tooManyRequests(limitMessage);
  }

  req.dailyUsage = usage;
  req.dailyUsageField = field;
  req.dailyUsageReserved = true;
  req.dailyUsageReservedAmount = amount;
}

export function enforceDailyChatLimit(amountOrResolver = 1) {
  return async (req, res, next) => {
    try {
      const limit = getNumberEnv("DAILY_CHAT_LIMIT_PER_USER", 100);
      const amount = resolveAmount(amountOrResolver, req);

      await reserveDailyUsage({
        req,
        field: "chatMessages",
        limit,
        amount,
        limitMessage: `You have reached today's chat limit of ${limit} messages. Please try again tomorrow.`
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function enforceDailyEvaluationLimit(amountOrResolver = 1) {
  return async (req, res, next) => {
    try {
      const limit = getNumberEnv("DAILY_EVALUATION_LIMIT_PER_ADMIN", 50);
      const amount = resolveAmount(amountOrResolver, req);

      await reserveDailyUsage({
        req,
        field: "evaluations",
        limit,
        amount,
        limitMessage: `You have reached today's evaluation limit of ${limit}. Please try again tomorrow.`
      });

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

  const actualAmount = normalizeUsageAmount(amount, 1);

  if (req.dailyUsageReserved) {
    const reservedAmount = normalizeUsageAmount(req.dailyUsageReservedAmount, 0);
    const difference = actualAmount - reservedAmount;

    if (difference !== 0) {
      await DailyUsage.updateOne(
        {
          _id: req.dailyUsage._id
        },
        {
          $inc: {
            [req.dailyUsageField]: difference
          }
        }
      );
    }

    req.dailyUsageReservedAmount = actualAmount;
    return;
  }

  await DailyUsage.updateOne(
    {
      _id: req.dailyUsage._id
    },
    {
      $inc: {
        [req.dailyUsageField]: actualAmount
      }
    }
  );
}