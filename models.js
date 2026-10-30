// server/models.js
const pool = require("./db");

async function createBooking(data) {
  const [result] = await pool.query(
    `INSERT INTO booking_requests
      (full_name, age, place, occupation, phone, email,
       id_type, id_number, guardian_name, guardian_phone,
       room_type, move_in_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.age,
      data.place,
      data.occupation,
      data.phone,
      data.email,
      data.idType,
      data.idNumber,
      data.guardianName,
      data.guardianPhone,
      data.roomType,
      data.moveInDate,
    ]
  );
  return result.insertId;
}

async function createRoommatePreferences(bookingId, data) {
  await pool.query(
    `INSERT INTO roommate_preferences
      (booking_id, occupation, room_type, food, sleep_schedule,
       cleanliness, study_at_room)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      bookingId,
      data.occupation,
      data.roomType,
      data.mess,
      data.sleep,
      data.cleanliness,
      data.studyAtRoom,
    ]
  );
}

module.exports = { createBooking, createRoommatePreferences };