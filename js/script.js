// nav button
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("nav__list--open");
    });
  }
});

// schedule
const SEMESTER_START = "2026-09-14";
const SEMESTER_END = "2027-02-13";

document.addEventListener("DOMContentLoaded", () => {
  setupSemesterProgress();
  setupTableFilters();
  highlightCurrentLesson();
});


function setupSemesterProgress() {
  const progressBar = document.getElementById("semester-bar");
  const progressText = document.getElementById("semester-percent-text");

  if (!progressBar || !progressText) return;

  const start = new Date(SEMESTER_START).getTime();
  const end = new Date(SEMESTER_END).getTime();
  const now = new Date().getTime();

  let percentage = 0;
  if (now > start) {
    percentage = Math.min(100, Math.round(((now - start) / (end - start)) * 100));
  }

  progressBar.value = percentage;
  progressText.textContent = `${percentage}% semestra uplynulo`;
}

function setupTableFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const lessons = document.querySelectorAll(".lesson");
  const statusEl = document.getElementById("schedule-status-filter");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      
      filterBtns.forEach(b => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");

      const filter = btn.dataset.filter;
      let visibleCount = 0;

      lessons.forEach(lesson => {
        if (filter === "all" || lesson.dataset.type === filter) {
          lesson.classList.remove("lesson--hidden");
          visibleCount++;
        } else {
          lesson.classList.add("lesson--hidden");
        }
      });

      if (visibleCount === 0) {
        statusEl.textContent = "Pre zvolený filter sa nenašli žiadne hodiny.";
      } else {
        statusEl.textContent = "";
      }
    });
  });
}

function highlightCurrentLesson() {
  const now = new Date();
  const currentDay = now.getDay(); 
  const statusEl = document.getElementById("schedule-status-current");

  const lessons = document.querySelectorAll(".lesson");
  let foundActive = false;

  lessons.forEach(lesson => {
    const parentTr = lesson.closest("tr");
    const day = parseInt(parentTr.dataset.day, 10);

    if (day === currentDay) {
      const [startH, startM] = lesson.dataset.start.split(":").map(Number);
      const [endH, endM] = lesson.dataset.end.split(":").map(Number);

      const startTime = new Date(now).setHours(startH, startM, 0);
      const endTime = new Date(now).setHours(endH, endM, 0);

      if (now >= startTime && now <= endTime) {
        lesson.classList.add("lesson--active");
        foundActive = true;
        if (statusEl) {
          statusEl.textContent = `Práve prebieha: ${lesson.textContent}`;
        }
      }
    }
  });

  if (!foundActive && statusEl) {
    statusEl.textContent = "Práve neprebieha žiadna výučba.";
  }
}

// 1. WEATHER API

const weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.15" +
    "&longitude=17.11" +
    "&current=temperature_2m,wind_speed_10m" +
    "&timezone=auto";

fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {

        const temperature = data.current.temperature_2m;
        const wind = data.current.wind_speed_10m;

        document.getElementById("weather").innerHTML =
            "Teplota: " + temperature + " °C<br>" +
            "Vietor: " + wind + " km/h";

    })
    .catch(error => {

        document.getElementById("weather").innerHTML =
            "Nepodarilo sa načítať počasie.";

        console.error(error);

    });


// 2. LEAFLET MAP

    const map = L.map("map").setView(
    [48.151965, 17.072995],
    15
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        //referrerPolicy: "https://www.openstreetmap.org/copyright",
        //referer: true,
    }
).addTo(map);

// 3. MARKER
L.marker([48.151965, 17.072995])
    .addTo(map)
    .bindPopup("FEI STU Bratislava")
    .openPopup();


