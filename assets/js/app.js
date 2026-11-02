/* ================================================================== */
/* COMPLETE INTERACTIVE WEATHER APPLICATION SCRIPT                    */
/* ================================================================== */

let map = null;
let marker = null;
let currentSelectedTimezone = 'Asia/Baku';

const AZ_WEEKDAYS_SHORT = ['Bazar', 'B.ertəsi', 'Ç.axşamı', 'Çərşənbə', 'C.axşamı', 'Cümə', 'Şənbə'];
const AZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];

/**
 * Xəritənin OpenStreetMap (Pulsuz API Key-siz) təbəqəsi ilə yaradılması
 */
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Xəritə obyekti
    map = L.map('map', { 
        zoomControl: false,
        attributionControl: true
    }).setView([40.4093, 49.8671], 7);

    // 100% Pulsuz və API açarı tələb etməyən standart OpenStreetMap qatı
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Xəritəyə klik hadisəsi
    map.on('click', onMapClick);

    // Ölçü hesablama xətalarının qarşısını alan taymerlər
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 200);

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 800);
}

/**
 * Xəritəyə klik edildikdə koordinatların çəkilməsi
 */
function onMapClick(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    executeWeatherDataAndLocation(lat, lon);
}

/**
 * Mətnin normalizasiyası
 */
function normalizeAzText(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/ə/g, 'e')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i');
}

/**
 * Məkan axtarışı (Nominatim API)
 */
async function performSearch() {
    const cityInput = document.getElementById('city-input');
    if (!cityInput) return;

    const query = cityInput.value.trim();
    if (!query) return;

    const normalizedQuery = normalizeAzText(query);
    let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=az`;

    try {
        let response = await fetch(searchUrl);
        let data = await response.json();

        if (!data || data.length === 0) {
            searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&accept-language=az`;
            response = await fetch(searchUrl);
            data = await response.json();
        }

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const displayName = data[0].display_name.split(',')[0];

            if (map) {
                map.setView([lat, lon], 11);
                setTimeout(() => map.invalidateSize(), 150);
            }

            saveToQuickLocations(displayName, lat, lon);
            await executeWeatherDataAndLocation(lat, lon, displayName);
        } else {
            alert("Axtardığınız məkan tapılmadı.");
        }
    } catch (error) {
        console.error("Axtarış xətası:", error);
    }
}

/**
 * GPS ilə məkan təyini
 */
