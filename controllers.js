// server/controllers.js
const { createBooking, createRoommatePreferences } = require("./models");

async function submitBooking(req, res) {
  try {
    const data = req.body;
    const bookingId = await createBooking(data);
    await createRoommatePreferences(bookingId, data);
    res.status(201).json({ message: "Booking submitted successfully", bookingId });
  } catch (error) {
    console.error("Booking submission failed:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = { submitBooking };