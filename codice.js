const addressEl = document.getElementById("address");
const coordsEl = document.getElementById("coords");
const puliziaEl = document.getElementById("pulizia");
const map = L.map('map').setView([43.7696, 11.2558], 15);

let trackingTimer = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let pulizieGeoJSON = null;

fetch('pulizia_firenze.geojson')
    .then(response => response.json())
    .then(data => {
        pulizieGeoJSON = data;
        console.log("Dati pulizia caricati:", data);
        aggiornaListaPreferiti();
        // Aggiorna lista vie in pulizia oggi
        const listaDiv = document.getElementById("lista-pulizie-oggi");
        if (listaDiv) {
            listaDiv.innerHTML = filtraPulizieOggi();
        }
    });

function estraiValoreDescrizione(html, chiave) {
    const div = document.createElement("div");
    div.innerHTML = html;
    const items = div.querySelectorAll("li");
    for (const li of items) {
        const nome = li.querySelector(".atr-name")?.textContent?.trim().toLowerCase();
        const valore = li.querySelector(".atr-value")?.textContent?.trim();
        if (nome === chiave.toLowerCase()) {
            return valore;
        }
    }
    return null;
}

function calcolaProssimaDataPulizia(giornoSettimana, settimaneValide) {
    const giorniSettimana = {
        'Lunedì': 1,
        'Martedì': 2,
        'Mercoledì': 3,
        'Giovedì': 4,
        'Venerdì': 5,
        'Sabato': 6,
        'Domenica': 0
    };

    const oggi = new Date();
    const meseCorrente = oggi.getMonth();
    const annoCorrente = oggi.getFullYear();

    function trovaDateNelMese(mese, anno) {
        const date = [];
        let settimana = 1;
        for (let giorno = 1; giorno <= 31; giorno++) {
            const data = new Date(anno, mese, giorno);
            if (data.getMonth() !== mese) break;
            if (data.getDay() === giorniSettimana[giornoSettimana]) {
                date.push({
                    data,
                    settimana
                });
                settimana++;
            }
        }
        return date;
    }

    function trovaProssima(dataList) {
        return dataList.find(({
            data,
            settimana
        }) => {
            const weekNum = `${settimana}ª`;
            return settimaneValide.includes(weekNum) && data >= oggi;
        });
    }

    const dateMeseCorrente = trovaDateNelMese(meseCorrente, annoCorrente);
    const matchCorrente = trovaProssima(dateMeseCorrente);

    if (matchCorrente) return matchCorrente.data;

    const meseSuccessivo = (meseCorrente + 1) % 12;
    const annoSuccessivo = meseCorrente === 11 ? annoCorrente + 1 : annoCorrente;
    const dateMeseSuccessivo = trovaDateNelMese(meseSuccessivo, annoSuccessivo);
    const matchSuccessivo = trovaProssima(dateMeseSuccessivo);

    return matchSuccessivo?.data || null;
}

function getPuliziaInfo(via) {
    if (!pulizieGeoJSON) return "Dati non disponibili";

    const features = pulizieGeoJSON.features;

    const matches = features.filter(f => {
        const desc = f.properties.description || "";
        const indirizzo = estraiValoreDescrizione(desc, "indirizzo")?.toLowerCase() || "";
        return indirizzo && via.toLowerCase().includes(indirizzo);
    });

    if (matches.length > 0) {
        return matches.map(f => {
            const desc = f.properties.description || "";

            const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "ND";
            const giornoCod = estraiValoreDescrizione(desc, "giorno_settimana") || "ND";
            const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "ND";
            const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "ND";
            const tratto = estraiValoreDescrizione(desc, "tratto_strada") || "";

            const settimane = [];
            if (estraiValoreDescrizione(desc, "prima_settimana") === "1") settimane.push("1ª");
            if (estraiValoreDescrizione(desc, "seconda_settimana") === "1") settimane.push("2ª");
            if (estraiValoreDescrizione(desc, "terza_settimana") === "1") settimane.push("3ª");
            if (estraiValoreDescrizione(desc, "quarta_settimana") === "1") settimane.push("4ª");
            if (estraiValoreDescrizione(desc, "quinta_settimana") === "1") settimane.push("5ª");

            const settimaneText = settimane.length > 0 ? settimane.join(", ") : "non specificate";

            const giorni = {
                LU: "Lunedì",
                MA: "Martedì",
                ME: "Mercoledì",
                GI: "Giovedì",
                VE: "Venerdì",
                SA: "Sabato",
                DO: "Domenica"
            };
            const giornoNome = giorni[giornoCod.toUpperCase()] || giornoCod;

            const prossimaData = calcolaProssimaDataPulizia(giornoNome, settimane);


            let prossimaDataStr;
            let classeData = "";
            
            if (prossimaData) {
                const oggi = new Date();
                const diffTime = prossimaData.setHours(0, 0, 0, 0) - oggi.setHours(0, 0, 0, 0);
                const diffGiorni = Math.round(diffTime / (1000 * 60 * 60 * 24));

                let extraInfo = "";


if (diffGiorni === 1) {
    extraInfo = "(domani)";
    classeData = "pulizia-domani";
} else if (diffGiorni > 1 && diffGiorni <= 3) {
    extraInfo = `(tra ${diffGiorni} giorni)`;
    classeData = "pulizia-prossimi";
}


                prossimaDataStr = `${prossimaData.toLocaleDateString("it-IT", {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })} <span class="extra-info">${extraInfo}</span>`;
            } else {
                prossimaDataStr = "Data non trovata";
            }






            return `
            <div class="pulizia-entry ${classeData}">
              <strong>${indirizzo}</strong><br>
              Giorno: <strong>${giornoNome}</strong><br>
              Orario: <strong>${oraInizio}</strong> - <strong>${oraFine}</strong><br>
              Settimane: <strong>${settimaneText}</strong><br>
              Prossima data: <span class="highlight-date">${prossimaDataStr}</span><br>
              ${tratto ? `Tratto: <em>${tratto}</em>` : ""}
            </div>
          `;
        }).join("");
    } else {
        return "Nessuna pulizia programmata per questa via.";
    }
}

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

