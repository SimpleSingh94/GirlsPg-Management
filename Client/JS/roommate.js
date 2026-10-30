// ================= CONFIG =================
// USE_MOCK = true  -> matching runs in the browser on the sample profiles below
// USE_MOCK = false -> preferences are POSTed to your backend / Flask ML service
const CONFIG = {
  USE_MOCK: true,
  API_BASE: "http://localhost:3000/api",
  MAX_RESULTS: 6,
};

// Backend response (when USE_MOCK = false) should be a list like:
// [{ name, age, occupation, room_no, floor, type, score: 87,
//    reasons: [{ text: "Same sleep schedule", good: true }] }]

// ================= SAMPLE PROFILES =================
const CANDIDATES = [
  { name: "Ananya", age: 21, occupation: "student", room_no: 203, floor: 2, type: "double", food: "veg", sleep: "early", clean: "very-neat", study: "often", noise: "quiet", guests: "rarely" },
  { name: "Riya", age: 23, occupation: "working", room_no: 312, floor: 3, type: "double", food: "non-veg", sleep: "flexible", clean: "average", study: "sometimes", noise: "moderate", guests: "sometimes" },
  { name: "Sneha", age: 22, occupation: "student", room_no: 118, floor: 1, type: "triple", food: "veg", sleep: "late", clean: "average", study: "often", noise: "moderate", guests: "sometimes" },
  { name: "Pooja", age: 26, occupation: "night-shift", room_no: 405, floor: 4, type: "double", food: "any", sleep: "late", clean: "very-neat", study: "rarely", noise: "quiet", guests: "rarely" },
  { name: "Kavya", age: 20, occupation: "student", room_no: 221, floor: 2, type: "triple", food: "veg", sleep: "early", clean: "average", study: "often", noise: "moderate", guests: "rarely" },
  { name: "Meera", age: 24, occupation: "working", room_no: 507, floor: 5, type: "double", food: "non-veg", sleep: "early", clean: "very-neat", study: "sometimes", noise: "quiet", guests: "sometimes" },
  { name: "Isha", age: 22, occupation: "student", room_no: 134, floor: 1, type: "triple", food: "any", sleep: "flexible", clean: "relaxed", study: "sometimes", noise: "lively", guests: "often" },
  { name: "Tanvi", age: 25, occupation: "working", room_no: 342, floor: 3, type: "triple", food: "veg", sleep: "flexible", clean: "very-neat", study: "sometimes", noise: "quiet", guests: "rarely" },
  { name: "Divya", age: 27, occupation: "night-shift", room_no: 418, floor: 4, type: "triple", food: "non-veg", sleep: "late", clean: "average", study: "rarely", noise: "moderate", guests: "sometimes" },
  { name: "Nisha", age: 21, occupation: "student", room_no: 256, floor: 2, type: "double", food: "non-veg", sleep: "late", clean: "relaxed", study: "sometimes", noise: "lively", guests: "often" },
];

// ================= MATCHING LOGIC =================
const LEVELS = {
  sleep: ["early", "flexible", "late"],
  clean: ["very-neat", "average", "relaxed"],
  study: ["rarely", "sometimes", "often"],
  noise: ["quiet", "moderate", "lively"],
  guests: ["rarely", "sometimes", "often"],
};

const WEIGHTS = { sleep: 25, clean: 20, food: 15, study: 15, noise: 10, guests: 10, occupation: 5 };

const LABELS = {
  sleep: "sleep schedule",
  clean: "cleanliness",
  food: "food preference",
  study: "study habits",
  noise: "noise level",
  guests: "visitor habits",
  occupation: "occupation",
};

// 1 = identical, 0 = opposite ends of the scale
function ordinalScore(key, a, b) {
  const list = LEVELS[key];
  const distance = Math.abs(list.indexOf(a) - list.indexOf(b));
  return 1 - distance / (list.length - 1);
}

function foodScore(a, b) {
  if (a === b) return 1;
  if (a === "any" || b === "any") return 0.9;
  return 0.4; // veg vs non-veg
}

function occupationScore(a, b) {
  if (a === b) return 1;
  if (a === "night-shift" || b === "night-shift") return 0.3;
  return 0.7; // student vs working
}

