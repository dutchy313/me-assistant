import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`M&E Assistant API running on port ${PORT}`);
  });
}

startServer();