L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    maxNativeZoom: 19, // Kafelerin qeyri-tabii böyüməsinin qarşısını alır
    detectRetina: true, // Mobil ekranlarda yazıları və xəttləri kəskinləşdirir
    attribution: ''
}).addTo(map);