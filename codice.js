const addressEl = document.getElementById("address");
    const coordsEl = document.getElementById("coords");
    const puliziaEl = document.getElementById("pulizia");
    const map = L.map('map').setView([43.7696, 11.2558], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    let pulizieGeoJSON = null;

    fetch('pulizia_firenze.geojson')
  .then(response => response.json())
  .then(data => {
    pulizieGeoJSON = data;
    console.log("Dati pulizia caricati:", data);

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
            date.push({ data, settimana });
            settimana++;
          }
        }
        return date;
      }

      function trovaProssima(dataList) {
        return dataList.find(({ data, settimana }) => {
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
            LU: "Lunedì", MA: "Martedì", ME: "Mercoledì",
            GI: "Giovedì", VE: "Venerdì", SA: "Sabato", DO: "Domenica"
          };
          const giornoNome = giorni[giornoCod.toUpperCase()] || giornoCod;

          const prossimaData = calcolaProssimaDataPulizia(giornoNome, settimane);


            let prossimaDataStr;
if (prossimaData) {
  const oggi = new Date();
  const diffTime = prossimaData.setHours(0, 0, 0, 0) - oggi.setHours(0, 0, 0, 0);
  const diffGiorni = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let extraInfo = "";
  if (diffGiorni === 1) {
    extraInfo = "(domani)";
  } else if (diffGiorni === 0) {
    extraInfo = "(oggi)";
  } else if (diffGiorni > 1) {
    extraInfo = `(tra ${diffGiorni} giorni)`;
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
            <div class="pulizia-entry">
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

    const autoIcon = L.icon({
      iconUrl: 'sedan.png', // esempio auto
      iconSize:     [40, 40], // dimensione dell’icona
      iconAnchor:   [20, 40], // punto dell'icona che tocca il suolo
      popupAnchor:  [0, -40]  // punto da cui esce il popup
});

    let autoCenter = true;

map.on('movestart', () => {
  autoCenter = false; // L’utente ha spostato la mappa manualmente
});

function aggiornaPosizione(lat, lon) {
  coordsEl.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  if (marker) {
    marker.setLatLng([lat, lon]);
  } else {
    marker = L.marker([lat, lon], { icon: autoIcon }).addTo(map).bindPopup("🅿️").openPopup();
  }

  if (autoCenter) {
    map.setView([lat, lon], 17);
  }

  reverseGeocode(lat, lon);
}


    function onLocationError(e) {
      alert("Errore nel trovare la posizione: " + e.message);
    }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          aggiornaPosizione(lat, lon);
        },
        onLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000
        }
      );
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

  // Calcola la settimana corrente del mese
  const settimanaCorrente = Math.floor((oggi.getDate() - 1) / 7) + 1;
  const settimanaStr = settimanaCorrente + "ª";

  const features = pulizieGeoJSON.features;

  const pulizieOggi = features.filter(f => {
    const desc = f.properties.description || "";

    const giornoCod = estraiValoreDescrizione(desc, "giorno_settimana") || "";
    const giorniMap = { LU: "Lunedì", MA: "Martedì", ME: "Mercoledì", GI: "Giovedì", VE: "Venerdì", SA: "Sabato", DO: "Domenica" };
    const giornoPulizia = giorniMap[giornoCod.toUpperCase()] || "";

    if (giornoPulizia !== giornoNome) return false;

    // Controllo settimana
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

  // Crea lista HTML
  return pulizieOggi.map(f => {
    const desc = f.properties.description || "";
    const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "Indirizzo non specificato";
    const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "-";
    const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "-";
    const tratto = estraiValoreDescrizione(desc, "tratto_strada") || "";

    return `<div class="pulizia-oggi-entry">
      <strong>${indirizzo}</strong> (${oraInizio} - ${oraFine})<br>
      <em>${tratto}</em>
    </div>`;
  }).join("");
}
