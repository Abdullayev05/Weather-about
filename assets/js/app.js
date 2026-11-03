/* ================================================================== */
/* COMPLETE INTERACTIVE WEATHER APPLICATION SCRIPT (WITH i18n & GEO)  */
/* ================================================================== */

let map = null;
let marker = null;
let currentSelectedTimezone = 'Asia/Baku';

// Cari seçilmiş koordinatları saxlamaq üçün qlobal dəyişənlər
let currentLat = null;
let currentLon = null;

// 1. Tərcümələr və Dil Lüğətləri
const translations = {
    az: {
        "page-title": "Hava Proqnozu",
        "search-placeholder": "Məkan adı daxil edin",
        "map-hint-text": "Xəritədən istədiyiniz koordinatı seçin",
        "loading-text": "Məlumat yüklənir...",
        "feels-like": "Hiss edilən",
        "wind-speed-label": "Küləyin Sürəti",
        "wind-dir-label": "Küləyin İstiqaməti",
        "humidity-label": "Rütubət dərəcəsi",
        "pressure-label": "Atmosfer Təzyiqi",
        "visibility-label": "Görünürlük",
        "uv-label": "Maksimum UV",
        "sunrise-label": "Günəşin Doğuşu",
        "sunset-label": "Günəşin Batışı",
        "hourly-title": "24 Saatlıq Proqnoz",
        "weekly-title": "7 Günlük Hava Proqnozu",
        "select-point-text": "Zəhmət olmasa xəritədən nöqtə seçin.",
        "my-location": "Mənim Yerləşməm",
        "selected-location": "Seçilmiş Məkan",
        "today": "Bugün",
        "search-not-found": "Axtardığınız məkan tapılmadı."
    },
    en: {
        "page-title": "Weather Forecast",
        "search-placeholder": "Enter location name",
        "map-hint-text": "Select desired coordinates from the map",
        "loading-text": "Loading data...",
        "feels-like": "Feels like",
        "wind-speed-label": "Wind Speed",
        "wind-dir-label": "Wind Direction",
        "humidity-label": "Humidity",
        "pressure-label": "Pressure",
        "visibility-label": "Visibility",
        "uv-label": "Max UV Index",
        "sunrise-label": "Sunrise",
        "sunset-label": "Sunset",
        "hourly-title": "24-Hour Forecast",
        "weekly-title": "7-Day Forecast",
        "select-point-text": "Please select a point on the map.",
        "my-location": "My Location",
        "selected-location": "Selected Location",
        "today": "Today",
        "search-not-found": "Location not found."
    },
    uk: {
        "page-title": "Прогноз погоди",
        "search-placeholder": "Введіть назву місця",
        "map-hint-text": "Виберіть потрібні координати на карті",
        "loading-text": "Завантаження даних...",
        "feels-like": "Відчувається як",
        "wind-speed-label": "Швидкість вітру",
        "wind-dir-label": "Напрямок вітру",
        "humidity-label": "Вологість",
        "pressure-label": "Тиск",
        "visibility-label": "Видимість",
        "uv-label": "Макс. УФ-індекс",
        "sunrise-label": "Схід сонця",
        "sunset-label": "Захід сонця",
        "hourly-title": "Прогноз на 24 години",
        "weekly-title": "Прогноз на 7 днів",
        "select-point-text": "Будь ласка, виберіть точку на карті.",
        "my-location": "Моє місцезнаходження",
        "selected-location": "Вибране місце",
        "today": "Сьогодні",
        "search-not-found": "Місце не знайдено."
    }
};

// 2. Hava Kodu Tərcümələri (WMO Weather Codes)
const weatherTranslations = {
    az: {
        0: "Açıq, Günəşli", 1: "Əsasən Açıq", 2: "Az Buludlu", 3: "Buludlu",
        45: "Dumanlı", 48: "Şaxtalı Duman", 51: "Çiskinli Yağış", 53: "Mülayim Çiskin",
        55: "Güclü Çiskin", 56: "Donan Çiskin", 57: "Güclü Donan Çiskin", 61: "Zəif Yağış",
        63: "Mülayim Yağış", 65: "Güclü Yağış", 66: "Donan Yağış", 67: "Güclü Donan Yağış",
        71: "Zəif Qar", 73: "Mülayim Qar", 75: "Güclü Qar", 77: "Qar Dənəcikləri",
        80: "Zəif Leysan", 81: "Mülayim Leysan", 82: "Şiddətli Leysan", 85: "Zəif Qar Leysanı",
        86: "Güclü Qar Leysanı", 95: "Şimşəkli Yağış", 96: "Dolu ilə Şimşək", 99: "Şiddətli Dolu və Şimşək"
    },
    en: {
        0: "Clear, Sunny", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Depositing Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
        55: "Dense Drizzle", 56: "Freezing Drizzle", 57: "Dense Freezing Drizzle", 61: "Slight Rain",
        63: "Moderate Rain", 65: "Heavy Rain", 66: "Freezing Rain", 67: "Heavy Freezing Rain",
        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow", 77: "Snow Grains",
        80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers", 85: "Slight Snow Showers",
        86: "Heavy Snow Showers", 95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Heavy Thunderstorm with Hail"
    },
    uk: {
        0: "Ясно, Сонячно", 1: "Переважно ясно", 2: "Мінлива хмарність", 3: "Хмарно",
        45: "Туман", 48: "Паморозь", 51: "Легка мряка", 53: "Помірна мряка",
        55: "Густа мряка", 56: "Замерзаюча мряка", 57: "Густа замерзаюча мряка", 61: "Невеликий дощ",
        63: "Помірний дощ", 65: "Сильний дощ", 66: "Замерзаючий дощ", 67: "Сильний замерзаючий дощ",
        71: "Невеликий сніг", 73: "Помірний сніг", 75: "Сильний сніг", 77: "Снігові зерна",
        80: "Невеликий злива", 81: "Помірний злива", 82: "Сильний злива", 85: "Невеликий снігопад",
        86: "Сильний снігопад", 95: "Гроза", 96: "Гроза з градом", 99: "Сильна гроза з градом"
    }
};

