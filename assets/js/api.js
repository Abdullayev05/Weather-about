// Ayrı JS faylınızda bu kodu birbaşa əlavə edin:
const cityInput = document.getElementById('city-input');
const suggestionsBox = document.getElementById('suggestions-box');
let debounceTimer;

if (cityInput && suggestionsBox) {
    cityInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();

        if (query.length < 1) {
            suggestionsBox.style.display = 'none';
            suggestionsBox.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=az&limit=5`;
                const response = await fetch(url);
                const data = await response.json();

                suggestionsBox.innerHTML = '';

                if (data && data.length > 0) {
                    suggestionsBox.style.display = 'block';

                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.innerText = item.display_name;

                        div.addEventListener('click', async () => {
                            cityInput.value = item.display_name.split(',')[0];
                            suggestionsBox.style.display = 'none';

                            const lat = parseFloat(item.lat);
                            const lon = parseFloat(item.lon);

                            if (typeof map !== 'undefined') {
                                map.setView([lat, lon], 11);
                            }
                            if (typeof executeWeatherDataAndLocation === 'function') {
                                await executeWeatherDataAndLocation(lat, lon, item.display_name);
                            }
                        });

                        suggestionsBox.appendChild(div);
                    });
                } else {
                    suggestionsBox.style.display = 'none';
                }
            } catch (error) {
                console.error("Autocomplete xətası:", error);
            }
        }, 300);
    });

    // Kənara kliklədikdə siyahını bağla
    document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });
}