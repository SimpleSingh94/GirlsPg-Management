// ================= CONFIG =================
// USE_MOCK = true  -> sample data generated in this file (no backend needed)
// USE_MOCK = false -> data is fetched from your Node/Express API
const CONFIG = {
  USE_MOCK: true,
  API_BASE: "http://localhost:3000/api",
  PAGE_SIZE: 12,
};

// Expected shape of one room from the backend (matches the rooms + beds tables):
// { room_no: 101, floor: 1, type: "double", capacity: 2,
//   beds: [ { bed_no: 1, status: "vacant" | "occupied" | "reserved", available_from: "2026-10-15" | null } ] }

let allRooms = [];
let filteredRooms = [];
let shownCount = 0;

// ================= HELPERS =================
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ================= MOCK DATA =================
function seededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function buildMockRooms() {
  const rand = seededRandom(7);
  const plan = [
    ["single", 1, 20],
    ["double", 2, 25],
    ["triple", 3, 15],
  ];
  const rooms = [];
  let n = 0;

  plan.forEach(([type, capacity, count]) => {
    for (let i = 0; i < count; i++) {
      const floor = 1 + (n % 5);
      const room_no = floor * 100 + Math.floor(n / 5) + 1;
      const beds = [];

      for (let b = 1; b <= capacity; b++) {
        const r = rand();
        let status, available_from;

        if (r < 0.4) {
          status = "vacant";
          available_from = toDateString(new Date());
        } else if (r < 0.8) {
          status = "occupied";
          available_from = rand() < 0.35 ? addDays(3 + Math.floor(rand() * 85)) : null;
        } else {
          status = "reserved";
          available_from = addDays(2 + Math.floor(rand() * 20));
        }
        beds.push({ bed_no: b, status, available_from });
      }
      rooms.push({ room_no, floor, type, capacity, beds });
      n++;
    }
  });

  return rooms;
}

// ================= DATA LOADING =================
async function loadRooms() {
  if (CONFIG.USE_MOCK) {
    return buildMockRooms();
  }
  const response = await fetch(`${CONFIG.API_BASE}/rooms`);
  if (!response.ok) throw new Error("Could not load rooms");
  return response.json();
}

// ML hook: your Flask/Node service will return the prediction here
async function getPrediction(days) {
  if (CONFIG.USE_MOCK) {
    return { message: "Prediction model not connected yet. It will appear here once the ML service is ready." };
  }
  const response = await fetch(`${CONFIG.API_BASE}/predict-vacancy?days=${days}`);
  if (!response.ok) throw new Error("Prediction failed");
  return response.json(); // e.g. { days: 30, predicted_vacant_beds: 120 }
}

// ================= STATS =================
function updateStats() {
  const beds = allRooms.flatMap((room) => room.beds);
  const count = (status) => beds.filter((b) => b.status === status).length;

  document.getElementById("statTotal").textContent = beds.length;
  document.getElementById("statVacant").textContent = count("vacant");
  document.getElementById("statOccupied").textContent = count("occupied");
  document.getElementById("statReserved").textContent = count("reserved");
}

// ================= CHECK VACANCY =================
const roomGrid = document.getElementById("roomGrid");
const resultCount = document.getElementById("resultCount");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// A bed counts as free if vacant, or (when a date is given) if it frees up by that date
function isBedFree(bed, neededFrom) {
  if (bed.status === "vacant") return true;
  if (neededFrom && bed.status === "occupied" && bed.available_from) {
    return bed.available_from <= neededFrom;
  }
  return false;
}

function applyFilters() {
  const type = document.getElementById("fType").value;
  const floor = document.getElementById("fFloor").value;
  const neededFrom = document.getElementById("fDate").value;
  const onlyVacant = document.getElementById("fOnlyVacant").checked;

  filteredRooms = allRooms.filter((room) => {
    if (type !== "all" && room.type !== type) return false;
    if (floor !== "all" && String(room.floor) !== floor) return false;
    if (onlyVacant && !room.beds.some((b) => isBedFree(b, neededFrom))) return false;
    return true;
  });

  shownCount = 0;
  roomGrid.innerHTML = "";
  renderMoreRooms();
}

