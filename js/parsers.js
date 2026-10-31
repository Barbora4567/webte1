const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];


function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}
function textOf(element, selector) {
  return cleanText(element.querySelector(selector)?.textContent ?? "");
}

function parsePrice(text) {
  if (!text) {
    return null;
  }
  // Skip everything before the first digit ("Vstupné: 8,50 €" -> "8,50 €")
  const price = parseFloat(text.replace(/^\D*/, "").replace(",", "."));
  return Number.isNaN(price) ? null : price;
}
function parseHtml(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

//eatandmeet
function normalizeCategory(rawCategory) {
  if (!rawCategory) return "Jedlo";
  const lower = rawCategory.toLowerCase();

  if (lower.includes("polievka")) return "Polievka";
  if (lower.includes("šalát") || lower.includes("salat")) return "Šalát";
  if (lower.includes("sladk") || lower.includes("dezert") || lower.includes("koláč")) return "Sladké";
  if (lower.includes("menu") || lower.includes("hlavn")) return "Hlavné jedlo";

  const cleaned = rawCategory.replace(/\d+/g, "").trim();
  return cleaned || "Jedlo";
}

function parseEatAndMeetJquery(doc) {
  const $doc = $(doc);
  const days = [];

  for (let i = 0; i < 5; i++) {
    const dayName = DAY_NAMES[i];
    const dayNumber = i + 1;
    const $dayContainer = $doc.find(`#day-${dayNumber}`);

    if ($dayContainer.length === 0) {
      days.push({ day: dayName, date: "", items: [] });
      continue;
    }

    // Dátum z odkazu na záložku dňa
    const tabText = cleanText($doc.find(`a[href="#day-${dayNumber}"]`).text());
    const dateMatch = tabText.match(/\d{1,2}\.\s*\d{1,2}\./);
    const dateStr = dateMatch ? dateMatch[0] : "";

    const items = [];

    // Prechádzame karty jednotlivých jedál (.menu-body)
    $dayContainer.find(".menu-body").each((_, element) => {
      const $card = $(element);

      const rawCategory = cleanText($card.find(".menu-title h4").text());
      const category = normalizeCategory(rawCategory);

      const $desc = $card.find(".menu-description .desc");
      if ($desc.length === 0) return;

      const allergensText = cleanText($desc.find("span").text()).replace(/[()]/g, "");

      // Názov jedla očistený od spanu s alergénmi
      const titleWithoutAllergens = cleanText(
        $desc.clone().children().remove().end().text()
      );

      const fullTitle = titleWithoutAllergens || rawCategory;
      if (!fullTitle) return;

      // Cena: vezmeme prvú sumu pred lomítkom (bežná cena)
      const priceRaw = cleanText($card.find(".price").text());
      const regularPrice = parsePrice(priceRaw.split("/")[0]);

      items.push({
        category: category,
        title: fullTitle,
        price: regularPrice,
        allergens: allergensText || null
      });
    });

    days.push({
      day: dayName,
      date: dateStr,
      items: items
    });
  }

  return days;
}

function parseFreeFoodJquery(doc) {
  const $doc = $(doc);
  const days = [];

  // Zameriame sa iba na kontajner FreeFood (#free-food)
  const $freeFoodTab = $doc.find("#free-food");
  if ($freeFoodTab.length === 0) return days;

  $freeFoodTab.find("ul.daily-offer > li").each((index, dayLi) => {
    if (index >= 5) return;

    const $dayLi = $(dayLi);
    const dayName = DAY_NAMES[index];
    const rawTitle = cleanText($dayLi.find(".day-title").first().text());
    const dateMatch = rawTitle.match(/\d{1,2}\.\d{1,2}\.(\d{4})?/);
    const dateStr = dateMatch ? dateMatch[0] : "";
    const items = [];

    $dayLi.find("ul.day-offer > li").each((_, itemLi) => {
      const $item = $(itemLi);

      const prefix = cleanText($item.find(".brand").first().text());
      const isSoup = prefix.toLowerCase().includes("p");
      const category = isSoup ? "Polievka" : "Hlavné jedlo";

      const priceText = cleanText($item.find(".price").text());
      const price = parsePrice(priceText);

      // Názov jedla očistíme od prefixu a ceny
      // Naklonujeme položku, zmažeme span prvky (.brand a .price) a vezmeme čistý text
      const $clone = $item.clone();
      $clone.find(".brand, .price").remove();
      const rawMealText = cleanText($clone.text());

      // Ak je reštaurácia zatvorená alebo je text prázdny, preskočíme
      if (!rawMealText || rawMealText.toLowerCase().includes("zatvorené")) {
        return;
      }

      // Vytiahnutie alergénov (vo FreeFood bývajú vo formáte "A:1,3,7")
      let allergens = "";
      const matchAllergens = rawMealText.match(/A:\s*([0-9,]+)/i);
      if (matchAllergens) {
        allergens = matchAllergens[1];
      }

      // Očistenie názvu od reťazca alergénov
      const title = cleanText(rawMealText.replace(/A:\s*[0-9,]+/gi, ""));

      items.push({
        category: category,
        title: title,
        price: price,
        allergens: allergens || null
      });
    });

    days.push({
      day: dayName,
      date: dateStr,
      items: items
    });
  });

  return days;
}

function parseWhiteDragonJquery(doc) {
  const $doc = $(doc);
  const days = [];

  // 1. Inicializácia pracovných dní (Pondelok - Piatok)
  for (let i = 0; i < 5; i++) {
    days.push({
      day: DAY_NAMES[i],
      date: "",
      items: []
    });
  }

  // 2. Extrakcia globálnych cien z textu (napr. "Cena menu – 9,90 eur", "Cena menu špeciál – 12 eur")
  const fullPageText = $doc.text();
  let defaultMenuPrice = 9.90;
  let specialMenuPrice = 12.00;

  const defaultPriceMatch = fullPageText.match(/Cena\s+menu\s*[–-]\s*(\d+[.,]?\d*)\s*eur/i);
  if (defaultPriceMatch) {
    defaultMenuPrice = parsePrice(defaultPriceMatch[1]) ?? 9.90;
  }

  const specialPriceMatch = fullPageText.match(/Cena\s+menu\s+špeciál\s*[–-]\s*(\d+[.,]?\d*)\s*eur/i);
  if (specialPriceMatch) {
    specialMenuPrice = parsePrice(specialPriceMatch[1]) ?? 12.00;
  }

  let lastDayIndex = 0;

  // 3. Prehľadávanie odsekov <p> v hlavnom obsahu
  $doc.find("p").each((_, p) => {
    const rawHtml = $(p).html() || "";

    // A) Ošetrenie samostatného odseku so Špeciálom (napr. <p>Špeciál: Ázíjsky zeleninový wok...</p>)
    const textOnly = cleanText($(p).text());
    if (textOnly.toLowerCase().startsWith("špeciál:") || textOnly.toLowerCase().startsWith("special:")) {
      let title = cleanText(textOnly.replace(/^špeciál:\s*/i, ""));

      // Vytiahnutie alergénov z konca riadku
      let allergens = "";
      const matchAllergens = title.match(/([0-9,\s]+)$/);
      if (matchAllergens && matchAllergens[1].trim().length > 0) {
        allergens = cleanText(matchAllergens[1]).replace(/\s+/g, ",");
        title = cleanText(title.replace(/([0-9,\s]+)$/, ""));
      }

      // Zaradíme špeciál do naposledy spracovaného dňa (v HTML je to streda)
      if (days[lastDayIndex]) {
        days[lastDayIndex].items.push({
          category: "Špeciál",
          title: title,
          price: specialMenuPrice,
          allergens: allergens || null
        });
      }
      return;
    }

    // B) Spracovanie bežného dňa s riadkami oddelenými cez <br>
    const lines = rawHtml
      .split(/<br\s*\/?>/i)
      .map(line => {
        const tmp = document.createElement("div");
        tmp.innerHTML = line;
        return cleanText(tmp.textContent);
      })
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    // Prvý riadok musí byť názov dňa
    const firstLine = lines[0].toLowerCase();
    const dayIndex = DAY_NAMES.findIndex(d => firstLine.startsWith(d.toLowerCase()));

    if (dayIndex === -1 || dayIndex >= 5) return;
    lastDayIndex = dayIndex;

    const items = [];

    // Prechádzame riadky daného dňa
    for (let j = 1; j < lines.length; j++) {
      const lineText = lines[j];

      // Ignorujeme zatvorené dni
      if (lineText.toLowerCase().includes("zatvorené") || lineText.toLowerCase().includes("uzavretá spoločnosť")) {
        continue;
      }

      // Kontrola, či riadok vnútri nie je označený ako špeciál
      const isInlineSpecial = lineText.toLowerCase().startsWith("špeciál:");
      let rawTitle = cleanText(lineText.replace(/^špeciál:\s*/i, ""));

      // Alergény na konci reťazca (napr. "7,10" alebo "1,3,4,6 11")
      let allergens = "";
      const matchAllergens = rawTitle.match(/([0-9,\s]+)$/);
      if (matchAllergens && matchAllergens[1].trim().length > 0) {
        allergens = cleanText(matchAllergens[1]).replace(/\s+/g, ",");
        rawTitle = cleanText(rawTitle.replace(/([0-9,\s]+)$/, ""));
      }

      // Kategória a cena:
      // Prvé 2 jedlá dňa sú polievky (j === 1 alebo j === 2)
      let category = "Hlavné jedlo";
      let price = defaultMenuPrice;

      if (isInlineSpecial) {
        category = "Špeciál";
        price = specialMenuPrice;
      } else if (j === 1 || j === 2) {
        category = "Polievka";
        // Polievka býva v cene menu, alebo ak je samostatne, môžeme nechať null / 0
        price = null;
      }

      items.push({
        category: category,
        title: rawTitle,
        price: price,
        allergens: allergens || null
      });
    }

    days[dayIndex].items = items;
  });

  return days;
}