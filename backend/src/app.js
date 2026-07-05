import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.APP_BASE_URL_WEB || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Route not found: ${req.originalUrl}`
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    status: error.status || "error",
    message:
      error.isOperational && error.message
        ? error.message
        : "Something went wrong"
  });
});

export default app;