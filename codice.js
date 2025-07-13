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
          const prossimaDataStr = prossimaData
            ? prossimaData.toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : "Data non trovata";

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
          const via = data.address.road || data.display_name;
          addressEl.textContent = via;
          const info = getPuliziaInfo(via);
          puliziaEl.innerHTML = info;
        });
    }

    let marker = null;

    const autoIcon = L.icon({
      iconUrl: 'sedan.png', // esempio auto
      iconSize:     [40, 40], // dimensione dell’icona
      iconAnchor:   [20, 40], // punto dell'icona che tocca il suolo
      popupAnchor:  [0, -40]  // punto da cui esce il popup
});

    function aggiornaPosizione(lat, lon) {
      coordsEl.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        //marker = L.marker([lat, lon]).addTo(map).bindPopup("Sei qui").openPopup();
        marker = L.marker([lat, lon], { icon: autoIcon }).addTo(map).bindPopup("🅿️").openPopup();

      }

      map.setView([lat, lon], 17);
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
