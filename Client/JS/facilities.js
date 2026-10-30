// ===== Mobile menu =====
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

navToggle.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

// ===== Facility category filter =====
const filterButtons = document.querySelectorAll(".filter-btn");
const facilityCards = document.querySelectorAll(".facility-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;

    // highlight the active button
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // show or hide cards
    facilityCards.forEach((card) => {
      const match = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("hide", !match);
    });
  });
});