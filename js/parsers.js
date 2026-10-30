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