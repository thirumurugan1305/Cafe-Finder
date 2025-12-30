// 1. Initialize the map
const map = L.map('map').setView([52.52, 13.40], 15); // Default to Berlin for 3D demo

// 2. Add Base Map Tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. Add the 3D Buildings Layer
const osmb = new OSMBuildings(map).load();

let markersLayer = L.layerGroup().addTo(map);

// Theme Toggling Logic
function toggleTheme() {
    const body = document.getElementById('main-body');
    const btn = document.getElementById('theme-btn');
    
    body.classList.toggle('dark-theme');
    
    if(body.classList.contains('dark-theme')) {
        btn.innerText = "☀️ Light Mode";
        osmb.setStyle({ wallColor: 'rgb(100, 100, 100)', roofColor: 'rgb(150, 150, 150)' });
    } else {
        btn.innerText = "🌙 Dark Mode";
        osmb.setStyle({ wallColor: 'rgb(220, 210, 200)', roofColor: 'rgb(220, 210, 200)' });
    }
}

// 4. Search & Find logic (Same as before, but with 3D transition)
async function searchLocation() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(geoUrl);
        const data = await response.json();

        if (data.length > 0) {
            const { lat, lon } = data[0];
            // Zoom in close enough (16+) to see 3D buildings clearly
            map.setView([lat, lon], 17); 
            findCafes(lat, lon);
        }
    } catch (e) { console.error(e); }
}

async function findCafes(lat, lng) {
    markersLayer.clearLayers();
    const radius = 2000;
    const query = `[out:json];(node["amenity"="cafe"](around:${radius},${lat},${lng}););out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();
    
    data.elements.forEach(cafe => {
        L.marker([cafe.lat, cafe.lon])
            .addTo(markersLayer)
            .bindPopup(`<b>☕ ${cafe.tags.name || "Cafe"}</b>`);
    });
}

// Auto-detect location
map.locate({setView: true, maxZoom: 17});
map.on('locationfound', (e) => findCafes(e.latlng.lat, e.latlng.lng));