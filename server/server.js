const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const DetectionLog = require("./models/DetectionLog");

const app = express();
const port = 5001;

// ✅ MongoDB connection
mongoose.connect("mongodb://localhost:27017/emissionlogs", {
  useNewUrlParser: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(express.static("uploads")); // Serve uploaded/processed images

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "input.jpg")
});
const upload = multer({ storage });

// ✅ POST /api/images/upload — Image Upload + AI Inference
app.post('/api/images/upload', upload.single('image'), (req, res) => {
  const inputPath = "uploads/input.jpg";
  const imageName = req.file.originalname;

  const python = spawn("python3", ["ai/realProcessor.py", inputPath]);

  let lastLine = "";

  python.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lastLine = lines[lines.length - 1]; // capture only final output
  });

  python.stderr.on("data", (data) => {
    console.error(`❌ stderr from Python: ${data}`);
  });

  python.on("close", async (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "AI processing failed" });
    }

    console.log("📤 Python model output:", lastLine);
    const smokePercent = parseFloat(lastLine);

    if (isNaN(smokePercent)) {
      console.error("❌ AI model output invalid (NaN). Skipping DB save.");
      return res.status(500).json({ error: "AI model did not return a valid percentage." });
    }

    const result = smokePercent > 1.0 ? "fail" : "pass";
    const summary = `Detected ${smokePercent.toFixed(1)}% smoke`;
    
    console.log("📝 Saving to MongoDB:", {
      imageName,
      smokePercent,
      result,
      summary
    });
    

    // ✅ Save to MongoDB
    try {
      await DetectionLog.create({
        imageName,
        smokePercent,
        result,
        summary,
      });
    } catch (err) {
      console.error("❌ MongoDB insert error:", err);
    }

    return res.json({
      original: `http://localhost:${port}/${req.file.filename}`,
      processed: `http://localhost:${port}/processed-${req.file.filename}`,
      smokePercent,
    });
  });
});

// ✅ GET /api/logs — Retrieve logs for frontend
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await DetectionLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.delete("/api/logs", async (req, res) => {
  try {
    await DetectionLog.deleteMany({});
    res.json({ message: "All logs cleared." });
  } catch (err) {
    console.error("❌ Failed to clear logs:", err);
    res.status(500).json({ error: "Failed to clear logs" });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
