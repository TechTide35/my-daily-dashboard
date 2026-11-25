
// ============================================
// MY DAILY DASHBOARD
// GENERAL NEWS COMPONENT
// File: js/news.js
// Simple clickable headlines
// Sources: BBC, NPR, Guardian,
//          Al Jazeera and New York Times
// ============================================

const newsFeeds = [
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml"
  },
  {
    name: "NPR",
    url: "https://feeds.npr.org/1001/rss.xml"
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss"
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml"
  },
  {
    name: "New York Times",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
  }
];

const NEWS_PROXY = "https://proxy.cors.dev/";

const NEWS_LIMIT = 5;


// ============================================
// FETCH NEWS FEED
// ============================================

async function fetchNewsFeed(feed) {

  const response = await fetch(
    NEWS_PROXY + feed.url,
    { credentials: "omit" }
  );

  if (!response.ok) {
    throw new Error(
      `${feed.name} returned ${response.status}`
    );
  }

  const xmlText = await response.text();

  const parser = new DOMParser();

  const xml = parser.parseFromString(
    xmlText,
    "application/xml"
  );

  if (xml.querySelector("parsererror")) {
    throw new Error(`${feed.name} returned invalid XML.`);
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

    const published =
      getText("pubDate") ||
      getText("published") ||
      getText("updated");

    return {
      title: getText("title"),
      link,
      published,
      source: feed.name
    };

  });

}


// ============================================
// VALIDATE ARTICLE LINKS
// ============================================

function validNewsLink(url) {

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
// DISPLAY SIMPLE CLICKABLE HEADLINES
// ============================================

function displayNews(articles) {

  const container = document.getElementById(
    "news-list"
  );

  container.replaceChildren();

  if (articles.length === 0) {

    const message = document.createElement("p");

    message.className = "placeholder";

    message.textContent =
      "No news headlines are currently available.";

    container.appendChild(message);

    return;

  }

  articles.forEach((article, index) => {

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

    link.href = article.link;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.textContent = article.title;

    link.style.cssText = `
      color: var(--text, #f1f5f9);
      text-decoration: none;
    `;

    item.appendChild(link);

    container.appendChild(item);

  });

}


// ============================================
// MAIN NEWS UPDATE FUNCTION
// ============================================

async function updateNews() {

  const status = document.getElementById(
    "news-status"
  );

  const container = document.getElementById(
    "news-list"
  );

  if (!status || !container) {

    console.error("News dashboard elements missing.");

    return;

  }

  status.textContent = "Gathering the latest headlines...";

  status.style.color = "var(--muted, #9aabc0)";

  container.replaceChildren();

  const results = await Promise.allSettled(
    newsFeeds.map(fetchNewsFeed)
  );

  let articles = [];

  let successfulFeeds = 0;

  results.forEach((result, index) => {

    if (result.status === "fulfilled") {

      successfulFeeds++;

      articles.push(...result.value);

    } else {

      console.warn(
        `${newsFeeds[index].name} unavailable:`,
        result.reason
      );

    }

  });

  // Keep valid headlines and links

  articles = articles.filter(article =>
    article.title &&
    validNewsLink(article.link)
  );

  // Remove duplicate headlines

  const seen = new Set();

  articles = articles.filter(article => {

    const key = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;

  });

  // Sort newest first

  articles.sort((a, b) => {

    const dateA = new Date(a.published).getTime() || 0;

    const dateB = new Date(b.published).getTime() || 0;

    return dateB - dateA;

  });

  // Display five headlines

  const topArticles = articles.slice(0, NEWS_LIMIT);

  displayNews(topArticles);

  // Update status

  if (successfulFeeds === newsFeeds.length) {

    status.textContent =
      `✓ ${topArticles.length} headlines updated successfully.`;

    status.style.color = "#35c98b";

  } else if (successfulFeeds > 0) {

    status.textContent =
      `${topArticles.length} headlines loaded from ${successfulFeeds} of 5 sources.`;

    status.style.color = "#fbbf24";

  } else {

    status.textContent =
      "News sources unavailable. Please try again.";

    status.style.color = "#f87171";

  }

}


// ============================================
// AUTOMATIC INITIAL LOAD
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  updateNews();

});


// ============================================
// AUTOMATIC REFRESH EVERY 15 MINUTES
// ============================================

setInterval(() => {

  updateNews();

}, 15 * 60 * 1000);


// ============================================
// END OF NEWS COMPONENT
// ============================================
