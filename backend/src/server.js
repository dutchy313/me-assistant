import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 4000;

let server;

async function startServer() {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`M&E Assistant API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`Readiness check: http://localhost:${PORT}/api/v1/ready`);
    });
  } catch (error) {
    console.error("Failed to start M&E Assistant API");
    console.error(error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await mongoose.disconnect();

    console.log("Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown");
    console.error(error.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection");
  console.error(reason);

  shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception");
  console.error(error);

  process.exit(1);
});

startServer();