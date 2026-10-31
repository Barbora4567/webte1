const WORK_DAYS = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];
const STORAGE_KEY = "lunch-menu-data";

const SOURCES = [
  {
    id: "eat-and-meet",
    name: "Eat & Meet",
    website: "https://eatandmeet.sk/tyzdenne-menu",
    url: "sources/Eat-Meet.html",
    parse: parseEatAndMeetJquery,
  },
  {
    id: "free-food",
    name: "FreeFood (Matika)",
    website: "http://www.freefood.sk/menu/",
    url: "sources/FreeFood.html",
    parse: parseFreeFoodJquery,
  }, 
  {
    id: "white-dragon",
    name: "White Dragon",
    website: "https://whitedragon.sk/menucka/",
    url: "sources/whiteDragon.html",
    parse: parseWhiteDragonJquery,
  }
  
];

let allRestaurants = [];
let currentDayIndex = getTodayDayIndex();
let visibleRestaurants = {
  "eat-and-meet": true,
  "free-food": true,
  "white-dragon": true
};


function getTodayDayIndex() {
  const day = new Date().getDay(); // 0 = Ne, 1 = Po ... 6 = So
  return (day >= 1 && day <= 5) ? day - 1 : 0;
}

function loadHtmlJquery(url) {
  return $.ajax({url: url, dataType: "text"});
}

//buttons
function renderDayTabs() {
  const $tabs = $("#day-tabs");
  if ($tabs.length === 0) return;
  $tabs.empty();

  WORK_DAYS.forEach((dayName, index) => {
    const isCurrent = currentDayIndex === index;
    const $btn = $("<button>")
      .attr("type", "button")
      .addClass(`btn ${isCurrent ? "btn-primary" : "btn-outline-primary"}`)
      .text(dayName)
      .attr("aria-pressed", isCurrent)
      .on("click", () => {
        currentDayIndex = index;
        renderDayTabs();
        renderMenu();
      });
    $tabs.append($btn);
  });

  const isAll = currentDayIndex === "all";
  const $allBtn = $("<button>")
    .attr("type", "button")
    .addClass(`btn ${isAll ? "btn-secondary" : "btn-outline-secondary"}`)
    .text("Celý týždeň")
    .attr("aria-pressed", isAll)
    .on("click", () => {
      currentDayIndex = "all";
      renderDayTabs();
      renderMenu();
    });
  $tabs.append($allBtn);
}

function renderMenu() {
  const $schedule = $("#schedule");
  if ($schedule.length === 0) return;
  $schedule.empty();
  const activeRestaurants = allRestaurants.filter(r => visibleRestaurants[r.id] !== false);

  if (activeRestaurants.length === 0) {
    $schedule.append('<p class="col-12 text-center text-muted py-5">Žiadna reštaurácia nie je vybratá alebo nie sú dostupné žiadne dáta.</p>');
    return;
  }

  activeRestaurants.forEach((rest) => {
    const $col = $("<div>").addClass("col-12 col-md-6 col-lg-4");
    const $card = $("<div>").addClass("card h-100 shadow-sm border-0");
    const formattedTime = rest.updatedAt
    ? new Date(rest.updatedAt).toLocaleString("sk-SK", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "neznámy";
    const $header = $("<div>").addClass("card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center");
    $header.append(`<h2 class="h5 mb-0 fw-bold">${rest.name}</h2>`);
    $header.append(`<a href="${rest.website}" target="_blank" rel="noopener" class="small text-decoration-none"><i class="bi bi-box-arrow-up-right me-1"></i>Web</a>`);

    const $body = $("<div>").addClass("card-body");

    if (rest.error) {
      $body.append(`<div class="alert alert-warning mb-0 small">${rest.error}</div>`);
      $card.append($header, $body);
      $col.append($card);
      $schedule.append($col);
      return;
    }
    const daysToDisplay = (currentDayIndex === "all")
      ? rest.days
      : [rest.days[currentDayIndex]].filter(Boolean);

    if (daysToDisplay.length === 0 || daysToDisplay.every(d => !d.items || d.items.length === 0)) {
      $body.append('<p class="text-muted small mb-0">Menu na tento deň nie je k dispozícii.</p>');
    } else {
      daysToDisplay.forEach((dayData) => {
        if (currentDayIndex === "all") {
          $body.append(`<h3 class="h6 fw-bold text-primary mt-2 pb-1 border-bottom">${dayData.day} ${dayData.date}</h3>`);
        }

        const $list = $("<ul>").addClass("list-unstyled mb-3");

        dayData.items.forEach((item) => {
          const isSoup = item.category === "Polievka";
          //const badgeClass = isSoup ? "bg-info-subtle text-info-emphasis" : "bg-light text-dark border";
          let badgeClass = "badge-meal";
          if (item.category === "Polievka") {
            badgeClass = "badge-soup";
          } else if (item.category === "Špeciál") {
            badgeClass = "badge-special";
          }

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
    }

    const $cardFooter = $("<div>").addClass("card-footer bg-light border-top py-2 px-3 text-muted extra-small d-flex justify-content-between align-items-center");
  $cardFooter.html(`
    <span><i class="bi bi-clock-history me-1"></i>Aktualizované:</span>
    <time datetime="${rest.updatedAt || ''}" class="fw-semibold">${formattedTime}</time>
  `);
    $card.append($header, $body, $cardFooter);
    $col.append($card);
    $schedule.append($col);
  });
}

//load data and stuff

async function loadAllMenus(forceRefresh = false) {
  const $loader = $("#loader");
  const $status = $("#last-update");
  const $refreshBtn = $("#updateData");

  if (!forceRefresh) {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const savedDate = new Date(parsed.savedAt);
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

  try {
    $loader.removeClass("d-none");
    //$schedule.addClass("opacity-50");
    $refreshBtn.prop("disabled", true);
    $status.text("Načítavam menu...");

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
          updatedAt: new Date().toISOString(),
          days: days,
          error: days.length === 0 ? "Menu na tento týždeň sa nenašlo." : null
        });
      } catch (err) {
        allRestaurants.push({
          id: source.id,
          name: source.name,
          website: source.website,
          updatedAt: new Date().toISOString(),
          days: [],
          error: "Reštaurácia je momentálne nedostupná."
        });
      }
    }

    const payload = {
      savedAt: new Date().toISOString(),
      restaurants: allRestaurants
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    $status.text(new Date().toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" }));

  } catch (globalError) {
    $status.text("Chyba pri aktualizácii dát");
  } finally {
    $loader.addClass("d-none");
    //$schedule.removeClass("opacity-50");
    $refreshBtn.prop("disabled", false);
    renderDayTabs();
    renderMenu();
  }
}

$(document).ready(() => {
  $("#updateData").on("click", () => {
    loadAllMenus(true);
  });

  $("#deleteSavedData").on("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    $("#last-update").text("Uložené dáta boli vymazané.");
    allRestaurants = [];
    renderMenu();
  });

  $(".filter-restaurant").on("change", function () {
    const restId = $(this).data("rest");
    visibleRestaurants[restId] = $(this).is(":checked");
    renderMenu();
  });

  loadAllMenus();
});