let marker = null;
let tracking = true;

const autoIcon = L.icon({
    iconUrl: 'sedan.png', // esempio auto
    iconSize: [40, 40], // dimensione dell’icona
    iconAnchor: [20, 40], // punto dell'icona che tocca il suolo
    popupAnchor: [0, -40] // punto da cui esce il popup
});

let autoCenter = true;


let isAutoPan = false;

map.on('movestart', () => {
  if (!isAutoPan) {
    tracking = false;
    console.log("Tracking disattivato per spostamento manuale");
  }
});

function aggiornaPosizione(lat, lon) {
  coordsEl.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  
  if (!marker) {
    marker = L.marker([lat, lon], { icon: autoIcon }).addTo(map).bindPopup("🅿️");
  } else {
    marker.setLatLng([lat, lon]);
  }

  if (tracking) {
    isAutoPan = true;
    map.panTo([lat, lon]);
    setTimeout(() => { isAutoPan = false; }, 200); // dopo 0.2s torno a false
  }

  reverseGeocode(lat, lon);
}



// Pulsante "centra e segui"
const LocateControl = L.Control.extend({
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    container.title = 'Centra e segui la mia posizione';
    //container.innerHTML = '📍'; // Puoi anche usare un'icona SVG

    container.onclick = function () {
  tracking = true;
  if (marker) {
    map.setView(marker.getLatLng(), map.getZoom());
  }

  else {
        // marker non esiste ancora, prendiamo posizione attuale
        navigator.geolocation.getCurrentPosition(pos => {
            // aggiorniamo il marker
            marker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map);
            
            // centriamo la mappa subito dopo aver creato il marker
            map.setView([pos.coords.latitude, pos.coords.longitude], map.getZoom());
        }, err => {
            console.error("Errore geolocalizzazione:", err.message);
        });
    }


  if (trackingTimer) {
    clearInterval(trackingTimer); // assicurati che non sia duplicato
  }
        
  avviaTrackingContinuo(); // <--- nuovo: riavvia l'aggiornamento continuo
};

    L.DomEvent.disableClickPropagation(container); // Evita il drag della mappa al click

    return container;
  }
});

map.addControl(new LocateControl({ position: 'topleft' }));




function onLocationError(e) {
    alert("Errore nel trovare la posizione: " + e.message);
}

let watchId = null;


function avviaTrackingContinuo() {
  autoCenter = true;
  console.log("avviaTrackingContinuo() chiamata");

  if (navigator.geolocation) {
    if (watchId) {
      console.log("Clear watch precedente");
      navigator.geolocation.clearWatch(watchId);
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        console.log("Posizione ricevuta dal pulsante:", pos.coords.latitude, pos.coords.longitude);
        aggiornaPosizione(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.error("Errore geolocalizzazione:", err.message);
        alert("Impossibile ottenere la posizione.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );
  } else {
    alert("Geolocalizzazione non supportata dal browser.");
  }
}




// Watch continuo: aggiorna ogni movimento
if (navigator.geolocation) {
  avviaTrackingContinuo();
} else {
  alert("Geolocalizzazione non supportata dal browser.");
}


document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.bar-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.sezione;
            document.querySelectorAll('.sezione').forEach(sec => {
                sec.style.display = 'none';
            });
            document.getElementById('sezione-' + target).style.display = 'block';

            document.querySelectorAll('.bar-item').forEach(el => {
                el.classList.remove('active');
            });
            item.classList.add('active');
        });
    });
});





