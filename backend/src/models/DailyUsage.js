import mongoose from "mongoose";

const dailyUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    usageDate: {
      type: String,
      required: true,
      index: true
    },

    chatMessages: {
      type: Number,
      default: 0
    },

    evaluations: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

dailyUsageSchema.index(
  {
    userId: 1,
    usageDate: 1
  },
  {
    unique: true
  }
);

const DailyUsage = mongoose.model("DailyUsage", dailyUsageSchema);

export default DailyUsage;