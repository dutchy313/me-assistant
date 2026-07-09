import dotenv from "dotenv";
import mongoose from "mongoose";
import Document from "../models/Document.js";

dotenv.config();

async function resetPdfParseFailures() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const result = await Document.updateMany(
    {
      status: "failed",
      errorMessage: /pdfParse is not a function/i
    },
    {
      $set: {
        status: "pending",
        errorMessage: ""
      }
    }
  );

  console.log(`Reset ${result.modifiedCount} document(s) back to pending.`);

  await mongoose.disconnect();
}

resetPdfParseFailures().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});