function scoreCandidate(user, cand) {
  const parts = {
    sleep: ordinalScore("sleep", user.sleep, cand.sleep),
    clean: ordinalScore("clean", user.clean, cand.clean),
    food: foodScore(user.food, cand.food),
    study: ordinalScore("study", user.study, cand.study),
    noise: ordinalScore("noise", user.noise, cand.noise),
    guests: ordinalScore("guests", user.guests, cand.guests),
    occupation: occupationScore(user.occupation, cand.occupation),
  };

  let total = 0;
  const reasons = [];

  Object.keys(parts).forEach((key) => {
    total += parts[key] * WEIGHTS[key];
    if (parts[key] >= 0.9) {
      reasons.push({ text: `Similar ${LABELS[key]}`, good: true });
    } else if (parts[key] <= 0.4) {
      reasons.push({ text: `Different ${LABELS[key]}`, good: false });
    }
  });

  return { ...cand, score: Math.round(total), reasons };
}

function rankLocally(prefs) {
  return CANDIDATES
    .filter((c) => prefs.roomType === "any" || c.type === prefs.roomType)
    .map((c) => scoreCandidate(prefs, c))
    .sort((a, b) => b.score - a.score)
    .slice(0, CONFIG.MAX_RESULTS);
}

// ================= DATA (mock or backend) =================
async function fetchMatches(prefs) {
  if (CONFIG.USE_MOCK) {
    return rankLocally(prefs);
  }
  const response = await fetch(`${CONFIG.API_BASE}/roommate-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) throw new Error("Match request failed");
  return response.json();
}

// ================= RENDERING =================
const matchList = document.getElementById("matchList");
const matchSummary = document.getElementById("matchSummary");

function esc(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function ringColor(score) {
  if (score >= 80) return "#2b8a3e";
  if (score >= 60) return "#f59f00";
  return "#d6336c";
}

function matchCard(m) {
  const chips = m.reasons
    .map((r) => `<span class="chip ${r.good ? "good" : "warn"}">${esc(r.text)}</span>`)
    .join("");

  return `
    <article class="match-card">
      <div class="score-ring" style="--score:${m.score}; --ring-color:${ringColor(m.score)}">
        <span>${m.score}%</span>
      </div>
      <div class="match-info">
        <h3>${esc(m.name)}, ${esc(m.age)}</h3>
        <p class="match-meta">${esc(m.occupation)} &bull; Room ${esc(m.room_no)}, Floor ${esc(m.floor)} &bull; ${esc(m.type)} seater</p>
        <div class="chips">${chips}</div>
        <a href="booking.html?type=${encodeURIComponent(m.type)}" class="btn btn-secondary">Request This Room</a>
      </div>
    </article>`;
}

function showMatches(matches) {
  if (!matches.length) {
    matchList.innerHTML = `<div class="empty-state"><span class="empty-icon">&#128533;</span><p>No matches found for these preferences. Try changing the room type.</p></div>`;
    matchSummary.textContent = "No matches found.";
    return;
  }
  matchList.innerHTML = matches.map(matchCard).join("");
  matchSummary.textContent = `Top ${matches.length} roommates for you, best match first.`;
}

// ================= FORM =================
document.getElementById("prefForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const prefs = {
    occupation: document.getElementById("pOccupation").value,
    roomType: document.getElementById("pRoomType").value,
    food: document.getElementById("pFood").value,
    sleep: document.getElementById("pSleep").value,
    clean: document.getElementById("pClean").value,
    study: document.getElementById("pStudy").value,
    noise: document.getElementById("pNoise").value,
    guests: document.getElementById("pGuests").value,
  };

  matchSummary.textContent = "Finding your best matches...";

  try {
    const matches = await fetchMatches(prefs);
    showMatches(matches);
  } catch (error) {
    console.error(error);
    matchSummary.textContent = "Could not get matches right now. Please try again later.";
  }
});

// ================= MOBILE MENU =================
document.getElementById("navToggle").addEventListener("click", () => {
  document.getElementById("mainNav").classList.toggle("open");
});