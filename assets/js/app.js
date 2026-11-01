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
map.on('click', async function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    await executeWeatherDataAndLocation(lat, lon);
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
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error("API xətası");

        const weatherData = await res.json();

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
    const code = current.weather_code !== undefined ? current.weather_code : 0;

    safeSetText('current-temp', `${temp}°C`);
    safeSetText('humidity', `${humidity}%`);
    safeSetText('wind-speed', `${wind} km/s`);

    const weatherInfo = getWeatherDescription(code);
    safeSetText('weather-desc', weatherInfo.text);

    const iconEl = document.getElementById('main-icon');
    if (iconEl) iconEl.className = weatherInfo.icon;
}

function updateWeeklyForecast(daily) {
    const container = document.getElementById('weekly-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const dateObj = new Date(daily.time[i]);
        const dayIndex = dateObj.getDay(); 
        
        let dayName = (i === 0) ? "Bugün" : azDays[dayIndex];

        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const weatherInfo = getWeatherDescription(daily.weather_code[i]);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="day">${dayName}</span>
            <i class="${weatherInfo.icon}"></i>
            <span class="temps">${maxTemp}° / ${minTemp}°</span>
        `;
        container.appendChild(card);
    }

    // --- SÜRÜŞDÜRMƏ MEXANİZMİ (Kartlar yaradıldıqdan sonra işə düşür) ---
    const slider = container;
    let isDown = false;
    let startX;
    let scrollLeft;

    // Köhnə dinləyicilərin təkrar əlavə olunmaması üçün sadə yoxlama
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

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function safeSetHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}