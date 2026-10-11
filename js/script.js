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
  let nextLesson = null;
  let minDiff = Infinity;

  const dayNames = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];

  lessons.forEach((lesson) => {
    const parentTr = lesson.closest("tr");
    if (!parentTr) return;

    const dayIndex = parseInt(parentTr.dataset.day || parentTr.getAttribute("data-day"), 10);
    const [startH, startM] = lesson.dataset.start.split(":").map(Number);
    const [endH, endM] = lesson.dataset.end.split(":").map(Number);

    const lessonStart = new Date(now);
    const dayDiff = (dayIndex - currentDay + 7) % 7;
    lessonStart.setDate(now.getDate() + dayDiff);
    lessonStart.setHours(startH, startM, 0, 0);

    const lessonEnd = new Date(lessonStart);
    lessonEnd.setHours(endH, endM, 0, 0);

    if (dayIndex === currentDay && now >= lessonStart && now <= lessonEnd) {
      lesson.classList.add("lesson--active");
      foundActive = true;
      if (statusEl) {
        statusEl.textContent = `Práve prebieha: ${lesson.textContent}`;
      }
    }

    // if lesson in future
    const diff = lessonStart.getTime() - now.getTime();
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextLesson = {
        name: lesson.textContent,
        dayName: dayNames[dayIndex],
        time: lesson.dataset.start,
        isToday: dayIndex === currentDay
      };
    }
  });

  if (!foundActive && statusEl) {
    if (nextLesson) {
      const dayString = nextLesson.isToday ? "dnes" : `v ${nextLesson.dayName}`;
      statusEl.textContent = `Práve neprebieha žiadna výučba. Najbližšia hodina je ${nextLesson.name} (${dayString} o ${nextLesson.time}).`;
    } else {
      statusEl.textContent = "Práve neprebieha žiadna výučba a v tomto týždni už nie sú ďalšie hodiny.";
    }
  }
}

//workspace hotspots
// Pole objektov s údajmi o jednotlivých hotspotoch (min. 5)
const workspaceHotspots = [
  {
    id: "usb",
    x: "70%",
    y: "20%",
    title: "USB kľúč",
    description: "USB kľúč, kde si ukladám dôležité veci alebo dokumenty na tlač."
  },
  {
    id: "laptop",
    x: "20%",
    y: "40%",
    title: "Laptop",
    description: "Môj hlavný pracovný nástroj na vývoj webov a štúdium. Tu robím zadania a rozvíjam svoje počítačové schopnosti."
  },
  {
    id: "water",
    x: "90%",
    y: "22%",
    title: "Voda",
    description: "Na stole mám fľašu s vodou, aby som bola pri práci hydratovaná."
  },
  {
    id: "notebook",
    x: "30%",
    y: "80%",
    title: "Zošit",
    description: "Mám vždy pri sebe zošit alebo papier pre rýchle výpočty alebo poznámky."
  },
  {
    id: "paints",
    x: "90%",
    y: "76%",
    title: "farby",
    description: "Vo voľnom čase rada kreslím či maľujem. Tu mám odložené farby aj skicár."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  renderHotspots();
});

function renderHotspots() {
  const container = document.getElementById("hotspot-container");
  if (!container) return; 

  container.innerHTML = "";

  workspaceHotspots.forEach((spot) => {
    const hotspotEl = document.createElement("div");
    hotspotEl.className = "hotspot";
    hotspotEl.style.setProperty("--x", spot.x);
    hotspotEl.style.setProperty("--y", spot.y);
    const xPercent = parseFloat(spot.x);
    
    if (xPercent > 50) {
      hotspotEl.classList.add("hotspot--left");
     }

    const button = document.createElement("button");
    button.className = "hotspot__dot";
    button.type = "button";
    button.setAttribute("aria-label", spot.title);

    const panel = document.createElement("div");
    panel.className = "hotspot__panel";

    const title = document.createElement("h2");
    title.textContent = spot.title;

    const desc = document.createElement("p");
    desc.textContent = spot.description;

    panel.appendChild(title);
    panel.appendChild(desc);

    hotspotEl.appendChild(button);
    hotspotEl.appendChild(panel);

    container.appendChild(hotspotEl);
  });
}

