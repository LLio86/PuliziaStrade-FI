// Variabili globali e elementi DOM
const addressEl = document.getElementById("address");
const coordsEl = document.getElementById("coords");
const puliziaEl = document.getElementById("pulizia");
const map = L.map('map').setView([43.7696, 11.2558], 15);

let trackingTimer = null;
let pulizieGeoJSON = null;

// Tile layer OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// Carica GeoJSON
fetch('pulizia_firenze.geojson')
    .then(response => response.json())
    .then(data => {
        pulizieGeoJSON = data;
        console.log("Dati pulizia caricati:", data);
        aggiornaListaPreferiti && aggiornaListaPreferiti();  // se definita altrove
        // Aggiorna lista vie in pulizia oggi
        const listaDiv = document.getElementById("lista-pulizie-oggi");
        if (listaDiv) {
            listaDiv.innerHTML = filtraPulizieOggi(pulizieGeoJSON);
        }
    });

// Funzione per reverse geocode e aggiornare info pulizia
function reverseGeocode(lat, lon) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
        .then(res => res.json())
        .then(data => {
            const address = data.address;
            const via = address.road || data.display_name;

            // Controllo città
            const comune = address.city || address.town || address.village || "";
            const comuneLower = comune.toLowerCase();

            if (!comuneLower.includes("firenze")) {
                document.getElementById("address").textContent = "L'app funziona solo a Firenze.";
                document.getElementById("pulizia").innerHTML = "<strong>⚠️ Località non supportata</strong>";
                return; // Interrompe la funzione qui
            }

            addressEl.textContent = via;
            const info = getPuliziaInfo(via);
            puliziaEl.innerHTML = info;
        })
        .catch(error => {
            console.error("Errore nel reverse geocoding:", error);
            document.getElementById("address").textContent = "Errore nel recupero dell'indirizzo.";
            document.getElementById("pulizia").innerHTML = "Impossibile ottenere dati.";
        });
}

// Funzione per aggiornare posizione sulla mappa e nelle info
function aggiornaPosizione(lat, lon) {
    coordsEl.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    if (!marker) {
        marker = L.marker([lat, lon], {
            icon: autoIcon
        }).addTo(map).bindPopup("🅿️");
    } else {
        marker.setLatLng([lat, lon]);
    }

    if (tracking) {
        map.panTo([lat, lon]); // Segui solo se tracking attivo
    }

    reverseGeocode(lat, lon);
}
// Tracking continuo
function avviaTrackingContinuo() {
    if (navigator.geolocation) {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId); // Annulla eventuale watch precedente
        }

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                aggiornaPosizione(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                console.error("Errore geolocalizzazione:", err.message);
                alert("Impossibile ottenere la posizione.");
            }, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000
            }
        );
    } else {
        alert("Geolocalizzazione non supportata dal browser.");
    }
}


// Errore geolocalizzazione
function onLocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("Permesso geolocalizzazione negato.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Posizione non disponibile.");
            break;
        case error.TIMEOUT:
            alert("Timeout richiesta posizione.");
            break;
        default:
            alert("Errore sconosciuto nella geolocalizzazione.");
    }
}

// Evento bottone "Centra e segui"
document.getElementById("btn-centra").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        aggiornaPosizione(latitude, longitude);
        avviaTrackingContinuo();
    }, onLocationError);
});

// Avvio al caricamento pagina
document.addEventListener("DOMContentLoaded", () => {
    // Prova a ottenere posizione una volta subito
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        aggiornaPosizione(latitude, longitude);
    }, onLocationError);
});