// 3. Həftə və Ay siyahıları
const WEEKDAYS_SHORT = {
    az: ['Bazar', 'B.ertəsi', 'Ç.axşamı', 'Çərşənbə', 'C.axşamı', 'Cümə', 'Şənbə'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
};

const MONTHS = {
    az: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
};

// 4. Dil Dəyişdirmə Funksiyası
function changeLanguage(lang) {
    if (!translations[lang]) lang = 'az';

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (translations[lang][key]) {
            el.setAttribute("placeholder", translations[lang][key]);
        }
    });

    localStorage.setItem("selectedLang", lang);

    const langSwitcher = document.getElementById("lang-switcher");
    if (langSwitcher && langSwitcher.value !== lang) {
        langSwitcher.value = lang;
    }

    // Əgər koordinat mövcuddursa, dili dəyişəndə "Hiss edilən" yazısını və məkan adını yeniləyirik
    if (typeof currentLat !== 'undefined' && typeof currentLon !== 'undefined' && currentLat !== null && currentLon !== null) {
        getLocationName(currentLat, currentLon);
        // Cari havanı yenidən çəkmək üçün (hiss edilən yazısının dili dəyişməsi üçün)
        executeWeatherDataAndLocation(currentLat, currentLon, document.getElementById('location-title').innerText);
    }
}

// 5. Hava Koduna Görə Mətnin Alınması
function getWeatherTextByCode(code, lang = null) {
    const currentLang = lang || localStorage.getItem("selectedLang") || "az";
    const currentMap = weatherTranslations[currentLang] || weatherTranslations['az'];
    return currentMap[code] || (currentLang === 'en' ? "Cloudy" : currentLang === 'uk' ? "Хмарно" : "Buludlu");
}

/**
 * Xəritənin OpenStreetMap ilə yaradılması
 */
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map', { 
        zoomControl: false,
        attributionControl: true
    }).setView([40.4093, 49.8671], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', onMapClick);

    setTimeout(() => { if (map) map.invalidateSize(); }, 200);
    setTimeout(() => { if (map) map.invalidateSize(); }, 800);
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

    const currentLang = localStorage.getItem("selectedLang") || "az";
    const normalizedQuery = normalizeAzText(query);
    let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=${currentLang}`;

    try {
        let response = await fetch(searchUrl);
        let data = await response.json();

        if (!data || data.length === 0) {
            searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&accept-language=${currentLang}`;
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
            alert(translations[currentLang]["search-not-found"]);
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

    const currentLang = localStorage.getItem("selectedLang") || "az";
    const myLocationText = translations[currentLang]["my-location"];

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            if (map) {
                map.setView([lat, lon], 12);
                setTimeout(() => map.invalidateSize(), 150);
            }

            await executeWeatherDataAndLocation(lat, lon, myLocationText);
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
    currentLat = lat;
    currentLon = lon;

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
        await getLocationName(lat, lon);
    }
}

/**
 * Koordinat adının (Reverse Geocoding) cari dildə çəkilməsi
 */
async function getLocationName(lat, lon) {
    const currentLang = localStorage.getItem("selectedLang") || "az";

    try {
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${currentLang}`;
        const res = await fetch(reverseGeocodeUrl, {
            headers: { 'User-Agent': 'WeatherAppPro/2.0' }
        });

        if (!res.ok) throw new Error("Limit");

        const data = await res.json();
        let name = translations[currentLang]["selected-location"];

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
    const currentLang = localStorage.getItem("selectedLang") || "az";
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
    
    // BURASI DÜZƏLDİLDİ: Artıq "Hiss edilən" sözü seçilmiş dilə uyğun dəyişir
    setDOMText('feels-like-text', `${translations[currentLang]["feels-like"]}: ${apparent}°C`);
    
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

    const weatherText = getWeatherTextByCode(code, currentLang);
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

    const currentLang = localStorage.getItem("selectedLang") || "az";

    daily.time.forEach((timeStr, index) => {
        const maxTemp = Math.round(daily.temperature_2m_max[index]);
        const minTemp = Math.round(daily.temperature_2m_min[index]);
        const code = daily.weather_code[index];
        const dateObj = new Date(timeStr);
        
        const dayName = (index === 0) ? translations[currentLang]["today"] : WEEKDAYS_SHORT[currentLang][dateObj.getDay()];
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
    const timeSuffix = (isDay === 1 || isDay === true) ? 'day' : 'night';
    const baseUrl = "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/";

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

    const fileName = iconMap[code] || 'cloudy.svg';
    return baseUrl + fileName;
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
        const currentLang = localStorage.getItem("selectedLang") || "az";
        
        const day = now.getDate();
        const month = MONTHS[currentLang][now.getMonth()];
        const year = now.getFullYear();
        const weekday = WEEKDAYS_SHORT[currentLang][now.getDay()];

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
    const langSwitcher = document.getElementById('lang-switcher');

    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
    if (geoBtn) geoBtn.addEventListener('click', getUserGPSLocation);

    if (langSwitcher) {
        langSwitcher.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }

    window.addEventListener('resize', () => {
        if (map) map.invalidateSize();
    });
}

// 6. Səhifə Yüklənən Kimi İşə Düşən Əsas Hissə
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem("selectedLang") || "az";
    changeLanguage(savedLang);

    initMap();
    bindEvents();
    renderQuickLocations();
    startLiveClock();
});