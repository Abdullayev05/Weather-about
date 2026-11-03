// ==========================================
// 1. ÇOXDİLLİ TƏRCÜMƏ LÜĞƏTLƏRİ (AZ, EN, UK)
// ==========================================

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
        "select-point-text": "Zəhmət olmasa xəritədən nöqtə seçin."
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
        "select-point-text": "Please select a point on the map."
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
        "select-point-text": "Будь ласка, виберіть точку на карті."
    }
};

// Open-Meteo Hava Kodlarının Dillərə Uyğun Tərcüməsi
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

// Həftənin Günləri Masivləri
const WEEKDAYS_SHORT = {
    az: ['Bazar', 'B.ertəsi', 'Ç.axşamı', 'Çərşənbə', 'C.axşamı', 'Cümə', 'Şənbə'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
};

// Ayların Adları Masivləri
const MONTHS = {
    az: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
};

// Global dəyişən: Sonuncu seçilən koordinatlar və ya hava datası
let currentLat = null;
let currentLon = null;
let lastFetchedWeatherData = null;

// ==========================================
// 2. KÖMƏKÇİ FUNKSİYALAR (TƏRCÜMƏ VƏ TARİX)
// ==========================================

// Hava koduna əsasən müvafiq dildə hava mətnini qaytarır
function getWeatherTextByCode(code, lang = null) {
    const currentLang = lang || localStorage.getItem("selectedLang") || "az";
    const currentMap = weatherTranslations[currentLang] || weatherTranslations['az'];
    return currentMap[code] || (currentLang === 'en' ? "Unknown" : currentLang === 'uk' ? "Невідомо" : "Bilinmir");
}

// Tarixə görə gün adını dinamik qaytarır
function getDayName(dateString, lang = null) {
    const currentLang = lang || localStorage.getItem("selectedLang") || "az";
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    return WEEKDAYS_SHORT[currentLang][dayIndex];
}

// Tarixə görə ay adını dinamik qaytarır
function getMonthName(dateString, lang = null) {
    const currentLang = lang || localStorage.getItem("selectedLang") || "az";
    const date = new Date(dateString);
    const monthIndex = date.getMonth();
    return MONTHS[currentLang][monthIndex];
}

// ==========================================
// 3. DİLİ DƏYİŞMƏK VƏ İNTERFEYSİ YENİLƏMƏK
// ==========================================

function changeLanguage(lang) {
    if (!translations[lang]) lang = 'az';

    // 1. data-i18n atributlu mətnləri dəyişdirik
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    // 2. Placeholder mətnlərini dəyişdirik
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (translations[lang][key]) {
            el.setAttribute("placeholder", translations[lang][key]);
        }
    });

    // 3. Seçilmiş dili localStorage-da saxlayırıq
    localStorage.setItem("selectedLang", lang);

    // 4. Dropdown-ın seçili dəyərini sinxronlaşdırırıq
    const langSwitcher = document.getElementById("lang-switcher");
    if (langSwitcher && langSwitcher.value !== lang) {
        langSwitcher.value = lang;
    }

    // 5. Əgər ekranda verilənlər varsa, dinami̇k komponentləri (hava mətni, günlər) yenidən render edirik
    if (lastFetchedWeatherData) {
        renderWeatherUI(lastFetchedWeatherData);
    } else if (currentLat && currentLon) {
        fetchWeatherData(currentLat, currentLon);
    }
}

// ==========================================
// 4. HAVA MƏLUMATINI RENDER ETMƏK (UI)
// ==========================================

function renderWeatherUI(data) {
    const lang = localStorage.getItem("selectedLang") || "az";

    // Cari hava təsvirini yeniləyirik
    const weatherDescEl = document.getElementById("weather-desc");
    if (weatherDescEl && data.current && data.current.weather_code !== undefined) {
        weatherDescEl.innerText = getWeatherTextByCode(data.current.weather_code, lang);
    }

    // Əgər həftəlik və ya saatlıq proqnoz funksiyaların varsa, onları da lang ötürərək yeniləyirsən:
    // Example: renderHourlyForecast(data.hourly, lang);
    // Example: renderWeeklyForecast(data.daily, lang);
}

// ==========================================
// 5. İNİTİALİZASİYA VƏ HADİSƏ DİNLƏYİCİLƏRİ
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const langSwitcher = document.getElementById("lang-switcher");
    const savedLang = localStorage.getItem("selectedLang") || "az";

    // İlk yüklənmədə yaddaşdakı dili tətbiq edirik
    changeLanguage(savedLang);

    // Dropdown dəyişdikdə işə düşür
    if (langSwitcher) {
        langSwitcher.addEventListener("change", (e) => {
            changeLanguage(e.target.value);
        });
    }

    // Leaflet Xəritəsinin yaradılması (Telefonda kəskin görünüş üçün detectRetina: true)
    if (document.getElementById('map')) {
        const map = L.map('map').setView([40.4093, 49.8671], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            maxNativeZoom: 19,
            detectRetina: true,
            attribution: ''
        }).addTo(map);

        // Map Click Debounce (Sorğunu azaltmaq üçün)
        let clickTimeout = null;
        map.on('click', function (e) {
            currentLat = e.latlng.lat;
            currentLon = e.latlng.lng;

            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                console.log(`Koordinat seçildi: ${currentLat}, ${currentLon}`);
                // fetchWeatherData(currentLat, currentLon);
            }, 500);
        });
    }
});