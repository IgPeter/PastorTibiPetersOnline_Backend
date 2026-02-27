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
  console.log("I am in create qr code");
  try {
    const url = "https://pastortibipeters.com/spreadtheword";

    const qrBuffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 500,
      margin: 2,
    });

    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": "attachment; filename=spreadtheword-qr.png",
    });

    console.log("sending response ...");
    res.send(qrBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "QR Code generation failed" });
  }
});

//download campaign messages in archive
router.get("/qr-bundle-download/:bundleId", async (req, res) => {
  // ... your bundles object ...

  try {
    const { bundleId } = req.params;
    const files = bundles[bundleId];

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    const uploadsDir = path.join(__dirname, "../messagesSpreadTheWord");

    // Very important headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="spread-the-word-${bundleId}.zip"`,
    );
    // Optional but helps some aggressive caches / proxies
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error(err);
      if (!res.headersSent) res.status(500).send("Archive error");
    });

    archive.pipe(res);

    for (const file of files) {
      const filePath = path.join(uploadsDir, file.name);

      if (require("fs").existsSync(filePath)) {
        console.log("Adding file:", filePath);
        archive.file(filePath, { name: file.name });
      } else {
        console.warn("File missing:", filePath);
        // You might want to continue or abort depending on requirements
      }
    }

    archive.finalize();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Bundle download failed" });
    }
  }
});

//create qr code and download messages
router.get("/qrcode/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;

    // Your bundle validation (reuse or improve)
    const bundles = {
      spreadtheword: [
        { id: "file1", name: "Judikay-Capable-God-CeeNaija.com_.mp3" },
        { id: "file2", name: "Zoe_The_Life_Of_God.mp3" },
      ],
      // add others...
    };

    if (!bundles[bundleId]) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    const downloadUrl = `https://pastortibipeters.com/api/v1/message/qr-bundle-download/${bundleId}`;
    // Use real domain! Or short domain if you have one

    const buffer = await QRCode.toBuffer(downloadUrl, {
      errorCorrectionLevel: "H", // High reliability — good for posters/flyers
      type: "png",
      quality: 0.95,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 500, // Bigger = better scan reliability
    });

    // Force download
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bundle-${bundleId}-qr.png"`,
    );
    res.setHeader("Cache-Control", "no-cache"); // Optional: prevent aggressive caching

    res.send(buffer);
  } catch (err) {
    console.error("QR generation failed:", err);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
});

//enpoint to fetch all message files from local directory
router.get("/files", (req, res) => {
  const folderPath = path.join(__dirname, "..", "messagesSpreadTheWord");
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

//this endpoint will download the file
router.get("/download/:filename", (req, res) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "messagesSpreadTheWord",
      req.params.filename,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath); // forces browser download
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
