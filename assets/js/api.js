// function updateWeatherIcon(weatherCode, isDay = 1) {
//     const iconElement = document.getElementById('weather-icon');
//     if (!iconElement) return;

//     let iconFileName = "mostly-clear-day.svg"; // Defolt şəkil

//     // Open-Meteo weathercode-larına əsasən Meteocons fayl adlarını uyğunlaşdırırıq:
//     if (weatherCode === 0) {
//         iconFileName = isDay ? "mostly-clear-day.svg" : "partly-cloudy-night.svg";
//     } else if ([1, 2, 3].includes(weatherCode)) {
//         iconFileName = "cloudy.svg";
//     } else if ([45, 48].includes(weatherCode)) {
//         iconFileName = "fog.svg";
//     } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
//         iconFileName = "rain.svg";
//     } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
//         iconFileName = "snow.svg";
//     } else if ([95, 96, 99].includes(weatherCode)) {
//         iconFileName = "extreme-thunderstorms-day.svg";
//     }

//     // Birbaşa Meteocons CDN ünvanı ilə şəklin mənbəsini (src) təyin edirik
//     iconElement.src = `https://cdn.meteocons.com/3.0.0-next.10/svg/fill/${iconFileName}`;
// }