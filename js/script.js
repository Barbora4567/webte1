
const WORK_DAYS = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];
const STORAGE_KEY = "lunch-menu-data";

const statusText = document.getElementById("last-update");
const refreshButton = document.getElementById("updateData");
const clearButton = document.getElementById("deleteSavedData");
const loader = document.getElementById("loader");
const menuContainer = document.getElementById("schedule");
const tabs = document.getElementById("day-tabs");

let restaurantsData = [];
let selectedDay = getTodayDayIndex();
let visibleRestaurants = {
  "eat-and-meet": true,
  "idyla": true,
  "klubovna": true
};

function getTodayDayIndex() {
  const day = new Date().getDay();
  if (day >= 1 && day <= 5) {
    return day - 1;
  }
  return 0;
}

function renderTabs() {
  if (!tabs) return;
  tabs.replaceChildren();

  WORK_DAYS.forEach((dayName, index) => {
    const button = document.createElement("button");
    button.type = "button";
    const isActive = selectedDay === index;
    button.className = `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`;
    button.textContent = dayName;
    button.setAttribute("aria-pressed", isActive);

    button.addEventListener("click", () => {
      selectedDay = index;
      render();
    });
    tabs.append(button);
  });

  const allButton = document.createElement("button");
  allButton.type = "button";
  const isAllActive = selectedDay === "all";
  allButton.className = `btn ${isAllActive ? "btn-secondary" : "btn-outline-secondary"}`;
  allButton.textContent = "Celý týždeň";
  allButton.setAttribute("aria-pressed", isAllActive);

  allButton.addEventListener("click", () => {
    selectedDay = "all";
    render();
  });
  tabs.append(allButton);
}

function renderMenu() {
  if (!menuContainer) return;
  menuContainer.replaceChildren();

  // Filtrujeme reštaurácie, ktoré má používateľ zapnuté vo switchoch
  const activeRestaurants = restaurantsData.filter(r => visibleRestaurants[r.id]);

  if (activeRestaurants.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "col-12 text-center text-muted py-5";
    emptyMsg.textContent = "Žiadna reštaurácia nie je vybratá na zobrazenie.";
    menuContainer.append(emptyMsg);
    return;
  }

  // Pre každú reštauráciu vytvoríme Bootstrap kartu (stĺpec v gride)
  activeRestaurants.forEach(restaurant => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    const card = document.createElement("div");
    card.className = "card h-100 shadow-sm border-0";

    // Hlavička karty
    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header bg-white border-bottom py-3";
    cardHeader.innerHTML = `
      <h3 class="h5 mb-1">${restaurant.name}</h3>
      <a href="${restaurant.url}" target="_blank" rel="noopener" class="small text-decoration-none">
        <i class="bi bi-box-arrow-up-right me-1"></i>Pôvodná stránka
      </a>
    `;

    // Telo karty s jedlami
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    // Ak nastala pri sťahovaní chyba
    if (restaurant.error) {
      cardBody.innerHTML = `<div class="alert alert-warning mb-0 small">${restaurant.error}</div>`;
      card.append(cardHeader, cardBody);
      col.append(card);
      menuContainer.append(col);
      return;
    }

    // Určíme, ktoré dni vykresľujeme (jeden deň alebo všetky)
    const daysToRender = selectedDay === "all" 
      ? restaurant.days 
      : [restaurant.days[selectedDay]].filter(Boolean);

    if (daysToRender.length === 0 || daysToRender.every(d => !d.items || d.items.length === 0)) {
      cardBody.innerHTML = `<p class="text-muted small mb-0">Menu na tento deň nie je k dispozícii.</p>`;
    } else {
      daysToRender.forEach(day => {
        if (selectedDay === "all") {
          const dayTitle = document.createElement("h4");
          dayTitle.className = "h6 fw-bold text-primary border-bottom pb-1 mt-3";
          dayTitle.textContent = day.day;
          cardBody.append(dayTitle);
        }

        const list = document.createElement("ul");
        list.className = "list-unstyled mb-0";

        day.items.forEach(item => {
          const li = document.createElement("li");
          li.className = "py-2 border-bottom border-light d-flex justify-content-between align-items-baseline gap-2";
          
          // Odlíšenie polievky a hlavného jedla
          const isSoup = item.type === "soup";
          const badgeClass = isSoup ? "bg-info-subtle text-info-emphasis" : "bg-light text-dark";
          
          li.innerHTML = `
            <div>
              <span class="badge ${badgeClass} me-1">${isSoup ? "Polievka" : "Jedlo"}</span>
              <span class="small">${item.title}</span>
              ${item.allergens ? `<span class="text-muted extra-small">(${item.allergens})</span>` : ""}
            </div>
            <strong class="text-primary small text-nowrap">${item.price ? `${item.price} €` : "—"}</strong>
          `;
          list.append(li);
        });

        cardBody.append(list);
      });
    }

    card.append(cardHeader, cardBody);
    col.append(card);
    menuContainer.append(col);
  });
}

function render() {
  renderTabs();
  renderMenu();
}

