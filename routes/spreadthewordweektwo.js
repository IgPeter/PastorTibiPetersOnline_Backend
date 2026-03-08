const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

//endpoint for week two
router.get("/files/week-two", (req, res) => {
  const folderPath = path.join(__dirname, "..", "messagesSpreadTheWordWeek2");

  let finalFiles = [];

  try {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Unable to read folder", error: err.message });
      }

      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          finalFiles.push({
            name: file,
            size: stats.size,
            dateModified: stats.mtime,
          });
        }
      });

      res.json({
        files: finalFiles,
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/download-weektwo/:filename", (req, res) => {
  let folderPath = path.join(process.cwd(), "messagesSpreadTheWordWeek2");

  const filePath = path.join(folderPath, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.download(filePath);
});

module.exports = router;
