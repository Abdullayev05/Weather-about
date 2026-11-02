// Xəritəni Azərbaycan mərkəzi ilə başladırıq
const map = L.map('map').setView([40.4093, 49.8671], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker = null;
let weatherCodes = {};

// Azərbaycan dilində həftə günləri massivi (0: Bazar, 1: Bazar ertəsi...)
const azDays = ['Bazar', 'B.ertəsi', 'Ç.axşamı', 'Çərşənbə', 'C.axşamı', 'Cümə', 'Şənbə'];

// JSON hava kodlarını yükləyirik
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
map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    try {
        // 1. Koordinatın adını (Reverse Geocoding vasitəsilə) əldə edirik
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=az`);
        const geoData = await geoResponse.json();
        
        // Rayon, şəhər və ya kənd adını tapırıq (tapılmasa koordinat yazılır)
        const address = geoData.address;
        const cityName = address.city || address.town || address.village || address.county || address.state || `Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;

        // 2. Həmin koordinatların hava məlumatını çəkirik
        await executeWeatherDataAndLocation(lat, lon, cityName);

    } catch (error) {
        console.error("Yer adını tapmaq mümkün olmadı:", error);
        // Xəta olarsa sadəcə koordinat ötürürük
        await executeWeatherDataAndLocation(lat, lon, `Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    }
});

// Axtarış düyməsi və input
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

if (searchBtn) searchBtn.addEventListener('click', performSearch);
if (cityInput) {
    cityInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') performSearch();
    });
}

// Hərf çevirici
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

// Axtarış funksiyası
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

// Əsas icraedici funksiya (Hava + Yer Adı)
async function executeWeatherDataAndLocation(lat, lon, customName = null) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map);

    // 1. Hava məlumatlarını çək
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error("API xətası");

        const weatherData = await res.json();

        // Yer adını təyin etmək üçün qabaqcadan adı tapaq ki, updateUI-ə ötürək
        let placeName = customName;
        if (!placeName) {
            placeName = await getPlaceName(lat, lon);
        }

        if (weatherData && weatherData.current) {
            updateCurrentWeather(weatherData.current);
            updateUI(weatherData, placeName);
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

    // 2. Yer adını təyin et və yaz
    if (customName) {
        setLocationHeader(customName);
    } else {
        try {
            const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=az`;
            const res = await fetch(reverseUrl);
            const locData = await res.json();

            let placeName = "Seçilmiş nöqtə";
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
            setLocationHeader(`Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
    }
}

// Köməkçi yer adı tapma funksiyası
async function getPlaceName(lat, lon) {
    try {
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=az`;
        const res = await fetch(reverseUrl);
        const locData = await res.json();

        if (locData && locData.address) {
            return locData.address.city ||
                locData.address.town ||
                locData.address.village ||
                locData.address.state ||
                locData.address.county ||
                locData.display_name.split(',')[0];
        } else if (locData && locData.display_name) {
            return locData.display_name.split(',')[0];
        }
    } catch (e) {
        return `Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
    return "Seçilmiş nöqtə";
}

function setLocationHeader(name) {
    const cleanName = name.includes(',') ? name.split(',')[0] : name;
    safeSetHTML('location-name', `<i class="fa-solid fa-location-dot"></i> ${cleanName}`);

    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    safeSetText('current-date', new Date().toLocaleDateString('az-AZ', options));
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

    // İkonun yenilənməsi
    const iconElement = document.getElementById('weather-icon');
    if (iconElement) {
        iconElement.src = getWeatherIconUrl(currentWeatherCode, isDay);
    }
}

// updateUI funksiyası
function updateUI(data, cityName) {
    const titleEl = document.getElementById('location-title');
    if (titleEl) titleEl.innerText = cityName;

    const tempEl = document.getElementById('current-temp');
    if (tempEl) tempEl.innerText = `${Math.round(data.current.temperature_2m)}°C`;
    
    const currentWeatherCode = data.current.weather_code;
    const isDay = data.current.is_day;
    
    const mainIconObj = document.getElementById('main-icon');
    if (mainIconObj) {
        mainIconObj.data = getWeatherIconUrl(currentWeatherCode, isDay);
    }

    const windEl = document.querySelector('.wind-value');
    if (windEl) windEl.innerText = `${data.current.wind_speed_10m} km/s`;

    const humidityEl = document.querySelector('.humidity-value');
    if (humidityEl) humidityEl.innerText = `${data.current.relative_humidity_2m}%`;
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

    // --- SÜRÜŞDÜRMƏ MEXANİZMİ ---
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
        2: 'partly-cloudy-night.svg',
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
    }

    return fileName;
}

// Cari hava üçün ikon URL-ni qaytaran əsas funksiya
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