// 4. Správa Cache a LocalStorage (z tvojho pôvodného kódu)
function saveToStorage(data) {
  const payload = { savedAt: new Date().toISOString(), data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const savedDate = new Date(parsed.savedAt);
    
    // Ak sú dáta z iného dňa, vrátime null (podmienka zo zadania o aktuálnom dni)
    if (savedDate.toDateString() !== new Date().toDateString()) {
      return null;
    }
    return { savedAt: savedDate, data: parsed.data };
  } catch (e) {
    return null;
  }
}

// 5. Hlavná funkcia na načítanie dát
async function loadMenu(forceRefresh = false) {
  const cached = forceRefresh ? null : loadFromStorage();

  if (cached) {
    restaurantsData = cached.data;
    statusText.textContent = cached.savedAt.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
    render();
    return;
  }

  try {
    if (loader) loader.classList.remove("d-none");
    refreshButton.disabled = true;

    // TODO: Nahradíme reálnymi funkciami po dohode na proxy a parseroch
    // restaurantsData = await fetchAllRestaurants();
    
    saveToStorage(restaurantsData);
    statusText.textContent = new Date().toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    statusText.textContent = "Chyba pri aktualizácii";
  } finally {
    if (loader) loader.classList.add("d-none");
    refreshButton.disabled = false;
    render();
  }
}

// 6. Event Listenery pre tlačidlá a filtre
refreshButton.addEventListener("click", () => loadMenu(true));

clearButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  statusText.textContent = "Vymazané";
  restaurantsData = [];
  render();
});

// Prepínače reštaurácií (Checkboxy)
document.querySelectorAll(".filter-restaurant").forEach(input => {
  input.addEventListener("change", (e) => {
    const restId = e.target.dataset.rest;
    visibleRestaurants[restId] = e.target.checked;
    renderMenu();
  });
});

//go
loadMenu();

//sources
const SOURCES = [
  {
    id: "eat-and-meet",
    name: "Eat & Meet",
    website: "https://eatandmeet.sk/tyzdenne-menu",
    localUrl: "sources/Eat-Meet.html",
    parse: parseEatAndMeetJquery,
  },
/*  {
    id: "idyla",
    name: "Idyla Cafe & Restaurant",
    website: "http://www.restauraciaidyla.sk/idylamd/mdmenu.html",
    localUrl: "source/idyla.html",
    parse: parseIdyla,
  },
  {
    id: "klubovna",
    name: "Karloveská Klubovňa",
    website: "https://www.nasaklubovna.sk/klubovne/karloveska/",
    localUrl: "source/klubovna.html",
    parse: parseKlubovna,
  },*/
];

let allRestaurants = [];
let currentDayIndex = getTodayDayIndex(); // 0-4 alebo "all"

async function fetchAllRestaurants() {
  const results = [];

  for (const source of SOURCES) {
    try {
      // Použije lokálny súbor alebo stiahnutie cez proxy
      const response = await fetch(source.localUrl); 
      if (!response.ok) throw new Error("Chyba pri sťahovaní");

      const html = await response.text();
      const days = source.parse(html); // Zavolá parseEatAndMeet

      results.push({
        id: source.id,
        name: source.name,
        website: source.website,
        days: days,
        error: days.length === 0 ? "Menu sa nepodarilo spracovať." : null
      });
    } catch (err) {
      results.push({
        id: source.id,
        name: source.name,
        website: source.website,
        days: [],
        error: "Reštaurácia je momentálne nedostupná."
      });
    }
  }

  return results;
}

// Stav aplikácie

// Zistenie aktuálneho dňa (Pondelok = 0, Piatok = 4, cez víkend Pondelok)
function getTodayDayIndex() {
  const day = new Date().getDay(); // 0 = Ne, 1 = Po ... 6 = So
  return (day >= 1 && day <= 5) ? day - 1 : 0;
}

/**
 * Vykreslí menu vybraného dňa alebo celého týždňa
 */
