export function getHealth(req, res) {
  res.status(200).json({
    status: "ok",
    app: "M&E Assistant API",
    message: "Backend is running successfully",
    timestamp: new Date().toISOString()
  });
}