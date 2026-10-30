// server/routes/routes.js
const express = require("express");
const router = express.Router();
const { submitBooking } = require("./controllers");

router.post("/bookings", submitBooking);

module.exports = router;