function filtraPulizieOggi() {
    if (!pulizieGeoJSON) return "Dati pulizia non disponibili.";

    const oggi = new Date();
    const giorniSettimanaIT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const giornoNome = giorniSettimanaIT[oggi.getDay()];
    const settimanaCorrente = Math.floor((oggi.getDate() - 1) / 7) + 1;
    const settimanaStr = settimanaCorrente + "ª";

    const features = pulizieGeoJSON.features;

    const pulizieOggi = features.filter(f => {
        const desc = f.properties.description || "";

        const giornoCod = estraiValoreDescrizione(desc, "giorno_settimana") || "";
        const giorniMap = {
            LU: "Lunedì", MA: "Martedì", ME: "Mercoledì",
            GI: "Giovedì", VE: "Venerdì", SA: "Sabato", DO: "Domenica"
        };
        const giornoPulizia = giorniMap[giornoCod.toUpperCase()] || "";

        if (giornoPulizia !== giornoNome) return false;

        const settimane = [];
        if (estraiValoreDescrizione(desc, "prima_settimana") === "1") settimane.push("1ª");
        if (estraiValoreDescrizione(desc, "seconda_settimana") === "1") settimane.push("2ª");
        if (estraiValoreDescrizione(desc, "terza_settimana") === "1") settimane.push("3ª");
        if (estraiValoreDescrizione(desc, "quarta_settimana") === "1") settimane.push("4ª");
        if (estraiValoreDescrizione(desc, "quinta_settimana") === "1") settimane.push("5ª");

        return settimane.includes(settimanaStr);
    });

    if (pulizieOggi.length === 0) {
        return "<em>Nessuna pulizia programmata per oggi.</em>";
    }

    // Ordinamento per ora e poi indirizzo
    pulizieOggi.sort((a, b) => {
        const descA = a.properties.description || "";
        const descB = b.properties.description || "";

        const oraA = estraiValoreDescrizione(descA, "ora_inizio") || "00:00";
        const oraB = estraiValoreDescrizione(descB, "ora_inizio") || "00:00";

        const indirizzoA = estraiValoreDescrizione(descA, "indirizzo") || "";
        const indirizzoB = estraiValoreDescrizione(descB, "indirizzo") || "";

        const confrontoOrario = oraA.localeCompare(oraB);
        if (confrontoOrario !== 0) return confrontoOrario;

        return indirizzoA.localeCompare(indirizzoB);
    });

    const oraAttuale = oggi.getHours().toString().padStart(2, "0") + ":" + oggi.getMinutes().toString().padStart(2, "0");

    return pulizieOggi.map(f => {
        const desc = f.properties.description || "";

        const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "Indirizzo non specificato";
        const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "-";
        const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "-";
        const tratto = estraiValoreDescrizione(desc, "tratto_strada") || "";

        let stato = "";
        if (oraFine < oraAttuale) {
            stato = `<span class="conclusa">conclusa</span>`;
        } else if (oraInizio <= oraAttuale && oraAttuale <= oraFine) {
            stato = `<span class="incorso">in corso</span>`;
        } else {
            stato = `<span class="noniniziata">non ancora iniziata</span>`;
        }

        const orarioDisplay = `<strong>${oraInizio} - ${oraFine}</strong> ${stato}`;


        return `<div class="pulizia-entry">
            <strong>${indirizzo}</strong> (${orarioDisplay})<br>
            <em>${tratto}</em>
        </div>`;
    }).join("");
}



// Assumiamo che 'pulizieGeoJSON' sia disponibile nel tuo script, con i dati geo delle vie

// --- 1. Creazione mappa Leaflet ---
let mappaPulizia = null;
const markerGroup = L.layerGroup();

document.getElementById('btn-map-view').addEventListener('click', () => {
  document.getElementById('lista-pulizie-oggi').style.display = 'none';
  document.getElementById('mappa-pulizia-oggi').style.display = 'block';
  document.getElementById('btn-map-view').style.display = 'none';
  document.getElementById('btn-list-view').style.display = 'inline-block';

  if (!mappaPulizia) {
    mappaPulizia = L.map('mappa-pulizia-oggi').setView([43.77, 11.25], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mappaPulizia);

    markerGroup.addTo(mappaPulizia);
  }

  const vieOggi = getViePuliziaOggi();
  mostraVieMappa(vieOggi);
});



