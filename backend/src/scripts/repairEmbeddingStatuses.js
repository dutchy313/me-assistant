import dotenv from "dotenv";
import mongoose from "mongoose";
import SourceChunk from "../models/SourceChunk.js";

dotenv.config();

async function repairEmbeddingStatuses() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const missingStatusResult = await SourceChunk.updateMany(
    {
      $or: [
        { embeddingStatus: { $exists: false } },
        { embeddingStatus: "" },
        { embeddingStatus: null }
      ]
    },
    {
      $set: {
        embeddingStatus: "pending",
        embeddingError: "",
        vectorId: "",
        embeddingModel: "",
        embeddingDimensions: 0,
        embeddedAt: null
      }
    }
  );

  const failedStatusResult = await SourceChunk.updateMany(
    {
      embeddingStatus: "failed"
    },
    {
      $set: {
        embeddingStatus: "pending",
        embeddingError: "",
        vectorId: "",
        embeddingModel: "",
        embeddingDimensions: 0,
        embeddedAt: null
      }
    }
  );

  console.log(
    `Updated ${missingStatusResult.modifiedCount} chunk(s) with missing embedding status.`
  );

  console.log(
    `Reset ${failedStatusResult.modifiedCount} failed chunk(s) back to pending.`
  );

  await mongoose.disconnect();
}

repairEmbeddingStatuses().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});