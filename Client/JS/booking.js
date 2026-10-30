// ===== Mobile menu =====
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

navToggle.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

// ===== Pre-select room type from the link, e.g. booking.html?type=double =====
const params = new URLSearchParams(window.location.search);
const typeFromLink = params.get("type");
const roomTypeSelect = document.getElementById("bRoomType");

if (typeFromLink && ["single", "double", "triple"].includes(typeFromLink)) {
  roomTypeSelect.value = typeFromLink;
}

// ===== Move-in date cannot be in the past =====
document.getElementById("bMoveIn").min = new Date().toISOString().split("T")[0];

// ===== Form submit =====
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

const API_BASE = "http://localhost:3000/api";

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Highlight invalid fields
  bookingForm.querySelectorAll("input, select").forEach((field) => {
    field.classList.toggle("invalid", !field.checkValidity());
  });

  if (!bookingForm.checkValidity()) {
    bookingMessage.textContent = "Please fill all required fields correctly.";
    bookingMessage.className = "form-message error";
    return;
  }

  const data = Object.fromEntries(new FormData(bookingForm));

  bookingMessage.textContent = "Submitting your request...";
  bookingMessage.className = "form-message";

  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Server error");

    bookingMessage.textContent = "Request submitted! We will contact you soon.";
    bookingMessage.className = "form-message success";
    bookingForm.reset();
  } catch (error) {
    console.error(error);
    bookingMessage.textContent = "Could not submit right now. Please check your connection and try again.";
    bookingMessage.className = "form-message error";
  }
});