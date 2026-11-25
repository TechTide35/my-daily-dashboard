
// ============================================
// MY DAILY DASHBOARD
// BAY AREA SPORTS COMPONENT
// File: js/teams.js
// Data source: ESPN public JSON endpoints
// Simple clickable sports information
// ============================================

const sportsTeams = [
  {
    name: "San Francisco 49ers",
    emoji: "🏈",
    league: "NFL",
    sport: "football",
    leagueCode: "nfl",
    teamCode: "sf",
    keywords: ["49ers", "San Francisco 49ers"]
  },
  {
    name: "Golden State Warriors",
    emoji: "🏀",
    league: "NBA",
    sport: "basketball",
    leagueCode: "nba",
    teamCode: "gs",
    keywords: ["Warriors", "Golden State Warriors"]
  },
  {
    name: "San Francisco Giants",
    emoji: "⚾",
    league: "MLB",
    sport: "baseball",
    leagueCode: "mlb",
    teamCode: "sf",
    keywords: ["San Francisco Giants", "Giants"]
  }
];

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports";


// ============================================
// FETCH ESPN DATA
// ============================================

async function fetchSportsData(url) {

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Sports data unavailable.");
  }

  return await response.json();
}


// ============================================
// GET MOST RECENT COMPLETED GAME
// ============================================

async function getLatestGame(team) {

  const url =
    `${ESPN_BASE}/${team.sport}/${team.leagueCode}` +
    `/teams/${team.teamCode}/schedule`;

  const data = await fetchSportsData(url);

  const completedGames = (data.events || [])
    .filter(event => {

      const competition = event.competitions?.[0];

      return competition?.status?.type?.completed &&
        competition.competitors?.length >= 2;

    })
    .sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

  if (completedGames.length === 0) {
    return null;
  }

  const game = completedGames[0];

  const competition = game.competitions[0];

  const competitors = competition.competitors;

  // Identify our team within its league

  const myTeam = competitors.find(item =>
    item.team.abbreviation?.toUpperCase() ===
    team.teamCode.toUpperCase()
  ) || competitors.find(item =>
    item.team.displayName === data.team?.displayName
  );

  if (!myTeam) {
    return null;
  }

  const opponent = competitors.find(
    item => item !== myTeam
  );

  if (!opponent) {
    return null;
  }

  const myScore = Number(myTeam.score?.value);

  const opponentScore = Number(opponent.score?.value);

  if (
    !Number.isFinite(myScore) ||
    !Number.isFinite(opponentScore)
  ) {
    return null;
  }

  let result = "TIE";

  if (myScore > opponentScore) {
    result = "WIN";
  } else if (myScore < opponentScore) {
    result = "LOSS";
  }

  const gameLink = game.links?.find(
    link => link.href
  )?.href;

  return {
    result,
    score: `${myScore}–${opponentScore}`,
    opponent: opponent.team.displayName,
    homeAway: myTeam.homeAway,
    link: gameLink || null
  };
}


// ============================================
// GET RELEVANT TEAM HEADLINE
// ============================================

async function getTeamHeadline(team) {

  const url =
    `${ESPN_BASE}/${team.sport}/${team.leagueCode}` +
    `/news?limit=40`;

  const data = await fetchSportsData(url);

  const articles = (data.articles || [])
    .filter(article => {

      const searchText = (
        (article.headline || "") + " " +
        (article.description || "")
      ).toLowerCase();

      return team.keywords.some(keyword =>
        searchText.includes(keyword.toLowerCase())
      );

    })
    .sort((a, b) =>
      new Date(b.published || 0) -
      new Date(a.published || 0)
    );

  if (articles.length === 0) {
    return null;
  }

  const article = articles[0];

  const articleLink =
    article.links?.web?.href ||
    article.links?.api?.news?.href ||
    null;

  return {
    title: article.headline || "Team news",
    link: articleLink
  };
}


// ============================================
// VALIDATE SPORTS LINKS
// ============================================

function validSportsLink(url) {

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
// CREATE A SIMPLE SPORTS LINE
// ============================================

function createSportsLine(container, text, url) {

  const item = document.createElement("p");

  item.style.cssText = `
    margin: 8px 0;
    padding: 6px 0;
    font-size: 14px;
    line-height: 1.5;
    border-bottom: 1px solid var(--border, #293b53);
  `;

  if (url && validSportsLink(url)) {

    const link = document.createElement("a");

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    link.textContent = text;

    link.style.cssText = `
      color: var(--text, #f1f5f9);
      text-decoration: none;
    `;

    item.appendChild(link);

  } else {

    item.textContent = text;

    item.style.color = "var(--muted, #9aabc0)";

  }

  container.appendChild(item);
}


// ============================================
// DISPLAY ONE TEAM
// ============================================

function displayTeam(team, game, headline) {

  const container = document.getElementById(
    "bay-area-sports"
  );

  // Team name

  const heading = document.createElement("h3");

  heading.textContent =
    `${team.emoji} ${team.name}`;

  heading.style.cssText = `
    color: var(--text, #f1f5f9);
    font-size: 16px;
    margin: 16px 0 6px;
  `;

  container.appendChild(heading);


  // Latest completed game

  if (game) {

    const resultText =
      game.result === "WIN" ? "WIN" :
      game.result === "LOSS" ? "LOSS" :
      "TIE";

    const location =
      game.homeAway === "home" ? "vs." : "at";

    const scoreText =
      `${resultText} | ${game.score} ${location} ${game.opponent}`;

    createSportsLine(
      container,
      scoreText,
      game.link
    );

  } else {

    createSportsLine(
      container,
      "Latest completed game unavailable.",
      null
    );

  }


  // Latest team headline

  if (headline) {

    createSportsLine(
      container,
      `📰 ${headline.title}`,
      headline.link
    );

  } else {

    createSportsLine(
      container,
      "Latest team headline unavailable.",
      null
    );

  }

}


// ============================================
// MAIN REFRESH FUNCTION
// ============================================

async function updateTeams() {

  const status = document.getElementById(
    "teams-status"
  );

  const container = document.getElementById(
    "bay-area-sports"
  );

  if (!status || !container) {

    console.error("Sports dashboard HTML elements missing.");

    return;
  }

  status.textContent =
    "Updating Bay Area team information...";

  status.style.color = "var(--muted, #9aabc0)";

  container.replaceChildren();

  let successfulTeams = 0;

  for (const team of sportsTeams) {

    let game = null;
    let headline = null;

    const results = await Promise.allSettled([
      getLatestGame(team),
      getTeamHeadline(team)
    ]);

    if (results[0].status === "fulfilled") {

      game = results[0].value;

    } else {

      console.warn(
        `${team.name} game data failed:`,
        results[0].reason
      );

    }

    if (results[1].status === "fulfilled") {

      headline = results[1].value;

    } else {

      console.warn(
        `${team.name} news data failed:`,
        results[1].reason
      );

    }

    if (game || headline) {
      successfulTeams++;
    }

    displayTeam(team, game, headline);

  }


  // Final status

  if (successfulTeams === sportsTeams.length) {

    status.textContent =
      "✓ All three Bay Area teams updated successfully.";

    status.style.color = "#35c98b";

  } else if (successfulTeams > 0) {

    status.textContent =
      `Updated information for ${successfulTeams} of 3 teams.`;

    status.style.color = "#fbbf24";

  } else {

    status.textContent =
      "Sports information is temporarily unavailable. Please try again.";

    status.style.color = "#f87171";

  }

}


// ============================================
// AUTOMATIC INITIAL LOAD
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  updateTeams();

});


// ============================================
// END OF SPORTS COMPONENT
// ============================================
