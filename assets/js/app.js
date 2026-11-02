const map = L.map('map').setView([40.4093, 49.8671], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker = null;
let weatherCodes = {};
let currentSelectedTimezone = 'Asia/Baku';

const azDays = ['Bazar', 'B.ertəsi', 'Ç.axşamı', 'Çərşənbə', 'C.axşamı', 'Cümə', 'Şənbə'];

async function loadCodes() {
    try {
        const res = await fetch('./data/weather-codes.json');
        weatherCodes = await res.json();
    } catch (e) {
        weatherCodes = {};
    }
}
loadCodes();

// Xəritəyə kliklədikdə
let clickTimeout = null;
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    clearTimeout(clickTimeout);

    clickTimeout = setTimeout(async () => {
        await executeWeatherDataAndLocation(lat, lon);
    }, 300);
});

const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

if (searchBtn) searchBtn.addEventListener('click', performSearch);
if (cityInput) {
    cityInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') performSearch();
    });
}

function normalizeText(text) {
    return text.toLowerCase()
        .replace(/ə/g, 'e')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i');
}

async function performSearch() {
    let query = cityInput.value.trim();
    if (!query) return;

    let normalizedQuery = normalizeText(query);
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=az`;

    try {
        let response = await fetch(url);
        let data = await response.json();

        if (!data || data.length === 0) {
            url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&accept-language=az`;
            response = await fetch(url);
            data = await response.json();
        }

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const displayName = data[0].display_name;

            map.setView([lat, lon], 11);
            await executeWeatherDataAndLocation(lat, lon, displayName);
        } else {
            alert("Axtardığınız məkan tapılmadı.");
        }
    } catch (error) {
        console.error("Axtarış xətası:", error);
    }
}

function updateDateTimeForTimezone(timezone) {
    if (timezone) {
        currentSelectedTimezone = timezone;
    }
}

async function executeWeatherDataAndLocation(lat, lon, customName = null) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map);

    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error("API xətası");

        const weatherData = await res.json();

        if (weatherData && weatherData.timezone) {
            updateDateTimeForTimezone(weatherData.timezone);
        }

        if (weatherData && weatherData.current) {
            updateCurrentWeather(weatherData.current);
        }
        if (weatherData && weatherData.daily) {
            updateWeeklyForecast(weatherData.daily);
        }
    } catch (err) {
        console.error("Hava məlumatı alınmadı:", err);
        safeSetText('current-temp', "Xəta");
        safeSetText('wind-speed', "--");
        safeSetText('humidity', "--");
        safeSetText('weather-desc', "Məlumat yüklənmədi");
    }

    if (customName) {
        setLocationHeader(customName);
    } else {
        try {
            const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=az`;
            const res = await fetch(reverseUrl, {
                headers: {
                    'User-Agent': 'ProfessionalWeatherApp/1.0'
                }
            });

            if (!res.ok) throw new Error("API Limit");

            const locData = await res.json();

            let placeName = "Seçilmiş məkan";
            if (locData && locData.address) {
                placeName = locData.address.city ||
                    locData.address.town ||
                    locData.address.village ||
                    locData.address.state ||
                    locData.address.county ||
                    locData.display_name.split(',')[0];
            } else if (locData && locData.display_name) {
                placeName = locData.display_name.split(',')[0];
            }
            setLocationHeader(placeName);
        } catch (e) {
            console.warn("Yer adı alınmadı, API məhdudiyyəti ola bilər.");
            setLocationHeader(`Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
    }
}

function setLocationHeader(placeName) {
    const headerElem = document.getElementById('location-header');
    const titleElem = document.getElementById('location-title');

    if (headerElem && titleElem) {
        titleElem.innerText = placeName;
        headerElem.style.display = 'flex';
    }
}

