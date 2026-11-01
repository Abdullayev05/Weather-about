// Xəritəni Azərbaycan/Bakı mərkəzli olaraq başladırıq
const map = L.map('map').setView([40.4093, 49.8671], 7);

// OpenStreetMap qatını əlavə edirik
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker = null;

// Xəritəyə kliklədikdə işləyən funksiya
map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    updateLocationData(lat, lon);
});

// Axtarış düyməsinə və ya Enter düyməsinə basıldıqda
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

searchBtn.addEventListener('click', performSearch);
cityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

async function performSearch() {
    const query = cityInput.value.trim();
    if (!query) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=az`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            map.setView([lat, lon], 10);
            updateLocationData(lat, lon);
        } else {
            alert("Axtardığınız məkan tapılmadı. Zəhmət olmasa düzgün ad daxil edin.");
        }
    } catch (error) {
        console.error("Axtarış zamanı xəta baş verdi:", error);
    }
}

// Koordinatlara görə marker qoymaq və məlumatları çəkmək
async function updateLocationData(lat, lon) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map);

    await getWeatherData(lat, lon);
    await getLocationName(lat, lon);
}

// Hava Məlumatını API-dən çəkmək (Open-Meteo)
async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,time&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        updateCurrentWeather(data.current);
        updateWeeklyForecast(data.daily);
    } catch (error) {
        console.error("Hava məlumatı alınarkən xəta baş verdi:", error);
    }
}

// Cari havanı ekrana yazmaq
function updateCurrentWeather(current) {
    document.getElementById('current-temp').innerText = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('humidity').innerText = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').innerText = `${current.wind_speed_10m} km/s`;

    const weatherInfo = getWeatherDescription(current.weather_code);
    document.getElementById('weather-desc').innerText = weatherInfo.text;
    document.getElementById('main-icon').className = weatherInfo.icon;
}

// 7 günlük proqnozu ekrana yazmaq
function updateWeeklyForecast(daily) {
    const container = document.getElementById('weekly-container');
    container.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('az-AZ', { weekday: 'short' });
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
}

// Koordinatdan Yer Adını Tapmaq (Nominatim Reverse Geocoding)
async function getLocationName(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=az`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        let placeName = "Seçilmiş nöqtə";
        if (data.address) {
            placeName = data.address.city || data.address.town || data.address.village || data.address.state || data.address.county || "Naməlum ərazi";
        }
        
        document.getElementById('location-name').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${placeName}`;
        
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        document.getElementById('current-date').innerText = new Date().toLocaleDateString('az-AZ', options);
    } catch (error) {
        document.getElementById('location-name').innerHTML = `<i class="fa-solid fa-location-dot"></i> Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
}

// Hava kodlarına uyğun mətn və ikon təyini
function getWeatherDescription(code) {
    if (code === 0) return { text: "Açıq, Günəşli", icon: "fa-solid fa-sun" };
    if (code >= 1 && code <= 3) return { text: "Buludlu", icon: "fa-solid fa-cloud-sun" };
    if (code >= 45 && code <= 48) return { text: "Dumanlı", icon: "fa-solid fa-smog" };
    if (code >= 51 && code <= 67) return { text: "Yağışlı", icon: "fa-solid fa-cloud-rain" };
    if (code >= 71 && code <= 77) return { text: "Qarlı", icon: "fa-solid fa-snowflake" };
    if (code >= 95 && code <= 99) return { text: "Fırtınalı", icon: "fa-solid fa-cloud-bolt" };
    return { text: "Dəyişkən", icon: "fa-solid fa-cloud" };
}