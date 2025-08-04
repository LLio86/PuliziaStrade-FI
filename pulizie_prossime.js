// pulizie_prossime.js

let pulizieGeoJSON = null;

// Funzione helper per estrarre valori da description HTML
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

// Calcola la prossima data di pulizia in base a giorno settimana e settimane valide
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

  // Se non trovato, cerca mese successivo
  const meseSuccessivo = (meseCorrente + 1) % 12;
  const annoSuccessivo = meseCorrente === 11 ? annoCorrente + 1 : annoCorrente;
  const dateMeseSuccessivo = trovaDateNelMese(meseSuccessivo, annoSuccessivo);
  const matchSuccessivo = trovaProssima(dateMeseSuccessivo);

  return matchSuccessivo?.data || null;
}

// Funzione per ottenere tutte le prossime pulizie ordinate per data e ora (massimo 50)
function getTutteProssimePulizie() {
  if (!pulizieGeoJSON) return [];

  const features = pulizieGeoJSON.features;
  const pulizie = [];

  for (const f of features) {
    const desc = f.properties.description || "";

    const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "Indirizzo non specificato";
    const giornoCod = estraiValoreDescrizione(desc, "giorno_settimana") || "";
    const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "00:00";
    const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "";
    const tratto = estraiValoreDescrizione(desc, "tratto_strada") || "";

    const settimane = [];
    if (estraiValoreDescrizione(desc, "prima_settimana") === "1") settimane.push("1ª");
    if (estraiValoreDescrizione(desc, "seconda_settimana") === "1") settimane.push("2ª");
    if (estraiValoreDescrizione(desc, "terza_settimana") === "1") settimane.push("3ª");
    if (estraiValoreDescrizione(desc, "quarta_settimana") === "1") settimane.push("4ª");
    if (estraiValoreDescrizione(desc, "quinta_settimana") === "1") settimane.push("5ª");

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
    if (!prossimaData) continue;

    const [h, m] = oraInizio.split(':').map(Number);
    const dataCompleta = new Date(prossimaData);
    dataCompleta.setHours(h || 0, m || 0, 0, 0);

    // Salta date passate
    if (dataCompleta < new Date()) continue;

    pulizie.push({
      indirizzo,
      giornoNome,
      oraInizio,
      oraFine,
      tratto,
      prossimaData: dataCompleta
    });
  }

  // Ordina per data+ora
  pulizie.sort((a, b) => a.prossimaData - b.prossimaData);

  return pulizie.slice(0, 50);
}

// Funzione per mostrare la tabella nel div con id "lista-pulizie-oggi"
function mostraProssimePulizie() {
  const listaDiv = document.getElementById("lista-pulizie-oggi");
  if (!listaDiv) return;

  const pulizie = getTutteProssimePulizie();

  if (pulizie.length === 0) {
    listaDiv.innerHTML = "<em>Nessuna pulizia programmata prossimamente.</em>";
    return;
  }

  let html = `
    <table id="tabella-prossime-pulizie" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #eee;">
          <th style="padding: 6px; border: 1px solid #ccc;">Indirizzo</th>
          <th style="padding: 6px; border: 1px solid #ccc;">Giorno</th>
          <th style="padding: 6px; border: 1px solid #ccc;">Ora Inizio</th>
          <th style="padding: 6px; border: 1px solid #ccc;">Ora Fine</th>
          <th style="padding: 6px; border: 1px solid #ccc;">Tratto</th>
          <th style="padding: 6px; border: 1px solid #ccc;">Data Pulizia</th>
        </tr>
      </thead>
      <tbody>
  `;

  pulizie.forEach(p => {
    const dataStr = p.prossimaData.toLocaleDateString("it-IT", {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    html += `
      <tr>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.indirizzo}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.giornoNome}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.oraInizio}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.oraFine}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.tratto}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${dataStr}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  listaDiv.innerHTML = html;
}

// Carica GeoJSON e mostra le prossime pulizie
fetch('pulizia_firenze.geojson')
  .then(response => response.json())
  .then(data => {
    pulizieGeoJSON = data;
    mostraProssimePulizie();
  })
  .catch(err => {
    console.error("Errore caricamento dati pulizia:", err);
    const listaDiv = document.getElementById("lista-pulizie-oggi");
    if (listaDiv) listaDiv.innerHTML = "<em>Errore nel caricamento dei dati di pulizia.</em>";
  });