function renderMenu() {
  const $schedule = $("#schedule");
  $schedule.empty();

  if (allRestaurants.length === 0) {
    $schedule.append('<p class="text-muted text-center py-4">Žiadne menu nie je k dispozícii.</p>');
    return;
  }

  allRestaurants.forEach((rest) => {
    // 1. Obal karty reštaurácie (Bootstrap stĺpec)
    const $col = $("<div>").addClass("col-12 col-md-6 col-lg-4");
    const $card = $("<div>").addClass("card h-100 shadow-sm border-0");

    // 2. Hlavička karty
    const $header = $("<div>").addClass("card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center");
    $header.append(`<h2 class="h5 mb-0 fw-bold">${rest.name}</h2>`);
    $header.append(`<a href="${rest.website}" target="_blank" rel="noopener" class="small text-decoration-none"><i class="bi bi-box-arrow-up-right me-1"></i>Web</a>`);

    // 3. Telo karty
    const $body = $("<div>").addClass("card-body");

    if (rest.error) {
      $body.append(`<div class="alert alert-warning mb-0 small">${rest.error}</div>`);
      $card.append($header, $body);
      $col.append($card);
      $schedule.append($col);
      return;
    }

    // Určíme, ktoré dni vykresľujeme
    const daysToDisplay = (currentDayIndex === "all")
      ? rest.days
      : [rest.days[currentDayIndex]].filter(Boolean);

    daysToDisplay.forEach((dayData) => {
      if (currentDayIndex === "all") {
        $body.append(`<h3 class="h6 fw-bold text-primary mt-2 pb-1 border-bottom">${dayData.day} ${dayData.date}</h3>`);
      }

      if (!dayData.items || dayData.items.length === 0) {
        $body.append('<p class="text-muted small">Menu na tento deň nie je k dispozícii.</p>');
        return;
      }

      const $list = $("<ul>").addClass("list-unstyled mb-3");

      dayData.items.forEach((item) => {
        const isSoup = item.category === "Polievka";
        const badgeClass = isSoup ? "bg-info-subtle text-info-emphasis" : "bg-light text-dark border";

        const $li = $("<li>").addClass("py-2 border-bottom border-light d-flex justify-content-between align-items-baseline gap-2");
        
        const priceFormatted = item.price !== null ? `${item.price.toFixed(2)} €` : "—";
        const allergensFormatted = item.allergens ? `<span class="text-muted extra-small ms-1">(${item.allergens})</span>` : "";

        $li.html(`
          <div>
            <span class="badge ${badgeClass} me-1">${item.category}</span>
            <span class="small">${item.title}</span>
            ${allergensFormatted}
          </div>
          <strong class="text-primary small text-nowrap">${priceFormatted}</strong>
        `);

        $list.append($li);
      });

      $body.append($list);
    });

    $card.append($header, $body);
    $col.append($card);
    $schedule.append($col);
  });
}

/**
 * Vykreslí prepínacie tlačidlá dní
 */
function renderDayTabs() {
  const $tabs = $("#day-tabs");
  $tabs.empty();

  // Pondelok až Piatok
  for (let i = 0; i < 5; i++) {
    const isCurrent = currentDayIndex === i;
    const $btn = $("<button>")
      .attr("type", "button")
      .addClass(`btn ${isCurrent ? "btn-primary" : "btn-outline-primary"}`)
      .text(DAY_NAMES[i])
      .on("click", () => {
        currentDayIndex = i;
        renderDayTabs();
        renderMenu();
      });
    $tabs.append($btn);
  }

  // Tlačidlo "Celý týždeň"
  const isAll = currentDayIndex === "all";
  const $allBtn = $("<button>")
    .attr("type", "button")
    .addClass(`btn ${isAll ? "btn-secondary" : "btn-outline-secondary"}`)
    .text("Celý týždeň")
    .on("click", () => {
      currentDayIndex = "all";
      renderDayTabs();
      renderMenu();
    });
  $tabs.append($allBtn);
}

/**
 * Načíta dáta pre všetky reštaurácie (s podporou localStorage)
 */
async function loadAllMenus(forceRefresh = false) {
  const STORAGE_KEY = "lunch-menu-data";
  const $loader = $("#loader");
  const $status = $("#last-update");
  const $refreshBtn = $("#updateData");

  // Kontrola cache
  if (!forceRefresh) {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const savedDate = new Date(parsed.savedAt);
        // Ak sú dáta z dnešného dňa, použijeme ich
        if (savedDate.toDateString() === new Date().toDateString()) {
          allRestaurants = parsed.restaurants;
          $status.text(savedDate.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" }));
          renderDayTabs();
          renderMenu();
          return;
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  // Ak nemáme dáta v cache, načítame ich cez jQuery AJAX
  try {
    $loader.removeClass("d-none");
    $refreshBtn.prop("disabled", true);

    allRestaurants = [];

    for (const source of SOURCES) {
      try {
        const html = await loadHtmlJquery(source.url);
        const doc = parseHtml(html);
        const days = source.parse(doc);

        allRestaurants.push({
          id: source.id,
          name: source.name,
          website: source.website,
          days: days,
          error: days.length === 0 ? "Menu na tento týždeň sa nenašlo." : null
        });
      } catch (err) {
        allRestaurants.push({
          id: source.id,
          name: source.name,
          website: source.website,
          days: [],
          error: "Reštaurácia je momentálne nedostupná."
        });
      }
    }

    // Uloženie do localStorage
    const payload = {
      savedAt: new Date().toISOString(),
      restaurants: allRestaurants
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    $status.text(new Date().toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" }));

  } catch (globalError) {
    $status.text("Chyba pri aktualizácii");
  } finally {
    $loader.addClass("d-none");
    $refreshBtn.prop("disabled", false);
    renderDayTabs();
    renderMenu();
  }
}

// Inicializácia tlačidiel
$(document).ready(() => {
  $("#updateData").on("click", () => loadAllMenus(true));

  $("#deleteSavedData").on("click", () => {
    localStorage.removeItem("lunch-menu-data");
    $("#last-update").text("Uložené dáta boli vymazané.");
    allRestaurants = [];
    renderMenu();
  });

  // Prvé spustenie
  loadAllMenus();
});