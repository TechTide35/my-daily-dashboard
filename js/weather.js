
// ==================================
// MY DAILY DASHBOARD
// WEATHER INFORMATION
// ==================================

// WEATHER LOCATIONS

const weatherLocations = [
  {
    name: "Alameda",
    latitude: 37.7652,
    longitude: -122.2416,
    prefix: "alameda"
  },
  {
    name: "Union City",
    latitude: 37.5934,
    longitude: -122.0439,
    prefix: "union"
  }
];

// WEATHER DESCRIPTIONS

function getWeatherDescription(code) {

  const descriptions = {
    0: "Clear sky ☀️",
    1: "Mainly clear 🌤️",
    2: "Partly cloudy ⛅",
    3: "Overcast ☁️",
    45: "Foggy 🌫️",
    48: "Foggy 🌫️",
    51: "Light drizzle 🌦️",
    53: "Moderate drizzle 🌦️",
    55: "Heavy drizzle 🌧️",
    61: "Light rain 🌧️",
    63: "Moderate rain 🌧️",
    65: "Heavy rain 🌧️",
    71: "Light snow ❄️",
    73: "Moderate snow ❄️",
    75: "Heavy snow ❄️",
    77: "Snow grains ❄️",
    80: "Rain showers 🌦️",
    81: "Rain showers 🌧️",
    82: "Heavy rain showers 🌧️",
    85: "Snow showers ❄️",
    86: "Heavy snow showers ❄️",
    95: "Thunderstorm ⛈️",
    96: "Thunderstorm with hail ⛈️",
    99: "Severe thunderstorm ⛈️"
  };

  return descriptions[code] || "Conditions unavailable";
}

// LOAD WEATHER FOR ONE LOCATION

async function loadWeather(location) {

  const prefix = location.prefix;

  const url = new URL(
    "https://api.open-meteo.com/v1/forecast"
  );

  url.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "America/Los_Angeles",
    forecast_days: "1"
  }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service unavailable");
  }

  const data = await response.json();

  if (!data.current || !data.daily) {
    throw new Error("Incomplete weather information");
  }

  const round = value =>
    value === null || value === undefined
      ? "Unavailable"
      : Math.round(value);

  document.getElementById(prefix + "-temp").textContent =
    round(data.current.temperature_2m) + "°F";

  document.getElementById(prefix + "-condition").textContent =
    getWeatherDescription(data.current.weather_code);

  document.getElementById(prefix + "-feels").textContent =
    round(data.current.apparent_temperature) + "°F";

  document.getElementById(prefix + "-high").textContent =
    round(data.daily.temperature_2m_max[0]) + "°F";

  document.getElementById(prefix + "-low").textContent =
    round(data.daily.temperature_2m_min[0]) + "°F";

  const rain = data.daily.precipitation_probability_max[0];

  document.getElementById(prefix + "-rain").textContent =
    rain === null ? "Unavailable" : rain + "%";

  document.getElementById(prefix + "-wind").textContent =
    round(data.current.wind_speed_10m) + " mph";
}

// UPDATE BOTH WEATHER LOCATIONS

async function updateWeather() {

  const status = document.getElementById("weather-status");

  status.textContent = "Updating weather information...";

  const results = await Promise.allSettled(
    weatherLocations.map(location => loadWeather(location))
  );

  const successful = results.filter(
    result => result.status === "fulfilled"
  ).length;

  if (successful === 2) {
    status.textContent =
      "Weather updated successfully. Refreshes every 15 minutes.";
  } else if (successful === 1) {
    status.textContent =
      "One location loaded. The other could not be updated. Will retry.";
  } else {
    status.textContent =
      "Unable to load weather. Check your internet connection.";
  }
}

// START WEATHER AND AUTOMATIC REFRESH

updateWeather();

setInterval(updateWeather, 15 * 60 * 1000);
