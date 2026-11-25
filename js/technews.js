
// ==========================================
// MY DAILY DASHBOARD
// TECHNOLOGY NEWS COMPONENT
// File: js/technews.js
// Simple clickable headlines
// ==========================================

const techNewsFeeds = [
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml"
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index"
  },
  {
    name: "BBC Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml"
  }
];

const techNewsProxy = "https://proxy.cors.dev/";


// ==========================================
// MAIN UPDATE FUNCTION
// ==========================================

async function updateTechNews() {

  const status =
    document.getElementById("technews-status");

  const container =
    document.getElementById("technews-list");

  if (!status || !container) {
    console.error("Technology news HTML elements not found.");
    return;
  }

  status.textContent =
    "Updating technology headlines...";

  status.style.color = "var(--muted, #9aabc0)";

  container.replaceChildren();

  try {

    const results = await Promise.allSettled(
      techNewsFeeds.map(feed => getTechFeed(feed))
    );

    let articles = [];

    results.forEach((result, index) => {

      if (result.status === "fulfilled") {

        articles.push(...result.value);

      } else {

        console.error(
          techNewsFeeds[index].name + " feed failed:",
          result.reason
        );

      }

    });

    // Remove invalid links

    articles = articles.filter(article =>
      article.title &&
      validTechLink(article.link)
    );

    // Remove duplicate article links

    const seen = new Set();

    const uniqueArticles = articles.filter(article => {

      const key = article.link;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;

    });

    // Sort newest first

    uniqueArticles.sort((a, b) => {

      const dateA = new Date(a.date).getTime() || 0;

      const dateB = new Date(b.date).getTime() || 0;

      return dateB - dateA;

    });

    // Display five newest stories

    const topArticles = uniqueArticles.slice(0, 5);

    displayTechNews(topArticles, container);

    const successfulFeeds = results.filter(
      result => result.status === "fulfilled"
    ).length;

    if (successfulFeeds === techNewsFeeds.length) {

      status.textContent =
        `✓ ${topArticles.length} technology headlines updated.`;

      status.style.color = "#35c98b";

    } else if (successfulFeeds > 0) {

      status.textContent =
        `${topArticles.length} headlines loaded from ` +
        `${successfulFeeds} of ${techNewsFeeds.length} sources.`;

      status.style.color = "#fbbf24";

    } else {

      status.textContent =
        "Technology news sources unavailable. Please try again.";

      status.style.color = "#f87171";

    }

  } catch (error) {

    console.error("Technology news error:", error);

    status.textContent =
      "Unable to retrieve technology news.";

    status.style.color = "#f87171";

  }

}


// ==========================================
// FETCH AND READ AN RSS FEED
// ==========================================

async function getTechFeed(feed) {

  const response = await fetch(
    techNewsProxy + feed.url,
    {
      method: "GET",
      credentials: "omit"
    }
  );

  if (!response.ok) {

    throw new Error(
      `${feed.name} returned HTTP ${response.status}`
    );

  }

  const xmlText = await response.text();

  const parser = new DOMParser();

  const xml = parser.parseFromString(
    xmlText,
    "text/xml"
  );

  if (xml.querySelector("parsererror")) {
    throw new Error("Invalid RSS or Atom feed.");
  }

  // Support RSS and Atom formats

  const items = [
    ...xml.getElementsByTagName("item"),
    ...xml.getElementsByTagName("entry")
  ];

  return items.map(item => {

    const title =
      getTechFeedValue(item, "title");

    const link =
      getTechArticleLink(item);

    const date =
      getTechFeedValue(item, "pubDate") ||
      getTechFeedValue(item, "published") ||
      getTechFeedValue(item, "updated");

    return {
      title: cleanTechText(title),
      link: link,
      date: date
    };

  }).filter(article => {

    return article.title && article.link;

  });

}


// ==========================================
// READ RSS / ATOM ELEMENTS
// ==========================================

function getTechFeedValue(item, tagName) {

  const element =
    item.getElementsByTagName(tagName)[0] ||
    item.getElementsByTagNameNS("*", tagName)[0];

  return element ? element.textContent.trim() : "";

}


function getTechArticleLink(item) {

  const links =
    item.getElementsByTagName("link");

  for (const link of links) {

    const href = link.getAttribute("href");

    if (href && (
      !link.getAttribute("rel") ||
      link.getAttribute("rel") === "alternate"
    )) {

      return href;

    }

    if (link.textContent.trim()) {

      return link.textContent.trim();

    }

  }

  return "";

}


// ==========================================
// CLEAN ARTICLE TEXT
// ==========================================

function cleanTechText(value) {

  if (!value) return "";

  const parser = new DOMParser();

  const document = parser.parseFromString(
    value,
    "text/html"
  );

  return (document.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

}


// ==========================================
// VALIDATE ARTICLE LINKS
// ==========================================

function validTechLink(url) {

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


// ==========================================
// DISPLAY SIMPLE CLICKABLE HEADLINES
// ==========================================

function displayTechNews(articles, container) {

  container.replaceChildren();

  if (articles.length === 0) {

    const message = document.createElement("p");

    message.className = "placeholder";

    message.textContent =
      "No technology headlines are currently available.";

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


// ==========================================
// INITIAL LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  updateTechNews();

});


// ==========================================
// AUTOMATIC REFRESH EVERY 15 MINUTES
// ==========================================

setInterval(() => {

  updateTechNews();

}, 15 * 60 * 1000);


// ==========================================
// END OF TECHNOLOGY NEWS COMPONENT
// ==========================================
