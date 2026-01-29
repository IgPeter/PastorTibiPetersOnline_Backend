const express = require("express");
const router = express.Router();

router.get("/callback", (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing reference");
  }

  // Redirect into your app
  return res.redirect(
    `pastortibipetersonline://paystack/charge/success?reference=${reference}`,
  );
});

router.get("/subscription/callback", (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).send("Missing reference");
  }

  // Redirect into your app
  return res.redirect(
    `pastortibipetersonline://paystack/subscription/success?reference=${reference}`,
  );
});

module.exports = router;
