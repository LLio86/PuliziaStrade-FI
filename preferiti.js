let vieDisponibili = [];  // Sarà popolato dal GeoJSON
let preferite = [];

let pulizieGeoJSON = null;

// Carica il GeoJSON con i dati delle pulizie
fetch('pulizia_firenze.geojson')
  .then(response => response.json())
  .then(data => {
    pulizieGeoJSON = data;
    vieDisponibili = data.features.map(f => f.properties.nome_via).filter(Boolean);
    console.log("GeoJSON caricato:", vieDisponibili);
    caricaPreferiti();
    aggiornaListaPreferiti();
  });

// Elementi DOM
const inputRicerca = document.getElementById('ricerca-via');
const risultatiEl = document.getElementById('risultati-ricerca');
const listaPreferitiEl = document.getElementById('lista-preferiti');

// Event listener per l'input di ricerca
inputRicerca.addEventListener('input', () => {
  const query = inputRicerca.value.toLowerCase();
  const risultati = vieDisponibili.filter(via => via.toLowerCase().includes(query));
  mostraRisultati(risultati);
});

function mostraRisultati(risultati) {
  risultatiEl.innerHTML = '';
  if (risultati.length === 0) {
    risultatiEl.textContent = 'Nessun risultato';
    return;
  }

  risultati.slice(0, 10).forEach(via => {
    const div = document.createElement('div');
    div.textContent = via;
    div.className = 'risultato';
    div.addEventListener('click', () => {
      aggiungiPreferita(via);
      inputRicerca.value = '';
      risultatiEl.innerHTML = '';
    });
    risultatiEl.appendChild(div);
  });
}

function aggiungiPreferita(via) {
  if (!preferite.includes(via)) {
    preferite.push(via);
    salvaPreferiti();
    aggiornaListaPreferiti();
  }
}

function rimuoviPreferita(via) {
  preferite = preferite.filter(v => v !== via);
  salvaPreferiti();
  aggiornaListaPreferiti();
}

function aggiornaListaPreferiti() {
  listaPreferitiEl.innerHTML = '';
  preferite.forEach(via => {
    const li = document.createElement('li');
    
    const titolo = document.createElement('strong');
    titolo.textContent = via;
    
    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.onclick = () => rimuoviPreferita(via);

    const dettagli = document.createElement('div');
    dettagli.innerHTML = getPuliziaInfo(via);

    li.appendChild(titolo);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(btn);
    li.appendChild(dettagli);

    listaPreferitiEl.appendChild(li);
  });
}

function salvaPreferiti() {
  localStorage.setItem('preferite', JSON.stringify(preferite));
}

function caricaPreferiti() {
  const salvate = localStorage.getItem('preferite');
  if (salvate) {
    preferite = JSON.parse(salvate);
  }
}

function getPuliziaInfo(via) {
  if (!pulizieGeoJSON) return "Dati non disponibili";

  const matches = pulizieGeoJSON.features.filter(f => {
    const desc = f.properties.description || "";
    const indirizzo = estraiValoreDescrizione(desc, "indirizzo")?.toLowerCase() || "";
    return indirizzo && via.toLowerCase().includes(indirizzo);
  });

  if (matches.length === 0) return "Nessuna pulizia programmata.";

  return matches.map(f => {
    const desc = f.properties.description || "";

    const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "ND";
    const giorno = estraiValoreDescrizione(desc, "giorno_settimana") || "ND";
    const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "-";
    const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "-";
    const tratto = estraiValoreDescrizione(desc, "tratto_strada") || "";

    const settimane = [];
    if (estraiValoreDescrizione(desc, "prima_settimana") === "1") settimane.push("1ª");
    if (estraiValoreDescrizione(desc, "seconda_settimana") === "1") settimane.push("2ª");
    if (estraiValoreDescrizione(desc, "terza_settimana") === "1") settimane.push("3ª");
    if (estraiValoreDescrizione(desc, "quarta_settimana") === "1") settimane.push("4ª");
    if (estraiValoreDescrizione(desc, "quinta_settimana") === "1") settimane.push("5ª");

    const settimaneText = settimane.join(", ") || "Non specificate";

    return `
      <div>
        Giorno: <strong>${giorno}</strong><br>
        Orario: <strong>${oraInizio}</strong> - <strong>${oraFine}</strong><br>
        Settimane: <strong>${settimaneText}</strong><br>
        ${tratto ? `Tratto: <em>${tratto}</em>` : ""}
      </div>
    `;
  }).join("<hr>");
}

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
