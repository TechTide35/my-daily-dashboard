
// ============================================
// MY DAILY DASHBOARD
// TOP 10 DEALS COMPONENT
// File: js/deals.js
// Sources: Slickdeals and DealNews
// Simple one-line display
// ============================================

const dealFeeds = [
  {
    name: "Slickdeals",
    url: "https://slickdeals.net/rss.php"
  },
  {
    name: "DealNews",
    url: "https://www.dealnews.com/rss/editors-choice/"
  }
];

const DEAL_PROXY = "https://proxy.cors.dev/";

// ============================================
// FETCH AND READ RSS FEEDS
// ============================================

async function fetchDealFeed(feed) {

  const response = await fetch(
    DEAL_PROXY + feed.url,
    { credentials: "omit" }
  );

  if (!response.ok) {
    throw new Error(
      `${feed.name} feed returned ${response.status}`
    );
  }

  const xmlText = await response.text();

  const parser = new DOMParser();

  const xml = parser.parseFromString(
    xmlText,
    "application/xml"
  );

  if (xml.querySelector("parsererror")) {
    throw new Error("Invalid RSS information.");
  }

  const entries = [
    ...xml.querySelectorAll("item, entry")
  ];

  return entries.map(entry => {

    const getText = selector =>
      entry.querySelector(selector)?.textContent.trim() || "";

    const linkElement =
      entry.querySelector('link[rel="alternate"]') ||
      entry.querySelector("link");

    const link =
      linkElement?.getAttribute("href") ||
      linkElement?.textContent.trim() ||
      "";

    const date =
      getText("pubDate") ||
      getText("published") ||
      getText("updated");

    return {
      title: getText("title"),
      link,
      date,
      source: feed.name
    };
  });
}

// ============================================
// VALIDATE DEAL LINKS
// ============================================

function validDealLink(url) {

  try {

    const parsed = new URL(url);

    return (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:"
    );

  } catch {

    return false;

  }
}

// ============================================
// DISPLAY DEALS
// ============================================

function displayDeals(deals) {

  const container = document.getElementById(
    "deals-list"
  );

  container.replaceChildren();

  if (deals.length === 0) {

    const message = document.createElement("p");

    message.className = "placeholder";

    message.textContent =
      "No deals are currently available. Please try again later.";

    container.appendChild(message);

    return;
  }

  deals.forEach((deal, index) => {

    const item = document.createElement("p");

    item.style.cssText = `
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid var(--border, #293b53);
      font-size: 14px;
      line-height: 1.5;
    `;

    const number = document.createElement("span");

    number.textContent = `${index + 1}. `;

    number.style.color = "var(--accent, #3995f7)";

    item.appendChild(number);

    const link = document.createElement("a");

    link.href = deal.link;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.textContent = deal.title;

    link.style.cssText = `
      color: var(--text, #f1f5f9);
      text-decoration: none;
    `;

    item.appendChild(link);

    container.appendChild(item);

  });
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

async function updateDeals() {

  const status = document.getElementById(
    "deals-status"
  );

  const container = document.getElementById(
    "deals-list"
  );

  if (!status || !container) {

    console.error("Deals dashboard elements missing.");

    return;
  }

  status.textContent = "Finding today's best bargains...";

  status.style.color = "var(--muted, #9aabc0)";

  container.replaceChildren();

  try {

    const results = await Promise.allSettled(
      dealFeeds.map(fetchDealFeed)
    );

    let allDeals = [];

    let successfulFeeds = 0;

    results.forEach((result, index) => {

      if (result.status === "fulfilled") {

        successfulFeeds++;

        allDeals.push(...result.value);

      } else {

        console.warn(
          `${dealFeeds[index].name} unavailable:`,
          result.reason
        );

      }

    });

    // Remove entries without usable titles or links

    allDeals = allDeals.filter(deal =>
      deal.title &&
      validDealLink(deal.link)
    );

    // Remove duplicate titles

    const seen = new Set();

    allDeals = allDeals.filter(deal => {

      const key = deal.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });

    // Sort newest first

    allDeals.sort((a, b) => {

      const dateA = new Date(a.date).getTime() || 0;

      const dateB = new Date(b.date).getTime() || 0;

      return dateB - dateA;

    });

    // Display ten deals maximum

    const topDeals = allDeals.slice(0, 10);

    displayDeals(topDeals);

    if (successfulFeeds === 2) {

      status.textContent =
        `✓ ${topDeals.length} deals loaded successfully.`;

      status.style.color = "#35c98b";

    } else if (successfulFeeds === 1) {

      status.textContent =
        `Loaded ${topDeals.length} deals from one source.`;

      status.style.color = "#fbbf24";

    } else {

      status.textContent =
        "Deal sources unavailable. Please try again.";

      status.style.color = "#f87171";

    }

  } catch (error) {

    console.error("Deals update failed:", error);

    status.textContent =
      "Unable to load deals. Please try again.";

    status.style.color = "#f87171";

    displayDeals([]);

  }

}

// ============================================
// AUTOMATIC INITIAL LOAD
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  updateDeals();

});

// ============================================
// END OF DEALS COMPONENT
// ============================================