// 2. LEAFLET MAP

let map;
let userPoints = [];
let mapMarkers = [];
let routeLine = null;
function initMap(){
    map = L.map("map").setView(
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

  L.marker([48.220909, 17.398710])
      .addTo(map)
      .bindPopup("Senec");

  loadPointsFromLocalStorage();

  map.on("click", (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const pointName = prompt("Zadajte názov pre toto miesto:");

    if (pointName && pointName.trim() !== "") {
      const newPoint = {
        id: Date.now(),
        name: pointName.trim(),
        lat: lat,
        lng: lng
  };
  userPoints.push(newPoint);
      savePointsToLocalStorage();

      addMarkerToMap(newPoint);
      updateSelectOptions();
    }
  });

  const calcBtn = document.getElementById("btn-calculate");
  if (calcBtn) {
    calcBtn.addEventListener("click", handleCalculateDistance);
  }

  const clearBtn = document.getElementById("btn-clear-points");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearUserPoints);
  }
}

function addMarkerToMap(point) {
  const marker = L.marker([point.lat, point.lng])
    .addTo(map)
    .bindPopup(`<b>${point.name}</b>`);
  mapMarkers.push(marker);
}
function savePointsToLocalStorage() {
  localStorage.setItem("myMapPoints", JSON.stringify(userPoints));
}
function loadPointsFromLocalStorage() {
  const stored = localStorage.getItem("myMapPoints");
  if (stored){
    try {
      userPoints = JSON.parse(stored);
      userPoints.forEach((pt) => addMarkerToMap(pt));
    } 
    catch (err){
      userPoints = [];}
  }
  updateSelectOptions();
}
function clearUserPoints() {
  userPoints = [];
  savePointsToLocalStorage();

  // Odstránenie markerov z mapy
  mapMarkers.forEach((m) => map.removeLayer(m));
  mapMarkers = [];

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  updateSelectOptions();
  document.getElementById("distance-result").textContent = "";
}

function updateSelectOptions() {
  const selectEl = document.getElementById("start-point");
  const instructionsEl = document.getElementById("map-instructions");
  if (!selectEl) return;

  selectEl.innerHTML = '<option value="">-- Zvoľte bod na mape --</option>';

  userPoints.forEach((point) => {
    const option = document.createElement("option");
    option.value = point.id;
    option.textContent = point.name;
    selectEl.appendChild(option);
  });
  if (instructionsEl) {
    if (userPoints.length === 0) {
      instructionsEl.textContent = "💡 Kliknutím kdekoľvek na mapu pridáte vlastný bod.";
    } else {
      instructionsEl.textContent = `Máte pridaných ${userPoints.length} vlastných bodov. Vyberte bod a cieľ nižšie.`;
    }
  }
}

function handleCalculateDistance() {
  const startSelect = document.getElementById("start-point");
  const endSelect = document.getElementById("end-point");
  const resultEl = document.getElementById("distance-result");

  if (!startSelect || !endSelect || !resultEl) return;
  const selectedPointId = parseInt(startSelect.value, 10);
  const targetType = endSelect.value;

  const startPoint = userPoints.find((p) => p.id === selectedPointId);
  if (!startPoint) {
    resultEl.textContent = "Najskôr vyberte pridaný bod zo zoznamu.";
    return;
  }

  const targetCoords = targetType === "school" 
    ? { lat: 48.151965, lng: 17.072995, name: "FEI STU Bratislava" }
    : { lat: 48.220909, lng: 17.398710, name: "Senec" };

  const distanceKm = haversine(
    startPoint.lat,
    startPoint.lng,
    targetCoords.lat,
    targetCoords.lng
  );

  resultEl.innerHTML = `Vzdialenosť z <strong>${startPoint.name}</strong> do <strong>${targetCoords.name}</strong> je <strong>${distanceKm.toFixed(2)} km</strong>.`;

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  const latlngs = [
    [startPoint.lat, startPoint.lng],
    [targetCoords.lat, targetCoords.lng]
  ];

  routeLine = L.polyline(latlngs, { color: "red", weight: 4 }).addTo(map);

  map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
}


function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("map");
  if (mapElement) {
    initMap();
  }
});
