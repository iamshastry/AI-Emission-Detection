const mongoose = require("mongoose");

const DetectionLogSchema = new mongoose.Schema({
  imageName: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  result: String,
  smokePercent: Number,
  summary: String,
});

module.exports = mongoose.model("DetectionLog", DetectionLogSchema);