function updateCurrentWeather(current) {
    const temp = current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : "--";
    const humidity = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : "--";
    const wind = current.wind_speed_10m !== undefined ? current.wind_speed_10m : "--";

    const currentWeatherCode = current.weather_code !== undefined ? current.weather_code : 0;
    const isDay = current.is_day !== undefined ? current.is_day : 1;

    safeSetText('current-temp', `${temp}°C`);
    safeSetText('humidity', `${humidity}%`);
    safeSetText('wind-speed', `${wind} km/s`);

    const weatherInfo = getWeatherDescription(currentWeatherCode);
    safeSetText('weather-desc', weatherInfo.text);

    const iconElement = document.getElementById('main-icon');
    if (iconElement) {
        iconElement.src = getWeatherIconUrl(currentWeatherCode, isDay);
    }
}

function updateWeeklyForecast(daily) {
    const container = document.getElementById('weekly-container');
    if (!container) return;
    container.innerHTML = '';

    daily.time.forEach((time, index) => {
        const weatherCode = daily.weather_code[index];
        const maxTemp = Math.round(daily.temperature_2m_max[index]);
        const minTemp = Math.round(daily.temperature_2m_min[index]);

        const dateObj = new Date(time);
        const dayIndex = dateObj.getDay();
        let dayName = (index === 0) ? "Bugün" : azDays[dayIndex];

        const dailyIconName = getIconFileNameForCode(weatherCode, 1);
        const iconUrl = `https://cdn.meteocons.com/3.0.0-next.10/svg/fill/${dailyIconName}`;

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="day">${dayName}</span>
            <img src="${iconUrl}" alt="Hava" style="width: 45px; height: 45px;">
            <span class="temps">${maxTemp}° / ${minTemp}°</span>
        `;
        container.appendChild(card);
    });

    const slider = container;
    let isDown = false;
    let startX;
    let scrollLeft;

    if (!slider.dataset.listenerAdded) {
        slider.dataset.listenerAdded = "true";

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    }
}

function getWeatherDescription(code) {
    if (weatherCodes && weatherCodes[code]) {
        return weatherCodes[code];
    }
    return { text: "Açıq, Günəşli", icon: "fa-solid fa-sun" };
}

// Kodlara və gecə/gündüzə uyğun fayl adını qaytaran köməkçi funksiya
function getIconFileNameForCode(code, isDay = 1) {
    const iconMap = {
        0: 'clear-day.svg',
        1: 'mostly-clear-day.svg',
        2: 'partly-cloudy-day.svg',
        3: 'cloudy.svg',
        45: 'mist.svg',
        48: 'fog.svg',
        51: 'mostly-clear-day-drizzle.svg',
        53: 'mostly-clear-day-drizzle.svg',
        55: 'mostly-clear-day-drizzle.svg',
        61: 'rain.svg',
        63: 'rain.svg',
        65: 'rain.svg',
        71: 'snow.svg',
        73: 'snow.svg',
        75: 'snow.svg',
        95: 'extreme-thunderstorms-day.svg'
    };

    let fileName = iconMap[code] || 'cloudy.svg';

    if (code === 0) {
        fileName = (isDay === 1) ? 'clear-day.svg' : 'clear-night.svg';
    } else if (code === 2) {
        fileName = (isDay === 1) ? 'partly-cloudy-day.svg' : 'partly-cloudy-night.svg';
    }

    return fileName;
}

function getWeatherIconUrl(weatherCode, isDay = 1) {
    const baseUrl = "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/";
    const fileName = getIconFileNameForCode(weatherCode, isDay);
    return baseUrl + fileName;
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function safeSetHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function updateDateTime() {
    const now = new Date();

    const aylar = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    const gunler = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

    const day = now.getDate();
    const month = aylar[now.getMonth()];
    const year = now.getFullYear();
    const weekday = gunler[now.getDay()];

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
        const timeStr = `${hours}:${minutes}:${seconds}`;

        dateElem.innerText = `${dateStr} | ${timeStr}`;
    }
}

setInterval(updateDateTime, 1000);
updateDateTime();