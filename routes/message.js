const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Message } = require("../models/message");
const { Category } = require("../models/category");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { verifyToken } = require("../helpers/auth");
const isAdmin = require("../helpers/isAdmin");
const QRCode = require("qrcode");
const archiver = require("archiver");

//Getting the mimetype
const FILE_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "audio/mp4": "mp4 audio",
  "audio/mpeg": "mp3",
  "video/mp4": "MP4 video",
  "video/mpeg": "mpeg",
  "video/3gp": "3gp",
  "video/x-matroska": "mkv",
  "application/pdf": "pdf",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE[file.mimetype];

    let uploadError = new Error("Invalid file type");

    if (isValid) {
      uploadError = null;
    }

    if (
      FILE_TYPE[file.mimetype] == "png" ||
      FILE_TYPE[file.mimetype] == "jpeg" ||
      FILE_TYPE[file.mimetype] == "jpg"
    ) {
      cb(uploadError, "public/upload/message/images");
    }

    if (
      FILE_TYPE[file.mimetype] == "mp4" ||
      FILE_TYPE[file.mimetype] == "MP4 video" ||
      FILE_TYPE[file.mimetype] == "mp4 video" ||
      FILE_TYPE[file.mimetype] == "mkv" ||
      FILE_TYPE[file.mimetype] == "MKV File" ||
      FILE_TYPE[file.mimetype] == "mpeg" ||
      FILE_TYPE[file.mimetype] == "3pg"
    ) {
      cb(uploadError, "public/upload/message/videoMessage");
    }

    if (
      FILE_TYPE[file.mimetype] == "mp3" ||
      FILE_TYPE[file.mimetype] == "mp4 audio"
    ) {
      cb(uploadError, "public/upload/message/audioMessages");
    }

    if (FILE_TYPE[file.mimetype] == "pdf") {
      cb(uploadError, "public/upload/message/books");
    }
  },

  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(" ", "-").replace(".", "-");
    const extension = FILE_TYPE[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const fileUpload = multer({ storage: storage });

const cpUpload = fileUpload.fields([
  { name: "message", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

//Contains all the message related routes

router.post(`/`, verifyToken, isAdmin, cpUpload, async (req, res) => {
  const imageFilePath = `https://${req.get("host")}/public/upload/message/images`;

  let filePath;
  const image_fileName = req.files.image[0].filename;
  const message_fileName = req.files.message[0].filename;
  const msExt = FILE_TYPE[req.files.message[0].mimetype];

  if (msExt == "mp4 audio" || msExt == "mp3") {
    filePath = `https://${req.get("host")}/public/upload/message/audioMessages`;
  }

  if (
    msExt == "mp4 video" ||
    msExt == "MP4 video" ||
    msExt == "MP4" ||
    msExt == "mp4" ||
    msExt == "mpeg" ||
    msExt == "3gp" ||
    msExt == "mkv" ||
    msExt == "MKV File"
  ) {
    filePath = `https://${req.get("host")}/public/upload/message/videoMessage`;
  }

  if (msExt == "pdf") {
    filePath = `https://${req.get("host")}/public/upload/message/books`;
  }

  const message = new Message({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    description: req.body.description,
    contentType: req.body.contentType,
    category: req.body.category,
    image: `${imageFilePath}/${image_fileName}`,
    message: `${filePath}/${message_fileName}`,
  });

  await message
    .save()
    .then((message) => {
      return res.status(200).json({
        notification: "message was created successfully",
        result: message,
      });
    })
    .catch((err) => {
      res.status(400).json({
        response: "couldn't create message",
        error: err,
      });
    });
});

router.get(`/:id`, async (req, res) => {
  const singleMessage = await Message.findById(req.params.id).populate(
    "category",
  );

  if (!singleMessage) {
    res.status(404).send("message not found");
  }

  res.status(200).json({ success: singleMessage });
});

router.get(`/`, async (req, res) => {
  let filter = {};

  if (req.query.categories) {
    filter = { category: req.query.categories };
  }

  await Message.find(filter)
    .populate("category")
    .then((result) => {
      const response = {
        count: result.length,
        message: result.map((eachMessage) => {
          return {
            _id: eachMessage.id,
            title: eachMessage.title,
            image: eachMessage.image,
            description: eachMessage.description,
            category: eachMessage.category,
            message: eachMessage.message,
            dateCreated: eachMessage.dateCreated,
            contentType: eachMessage.contentType,
            request: {
              type: "GET",
              Url: `https://${req.get("host")}/api/v1/message`,
            },
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({
        response: "Failed",
        error: err,
      });
    });
});

//getting all featured messages
router.get(`/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const featuredMessage = await Message.find({ isFeatured: true }).limit(
    +count,
  );

  if (!featuredMessage) {
    res.status(500).json("Failed operation");
  }

  res.status(200).json(featuredMessage);
});

//updating message information
router.patch(`/:id`, cpUpload, async (req, res) => {
  if (Object.entries(req.files) === 0) {
    const imageFilePath = `https://${req.get("host")}/public/upload/message/images`;
    let filePath;
    const image_fileName = req.files.image[0].filename;
    const message_fileName = req.files.message[0].filename;
    const msExt = FILE_TYPE[req.files.message[0].mimetype];

    if (msExt == "mp4 audio" || msExt == "mp3") {
      filePath = `https://${req.get("host")}/public/upload/message/audioMessages`;
    }

    if (msExt == "mp4" || msExt == "mpeg" || msExt == "3gp") {
      filePath = `https://${req.get("host")}/public/upload/message/videoMessage`;
    }

    if (msExt == "pdf") {
      filePath = `https://${req.get("host")}/public/upload/message/books`;
    }
  }

  Message.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      description: req.body.description,
      contentType: req.body.contentType,
      category: req.body.category,
      image: req.body.image,
      file: req.body.file,
    },

    { new: true },
  )
    .then((updatedMessage) => {
      const response = {
        title: updatedMessage.title,
        description: updatedMessage.description,
        contentType: updatedMessage.contentType,
        category: updatedMessage.contentType,
        image: `${imageFilePath}/${image_fileName}`,
        message: `${filePath}/${message_fileName}`,
      };

      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({
        message: "Couldn't update message",
        error: err,
      });
    });
});

//deleting message information
router.delete(`/:id`, async (req, res) => {
  const id = req.params.id;
  await Message.deleteOne({ _id: id })
    .then((deletedMessage) => {
      res.status(200).json({
        message: "message deleted successfully",
        result: deletedMessage,
        request: {
          type: "DELETE",
          url: "http://localhost:3000/message/" + id,
        },
      });
    })
    .catch((err) => {
      res.status(404).json({
        error: err,
      });
    });
});

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

module.exports = router;