// --- 2. Funzione che filtra le pulizie di oggi ---
// La tua funzione modificata per restituire solo array di features
function getViePuliziaOggi() {
  if (!pulizieGeoJSON) return [];

  const oggi = new Date();
  const giorniSettimanaIT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const giornoNome = giorniSettimanaIT[oggi.getDay()];
  const settimanaCorrente = Math.floor((oggi.getDate() - 1) / 7) + 1;
  const settimanaStr = settimanaCorrente + "ª";

  const features = pulizieGeoJSON.features;

  return features.filter(f => {
    const desc = f.properties.description || "";

    const giornoCod = estraiValoreDescrizione(desc, "giorno_settimana") || "";
    const giorniMap = {
      LU: "Lunedì", MA: "Martedì", ME: "Mercoledì",
      GI: "Giovedì", VE: "Venerdì", SA: "Sabato", DO: "Domenica"
    };
    const giornoPulizia = giorniMap[giornoCod.toUpperCase()] || "";

    if (giornoPulizia !== giornoNome) return false;

    const settimane = [];
    if (estraiValoreDescrizione(desc, "prima_settimana") === "1") settimane.push("1ª");
    if (estraiValoreDescrizione(desc, "seconda_settimana") === "1") settimane.push("2ª");
    if (estraiValoreDescrizione(desc, "terza_settimana") === "1") settimane.push("3ª");
    if (estraiValoreDescrizione(desc, "quarta_settimana") === "1") settimane.push("4ª");
    if (estraiValoreDescrizione(desc, "quinta_settimana") === "1") settimane.push("5ª");

    return settimane.includes(settimanaStr);
  });
}


// --- 3. Funzione per mostrare marker sulla mappa ---
function mostraVieMappa(vie) {
  markerGroup.clearLayers(); // pulisce marker vecchi

  const oraAttuale = new Date();
  const oraStr = oraAttuale.getHours().toString().padStart(2, '0') + ':' + oraAttuale.getMinutes().toString().padStart(2, '0');

  vie.forEach(f => {
    const desc = f.properties.description || "";

    const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "Indirizzo non specificato";
    const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "00:00";
    const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "00:00";

    // Determino colore in base allo stato
    let colore = 'gray'; // default

    if (oraFine < oraStr) {
      colore = 'green'; // conclusa
    } else if (oraInizio <= oraStr && oraStr <= oraFine) {
      colore = 'orange'; // in corso
    } else {
      colore = 'red'; // non iniziata
    }

    // Se la feature ha geometria punto o linea (se hai linee puoi cambiare marker con polyline)
    if (f.geometry.type === 'Point') {
      const [lng, lat] = f.geometry.coordinates;
      const marker = L.circleMarker([lat, lng], {
        color: colore,
        radius: 8,
        fillOpacity: 0.8
      }).addTo(markerGroup);
      marker.bindPopup(`<strong>${indirizzo}</strong><br>${oraInizio} - ${oraFine}`);
    }
    else if (f.geometry.type === 'LineString') {
      const latlngs = f.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      const polyline = L.polyline(latlngs, {color: colore}).addTo(markerGroup);
      polyline.bindPopup(`<strong>${indirizzo}</strong><br>${oraInizio} - ${oraFine}`);
    }
  });

  // Zoom sulla zona con i marker
  if (markerGroup.getLayers().length > 0) {
    mappaPulizia.fitBounds(markerGroup.getBounds().pad(0.5));
  }
}


// --- 4. Gestione pulsanti vista mappa/lista ---
document.getElementById('btn-map-view').addEventListener('click', () => {
  document.getElementById('lista-pulizie-oggi').style.display = 'none';
  document.getElementById('mappa-pulizia-oggi').style.display = 'block';
  document.getElementById('btn-map-view').style.display = 'none';
  document.getElementById('btn-list-view').style.display = 'inline-block';

  const vieOggi = getViePuliziaOggi();
  mostraVieMappa(vieOggi);
});

document.getElementById('btn-list-view').addEventListener('click', () => {
  document.getElementById('lista-pulizie-oggi').style.display = 'block';
  document.getElementById('mappa-pulizia-oggi').style.display = 'none';
  document.getElementById('btn-map-view').style.display = 'inline-block';
  document.getElementById('btn-list-view').style.display = 'none';
});





if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/PuliziaStrade-FI/sw.js')
      .then(() => console.log('Service Worker registrato'))
      .catch(err => console.error('Errore registrazione SW:', err));
  });
}





