const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "FlowSpace Backend is running",
  });
});

// Basic API endpoint
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "FlowSpace API is working",
    version: "1.0.0",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 FlowSpace Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
});