function getUserGPSLocation() {
    if (!navigator.geolocation) {
        alert("Brauzeriniz GPS xidmətini dəstəkləmir.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            if (map) {
                map.setView([lat, lon], 12);
                setTimeout(() => map.invalidateSize(), 150);
            }

            await executeWeatherDataAndLocation(lat, lon, "Mənim Yerləşməm");
        },
        (error) => {
            alert("GPS vasitəsilə məkan təyin oluna bilmədi.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

/**
 * Hava məlumatının gətirilməsi
 */
async function executeWeatherDataAndLocation(lat, lon, customName = null) {
    updateMarker(lat, lon);

    try {
        const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;

        const response = await fetch(weatherApiUrl);
        if (!response.ok) throw new Error("API error");

        const data = await response.json();

        if (data.timezone) {
            currentSelectedTimezone = data.timezone;
        }

        if (data.current) {
            renderCurrentWeather(data.current, data.daily);
        }

        if (data.hourly) {
            renderHourlyForecast(data.hourly);
        }

        if (data.daily) {
            renderWeeklyForecast(data.daily);
        }

    } catch (err) {
        console.error("Hava məlumatı xətası:", err);
    }

    if (customName) {
        updateLocationTitle(customName);
    } else {
        await fetchPlaceNameFromCoordinates(lat, lon);
    }
}

/**
 * Koordinat adının çəkilməsi
 */
async function fetchPlaceNameFromCoordinates(lat, lon) {
    try {
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=az`;
        const res = await fetch(reverseGeocodeUrl, {
            headers: { 'User-Agent': 'WeatherAppPro/2.0' }
        });

        if (!res.ok) throw new Error("Limit");

        const data = await res.json();
        let name = "Seçilmiş Məkan";

        if (data && data.address) {
            name = data.address.city || 
                   data.address.town || 
                   data.address.village || 
                   data.address.suburb || 
                   data.address.county || 
                   data.display_name.split(',')[0];
        } else if (data && data.display_name) {
            name = data.display_name.split(',')[0];
        }

        updateLocationTitle(name);
    } catch (e) {
        updateLocationTitle(`Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    }
}

function updateMarker(lat, lon) {
    if (!map) return;
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map);
}

function updateLocationTitle(name) {
    const headerElem = document.getElementById('location-header');
    const titleElem = document.getElementById('location-title');

    if (headerElem && titleElem) {
        titleElem.innerText = name;
        headerElem.style.display = 'flex';
    }
}

function renderCurrentWeather(current, daily) {
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const apparent = Math.round(current.apparent_temperature);
    const pressure = current.surface_pressure ? Math.round(current.surface_pressure) : '--';
    const windSpeed = current.wind_speed_10m;
    const windDir = current.wind_direction_10m ?? 0;
    const code = current.weather_code ?? 0;
    const isDay = current.is_day ?? 1;

    setDOMText('current-temp', `${temp}°C`);
    setDOMText('humidity', `${humidity}%`);
    setDOMText('apparent-temp', `${apparent}°C`);
    setDOMText('feels-like-text', `Hiss edilən: ${apparent}°C`);
    setDOMText('pressure', `${pressure} hPa`);
    setDOMText('wind-speed', `${windSpeed} km/s`);
    setDOMText('wind-direction', `${windDir}°`);
    setDOMText('visibility', `10 km`);

    if (daily && daily.uv_index_max && daily.uv_index_max[0]) {
        setDOMText('uv-index', daily.uv_index_max[0].toFixed(1));
    }

    if (daily && daily.sunrise && daily.sunrise[0]) {
        setDOMText('sunrise-time', daily.sunrise[0].split('T')[1]);
    }

    if (daily && daily.sunset && daily.sunset[0]) {
        setDOMText('sunset-time', daily.sunset[0].split('T')[1]);
    }

    const weatherText = getWeatherTextByCode(code);
    setDOMText('weather-desc', weatherText);

    const badgeElem = document.getElementById('weather-condition-badge');
    if (badgeElem) badgeElem.innerText = weatherText;

    const iconImg = document.getElementById('main-icon');
    if (iconImg) {
        iconImg.src = getWeatherIconUrl(code, isDay);
    }
}

function renderHourlyForecast(hourly) {
    const container = document.getElementById('hourly-container');
    if (!container) return;
    container.innerHTML = '';

    const currentHourIndex = new Date().getHours();

    for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
        if (!hourly.time[i]) break;

        const dateObj = new Date(hourly.time[i]);
        const timeStr = dateObj.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hourly.temperature_2m[i]);
        const code = hourly.weather_code[i];
        const isDay = hourly.is_day[i];
        const iconUrl = getWeatherIconUrl(code, isDay);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="time">${timeStr}</span>
            <img src="${iconUrl}" alt="Hava">
            <span class="temp">${temp}°C</span>
        `;
        container.appendChild(card);
    }
}

function renderWeeklyForecast(daily) {
    const container = document.getElementById('weekly-container');
    if (!container) return;
    container.innerHTML = '';

    daily.time.forEach((timeStr, index) => {
        const maxTemp = Math.round(daily.temperature_2m_max[index]);
        const minTemp = Math.round(daily.temperature_2m_min[index]);
        const code = daily.weather_code[index];
        const dateObj = new Date(timeStr);
        const dayName = (index === 0) ? "Bugün" : AZ_WEEKDAYS_SHORT[dateObj.getDay()];
        const iconUrl = getWeatherIconUrl(code, 1);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="day">${dayName}</span>
            <img src="${iconUrl}" alt="Hava">
            <span class="temps">${maxTemp}° / ${minTemp}°</span>
        `;
        container.appendChild(card);
    });
}

