
// ==================================
// MY DAILY DASHBOARD
// LIVE CLOCK AND DATE
// ==================================

function updateClock() {
  const now = new Date();

  document.getElementById("current-time").textContent =
    now.toLocaleTimeString("en-US");

  document.getElementById("current-date").textContent =
    now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
}

// Display the clock immediately
updateClock();

// Update the clock every second
setInterval(updateClock, 1000);
