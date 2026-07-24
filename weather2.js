const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const messageEl = document.getElementById('message');
const locationName = document.getElementById('location-name');
const localTime = document.getElementById('local-time');
const temperatureEl = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const rainChanceEl = document.getElementById('rain-chance');
const forecastGrid = document.getElementById('forecast-grid');

const weatherCodeMap = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm'
};

const iconMap = {
  Clear: 'fa-sun',
  'Mainly clear': 'fa-sun',
  'Partly cloudy': 'fa-cloud-sun',
  Overcast: 'fa-cloud',
  Fog: 'fa-smog',
  'Depositing rime fog': 'fa-smog',
  'Light drizzle': 'fa-cloud-drizzle',
  'Moderate drizzle': 'fa-cloud-drizzle',
  'Dense drizzle': 'fa-cloud-showers-heavy',
  'Freezing drizzle': 'fa-cloud-meatball',
  'Dense freezing drizzle': 'fa-cloud-meatball',
  'Light rain': 'fa-cloud-rain',
  'Moderate rain': 'fa-cloud-showers-heavy',
  'Heavy rain': 'fa-cloud-showers-heavy',
  'Freezing rain': 'fa-cloud-meatball',
  'Heavy freezing rain': 'fa-cloud-meatball',
  'Light snow': 'fa-snowflake',
  'Moderate snow': 'fa-snowflake',
  'Heavy snow': 'fa-snowflake',
  'Snow grains': 'fa-snowflake',
  'Rain showers': 'fa-cloud-showers-heavy',
  'Heavy rain showers': 'fa-cloud-showers-heavy',
  'Violent rain showers': 'fa-cloud-showers-heavy',
  'Light snow showers': 'fa-snowflake',
  'Heavy snow showers': 'fa-snowflake',
  Thunderstorm: 'fa-bolt'
};

function showMessage(text, type = 'success') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function clearMessage() {
  messageEl.textContent = '';
  messageEl.className = 'message';
}

function formatTime(value) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getIconClass(code) {
  const label = weatherCodeMap[code] || 'Clear';
  return iconMap[label] || 'fa-cloud';
}

function renderForecast(daily) {
  forecastGrid.innerHTML = '';
  const days = daily.time.slice(1, 5);

  days.forEach((dateString, index) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString([], { weekday: 'short' });
    const code = daily.weathercode[index + 1];
    const description = weatherCodeMap[code] || 'Unknown';
    const iconClass = getIconClass(code);
    const card = document.createElement('article');
    card.className = 'forecast-card';
    card.innerHTML = `
      <h3>${dayName}</h3>
      <div class="forecast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <p>${description}</p>
      <p><strong>${Math.round(daily.temperature_2m_max[index + 1])}° / ${Math.round(daily.temperature_2m_min[index + 1])}°</strong></p>
    `;
    forecastGrid.appendChild(card);
  });
}

async function fetchWeatherData(lat, lon, label, timezone = 'auto') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(timezone)}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=apparent_temperature,relativehumidity_2m,pressure_msl,precipitation_probability,windspeed_10m&forecast_days=4`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Unable to retrieve weather details.');
    }
    const data = await response.json();
    updateWeatherUI(data, label);
    return data;
  } catch (error) {
    showMessage(error.message, 'error');
    throw error;
  }
}

async function fetchLocationWeather(city) {
  try {
    clearMessage();
    if (!city) {
      showMessage('Please enter a city name.', 'error');
      return;
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const response = await fetch(geoUrl);
    if (!response.ok) {
      throw new Error('Unable to look up that location.');
    }

    const geoData = await response.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found. Try a different name.');
    }

    const result = geoData.results[0];
    const label = `${result.name}, ${result.country}`;
    await fetchWeatherData(result.latitude, result.longitude, label, result.timezone);
    cityInput.value = '';
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function updateWeatherUI(data, label) {
  clearMessage();

  const current = data.current_weather;
  const hourly = data.hourly;
  const daily = data.daily;
  const currentIndex = hourly.time.indexOf(current.time);
  const timeIndex = currentIndex !== -1 ? currentIndex : 0;
  const apparent = hourly.apparent_temperature[timeIndex];
  const humidity = hourly.relativehumidity_2m[timeIndex];
  const pressure = hourly.pressure_msl[timeIndex];
  const rainChance = hourly.precipitation_probability[timeIndex];
  const description = weatherCodeMap[current.weathercode] || 'Clear';

  locationName.textContent = label;
  localTime.textContent = `Local time: ${formatTime(current.time)}`;
  temperatureEl.textContent = `${Math.round(current.temperature)}°C`;
  weatherDescription.textContent = description;
  feelsLikeEl.textContent = `${Math.round(apparent)}°C`;
  humidityEl.textContent = `${Math.round(humidity)}%`;
  windSpeedEl.textContent = `${Math.round(current.windspeed)} m/s`;
  pressureEl.textContent = `${Math.round(pressure)} hPa`;
  sunriseEl.textContent = formatTime(daily.sunrise[0]);
  sunsetEl.textContent = formatTime(daily.sunset[0]);
  rainChanceEl.textContent = `${Math.round(rainChance)}%`;

  const iconClass = getIconClass(current.weathercode);
  document.querySelector('.weather-icon i').className = `fa-solid ${iconClass}`;
  renderForecast(daily);
}

function getCurrentPosition() {
  if (!navigator.geolocation) {
    showMessage('Geolocation is not supported by your browser.', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeatherData(position.coords.latitude, position.coords.longitude, 'Your location');
    },
    () => {
      showMessage('Unable to retrieve your location.', 'error');
    },
    { timeout: 10000 }
  );
}

searchBtn.addEventListener('click', () => {
  fetchLocationWeather(cityInput.value.trim());
});

locationBtn.addEventListener('click', getCurrentPosition);

cityInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    fetchLocationWeather(cityInput.value.trim());
  }
});

showMessage('Using free Open-Meteo API. Enter a city and search to get started.');