function getWeatherIconUrl(code, isDay = 1) {
    // Gündüz (1 və ya true) və ya gecə (0 və ya false) olmasını yoxlayırıq
    const timeSuffix = (isDay === 1 || isDay === true) ? 'day' : 'night';
    const baseUrl = "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/";

    // Bütün WMO hava kodlarını əhatə edən tam xəritə (iconMap)
    const iconMap = {
        0: `clear-${timeSuffix}.svg`,
        1: `mostly-clear-${timeSuffix}.svg`,
        2: `partly-cloudy-${timeSuffix}.svg`,
        3: 'cloudy.svg',
        45: 'mist.svg',
        48: 'fog.svg',
        51: 'drizzle.svg',
        53: 'drizzle.svg',
        55: 'drizzle.svg',
        56: 'drizzle.svg',
        57: 'drizzle.svg',
        61: 'rain.svg',
        63: 'rain.svg',
        65: 'rain.svg',
        66: 'rain.svg',
        67: 'rain.svg',
        71: 'snow.svg',
        73: 'snow.svg',
        75: 'snow.svg',
        77: 'snow.svg',
        80: 'rain.svg',
        81: 'rain.svg',
        82: 'rain.svg',
        85: 'snow.svg',
        86: 'snow.svg',
        95: `extreme-thunderstorms-${timeSuffix}.svg`,
        96: `extreme-thunderstorms-${timeSuffix}.svg`,
        99: `extreme-thunderstorms-${timeSuffix}.svg`
    };

    // Əgər kod tapılmasa, avtomatik 'cloudy.svg' qaytarır ki, xəta verməsin
    const fileName = iconMap[code] || 'cloudy.svg';
    return baseUrl + fileName;
}

function getWeatherTextByCode(code) {
    const textMap = {
        0: "Açıq, Günəşli",
        1: "Əsasən Açıq",
        2: "Az Buludlu",
        3: "Buludlu",
        45: "Dumanlı",
        61: "Yağışlı",
        71: "Qarlı",
        95: "Şimşəkli Yağış"
    };

    return textMap[code] || "Buludlu";
}

function saveToQuickLocations(name, lat, lon) {
    try {
        let saved = JSON.parse(localStorage.getItem('weather_quick_locs') || '[]');
        if (!saved.some(item => item.name.toLowerCase() === name.toLowerCase())) {
            saved.push({ name, lat, lon });
            if (saved.length > 5) saved.shift();
            localStorage.setItem('weather_quick_locs', JSON.stringify(saved));
            renderQuickLocations();
        }
    } catch (e) {
        console.warn(e);
    }
}

function renderQuickLocations() {
    const wrapper = document.getElementById('quick-tags-wrapper');
    if (!wrapper) return;

    try {
        let saved = JSON.parse(localStorage.getItem('weather_quick_locs') || '[]');
        wrapper.innerHTML = '';

        saved.forEach(item => {
            const tag = document.createElement('span');
            tag.className = 'quick-tag';
            tag.innerText = item.name;
            tag.onclick = () => {
                if (map) {
                    map.setView([item.lat, item.lon], 11);
                    setTimeout(() => map.invalidateSize(), 150);
                }
                executeWeatherDataAndLocation(item.lat, item.lon, item.name);
            };
            wrapper.appendChild(tag);
        });
    } catch (e) {
        console.warn(e);
    }
}

function startLiveClock() {
    function updateClock() {
        const now = new Date();
        const day = now.getDate();
        const month = AZ_MONTHS[now.getMonth()];
        const year = now.getFullYear();
        const weekday = AZ_WEEKDAYS_SHORT[now.getDay()];

        const dateStr = `${day} ${month} ${year}, ${weekday}`;
        const dateElem = document.getElementById('location-date-time');
        if (!dateElem) return;

        try {
            const timeStr = now.toLocaleTimeString('az-AZ', {
                timeZone: currentSelectedTimezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            dateElem.innerText = `${dateStr} | ${timeStr}`;
        } catch (e) {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            dateElem.innerText = `${dateStr} | ${hours}:${minutes}:${seconds}`;
        }
    }

    setInterval(updateClock, 1000);
    updateClock();
}

function setDOMText(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.innerText = text;
}

function bindEvents() {
    const searchBtn = document.getElementById('search-btn');
    const cityInput = document.getElementById('city-input');
    const geoBtn = document.getElementById('geo-btn');

    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
    if (geoBtn) geoBtn.addEventListener('click', getUserGPSLocation);

    window.addEventListener('resize', () => {
        if (map) map.invalidateSize();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    bindEvents();
    renderQuickLocations();
    startLiveClock();
});