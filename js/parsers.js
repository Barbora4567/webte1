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

    const tabText = cleanText($doc.find(`a[href="#day-${dayNumber}"]`).text());
    const dateMatch = tabText.match(/\d{1,2}\.\s*\d{1,2}\./);
    const dateStr = dateMatch ? dateMatch[0] : "";

    const items = [];

    $dayContainer.find(".menu-body").each((_, element) => {
      const $card = $(element);

      const rawCategory = cleanText($card.find(".menu-title h4").text());
      const category = normalizeCategory(rawCategory);

      const $desc = $card.find(".menu-description .desc");
      if ($desc.length === 0) return;

      const allergensText = cleanText($desc.find("span").text()).replace(/[()]/g, "");

      const titleWithoutAllergens = cleanText(
        $desc.clone().children().remove().end().text()
      );

      const fullTitle = titleWithoutAllergens || rawCategory;
      if (!fullTitle) return;

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

  // just FreeFood (#free-food)
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

      const $clone = $item.clone();
      $clone.find(".brand, .price").remove();
      const rawMealText = cleanText($clone.text());

      if (!rawMealText || rawMealText.toLowerCase().includes("zatvorené")) {
        return;
      }
      let allergens = "";
      const matchAllergens = rawMealText.match(/A:\s*([0-9,]+)/i);
      if (matchAllergens) {
        allergens = matchAllergens[1];
      }

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

  for (let i = 0; i < 5; i++) {
    days.push({
      day: DAY_NAMES[i],
      date: "",
      items: []
    });
  }

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

  $doc.find("p").each((_, p) => {
    const rawHtml = $(p).html() || "";

    const textOnly = cleanText($(p).text());
    if (textOnly.toLowerCase().startsWith("špeciál:") || textOnly.toLowerCase().startsWith("special:")) {
      let title = cleanText(textOnly.replace(/^špeciál:\s*/i, ""));
      let allergens = "";
      const matchAllergens = title.match(/([0-9,\s]+)$/);
      if (matchAllergens && matchAllergens[1].trim().length > 0) {
        allergens = cleanText(matchAllergens[1]).replace(/\s+/g, ",");
        title = cleanText(title.replace(/([0-9,\s]+)$/, ""));
      }

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

    const lines = rawHtml
      .split(/<br\s*\/?>/i)
      .map(line => {
        const tmp = document.createElement("div");
        tmp.innerHTML = line;
        return cleanText(tmp.textContent);
      })
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    const firstLine = lines[0].toLowerCase();
    const dayIndex = DAY_NAMES.findIndex(d => firstLine.startsWith(d.toLowerCase()));

    if (dayIndex === -1 || dayIndex >= 5) return;
    lastDayIndex = dayIndex;

    const items = [];

    for (let j = 1; j < lines.length; j++) {
      const lineText = lines[j];
      if (lineText.toLowerCase().includes("zatvorené") || lineText.toLowerCase().includes("uzavretá spoločnosť")) {
        continue;
      }
      const isInlineSpecial = lineText.toLowerCase().startsWith("špeciál:");
      let rawTitle = cleanText(lineText.replace(/^špeciál:\s*/i, ""));
      let allergens = "";
      const matchAllergens = rawTitle.match(/([0-9,\s]+)$/);
      if (matchAllergens && matchAllergens[1].trim().length > 0) {
        allergens = cleanText(matchAllergens[1]).replace(/\s+/g, ",");
        rawTitle = cleanText(rawTitle.replace(/([0-9,\s]+)$/, ""));
      }

      let category = "Hlavné jedlo";
      let price = defaultMenuPrice;

      if (isInlineSpecial) {
        category = "Špeciál";
        price = specialMenuPrice;
      } else if (j === 1 || j === 2) {
        category = "Polievka";
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