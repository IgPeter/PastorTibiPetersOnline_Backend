const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const archiver = require("archiver");

//download campaign auddio for one message
router.get("/download/campaign-files/:filename", (req, res) => {
  const fileName = req.params.filename;

  const filePath = path.join(process.cwd(), "messagesSpreadTheWord", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Audio not found" });
  }

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  res.sendFile(filePath);
  // This automatically sets Content-Disposition: attachment
});

router.get(`/createqrcode`, async (req, res) => {
  try {
    const url = "https://pastortibipeters.online/spreadthewordweekfive/";

    const qrBuffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 500,
      margin: 2,
    });

    if (url == "https://pastortibipeters.online/spreadtheword/") {
      res.set({
        "Content-Type": "image/jpg",
        "Content-Disposition":
          "attachment; filename=spreadtheword-qr-week1.jpg",
      });
    } else if (url == "https://pastortibipeters.com/spreadthewordweektwo/") {
      res.set({
        "Content-Type": "image/jpg",
        "Content-Disposition":
          "attachment; filename=spreadtheword-qr-week2.jpg",
      });
    } else if (url == "https://pastortibipeters.com/spreadthewordweekthree/") {
      res.set({
        "Content-Type": "image/jpg",
        "Content-Disposition":
          "attachment; filename=spreadtheword-qr-week3.jpg",
      });
    } else if (
      url == "https://pastortibipeters.online/spreadthewordweekfour/"
    ) {
      res.set({
        "Content-Type": "image/jpg",
        "Content-Disposition":
          "attachment; filename=spreadtheword-qr-week4.jpg",
      });
    } else if (
      url == "https://pastortibipeters.online/spreadthewordweekfive/"
    ) {
      res.set({
        "Content-Type": "image/jpg",
        "Content-Disposition":
          "attachment; filename=spreadtheword-qr-week5.jpg",
      });
    }

    res.send(qrBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "QR Code generation failed" });
  }
});

//enpoint to fetch all message files from local directory
router.get("/files/:week", (req, res) => {
  const week = req.params.week;
  let folderPath;

  if (week == "week-one") {
    folderPath = path.join(__dirname, "..", "messagesSpreadTheWord");
  } else if (week == "week-two") {
    folderPath = path.join(__dirname, "..", "messagesSpreadTheWordWeek2");
  } else if (week == "week-three") {
    folderPath = path.join(__dirname, "..", "messagesSpreadTheWordWeek3");
  } else if (week == "week-four") {
    folderPath = path.join(__dirname, "..", "messagesSpreadTheWordWeek4");
  } else if (week == "week-five") {
    folderPath = path.join(__dirname, "..", "messagesSpreadTheWordWeek5");
  }

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

//endpoint for week two
/*router.get("/files/week-two", (req, res) => {
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
});*/

//this endpoint will download the file
router.get("/download/:week/:filename", (req, res) => {
  let week = req.params.week;
  let folderPath;

  if (week == "week-one") {
    folderPath = path.join(process.cwd(), "messagesSpreadTheWord");
  } else if (week == "week-two") {
    folderPath = path.join(process.cwd(), "messagesSpreadTheWordWeek2");
  } else if (week == "week-three") {
    folderPath = path.join(process.cwd(), "messagesSpreadTheWordWeek3");
  } else if (week == "week-four") {
    folderPath = path.join(process.cwd(), "messagesSpreadTheWordWeek4");
  } else if (week == "week-five") {
    folderPath = path.join(process.cwd(), "messagesSpreadTheWordWeek5");
  }

  const filePath = path.join(folderPath, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.download(filePath);
});

/*router.get("/download-weektwo/:filename", (req, res) => {
  let folderPath = path.join(process.cwd(), "messagesSpreadTheWordWeek2");

  const filePath = path.join(folderPath, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.download(filePath);
});*/

module.exports = router;
