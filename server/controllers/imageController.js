
const path = require("path");
const { exec } = require("child_process");

const uploadImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const image = req.files.image;
    const uploadPath = path.join(__dirname, "../uploads", image.name);
    const processedPath = path.join(__dirname, "../uploads", "processed-" + image.name);

    await image.mv(uploadPath);

    exec(`python3 ai/realProcessor.py "${uploadPath}" "${processedPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return res.status(500).json({ error: "AI processing failed" });
      }

      res.json({
        original: `http://localhost:5001/uploads/${image.name}`,
        processed: `http://localhost:5001/uploads/processed-${image.name}`,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image processing failed" });
  }
};

module.exports = { uploadImage };
