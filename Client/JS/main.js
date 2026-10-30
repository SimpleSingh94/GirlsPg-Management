const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!bookingForm.checkValidity()) {
    bookingMessage.textContent = "Please fill all required fields correctly.";
    bookingMessage.className = "form-message error";
    return;
  }

  const data = Object.fromEntries(new FormData(bookingForm));
  console.log("Booking data:", data); // later: send to backend

  bookingMessage.textContent = "Request submitted! We will contact you soon.";
  bookingMessage.className = "form-message success";
  bookingForm.reset();
});