function roomTile(room, neededFrom) {
  const free = room.beds.filter((b) => isBedFree(b, neededFrom)).length;
  const dots = room.beds
    .map((b) => `<i class="bed-dot ${b.status}" title="Bed ${b.bed_no}: ${b.status}"></i>`)
    .join("");

  const bookBtn = free
    ? `<a href="booking.html?type=${room.type}" class="btn btn-secondary">Book This Room</a>`
    : `<span class="btn btn-secondary disabled">Not Available</span>`;

  return `
    <article class="room-tile">
      <div class="room-tile-head">
        <h3>Room ${room.room_no}</h3>
        <span class="room-tag">${room.type}</span>
      </div>
      <p class="room-meta">Floor ${room.floor} &bull; ${room.capacity} bed${room.capacity > 1 ? "s" : ""}</p>
      <div class="bed-row">${dots}</div>
      <p class="free-count ${free ? "has-free" : "no-free"}">${free} of ${room.capacity} bed${room.capacity > 1 ? "s" : ""} free</p>
      ${bookBtn}
    </article>`;
}

function renderMoreRooms() {
  const neededFrom = document.getElementById("fDate").value;
  const next = filteredRooms.slice(shownCount, shownCount + CONFIG.PAGE_SIZE);

  roomGrid.insertAdjacentHTML("beforeend", next.map((r) => roomTile(r, neededFrom)).join(""));
  shownCount += next.length;

  resultCount.textContent = filteredRooms.length
    ? `Showing ${shownCount} of ${filteredRooms.length} rooms`
    : "No rooms match your filters.";

  loadMoreBtn.style.display = shownCount < filteredRooms.length ? "inline-block" : "none";
}

document.getElementById("filterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  applyFilters();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("filterForm").reset();
  applyFilters();
});

loadMoreBtn.addEventListener("click", renderMoreRooms);

// ================= UPCOMING VACANCIES =================
function renderUpcoming() {
  const days = Number(document.getElementById("upDays").value);
  const limit = addDays(days);
  const today = toDateString(new Date());
  const rows = [];

  allRooms.forEach((room) => {
    room.beds.forEach((bed) => {
      if (bed.status === "occupied" && bed.available_from && bed.available_from >= today && bed.available_from <= limit) {
        rows.push({ room, bed });
      }
    });
  });

  rows.sort((a, b) => a.bed.available_from.localeCompare(b.bed.available_from));

  document.getElementById("upcomingBody").innerHTML = rows
    .map(
      ({ room, bed }) => `
      <tr>
        <td>Room ${room.room_no}</td>
        <td>${room.floor}</td>
        <td style="text-transform:capitalize">${room.type}</td>
        <td>Bed ${bed.bed_no}</td>
        <td>${formatDate(bed.available_from)}</td>
        <td><a href="booking.html?type=${room.type}" class="btn btn-secondary">Book</a></td>
      </tr>`
    )
    .join("");

  document.getElementById("upcomingEmpty").style.display = rows.length ? "none" : "block";
}

document.getElementById("upDays").addEventListener("change", renderUpcoming);

// ================= AI PREDICTION =================
document.getElementById("predictBtn").addEventListener("click", async () => {
  const days = document.getElementById("predDays").value;
  const box = document.getElementById("predictionResult");
  box.textContent = "Predicting...";

  try {
    const result = await getPrediction(days);
    box.textContent = result.message
      ? result.message
      : `Expected free beds in the next ${result.days} days: ${result.predicted_vacant_beds}`;
  } catch (error) {
    box.textContent = "Could not get a prediction right now. Please try again later.";
  }
});

// ================= TABS (vacancy sub-navbar) =================
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabPanels.forEach((p) => p.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(`tab-${button.dataset.tab}`).classList.add("active");
  });
});

// ================= MOBILE MENU =================
document.getElementById("navToggle").addEventListener("click", () => {
  document.getElementById("mainNav").classList.toggle("open");
});

// ================= INIT =================
async function init() {
  try {
    allRooms = await loadRooms();
    updateStats();
    applyFilters();
    renderUpcoming();
  } catch (error) {
    resultCount.textContent = "Could not load vacancy data. Please try again later.";
    console.error(error);
  }
}

document.getElementById("fDate").min = toDateString(new Date());
init();