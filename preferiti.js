let vieDisponibili = [];
let preferite = [];

const ricercaEl = document.getElementById('ricerca-via');
const risultatiEl = document.getElementById('risultati-ricerca');
const preferitiEl = document.getElementById('lista-preferiti');

fetch('pulizia_firenze.geojson')
  .then(response => response.json())
  .then(data => {
    console.log("Caricato GeoJSON per ricerca:", data);
    vieDisponibili = data.features.map(f => {
      const html = f.properties.description || "";
      const indirizzo = estraiValoreDescrizione(html, "indirizzo");
      return indirizzo ? indirizzo.trim() : null;
    }).filter(v => v !== null);

    console.log("Vie disponibili per ricerca:", vieDisponibili);
  });

// Event listener ricerca input
ricercaEl.addEventListener('input', () => {
  const query = ricercaEl.value.toLowerCase().trim();
  if (query.length === 0) {
    mostraRisultati([]);
    return;
  }

  const risultati = vieDisponibili.filter(via => via.toLowerCase().includes(query));
  mostraRisultati(risultati);
});

// Mostra risultati della ricerca
function mostraRisultati(risultati) {
  risultatiEl.innerHTML = '';

  if (risultati.length === 0) {
    risultatiEl.innerHTML = '<em>Nessun risultato</em>';
    return;
  }

  risultati.slice(0, 10).forEach(via => {
    const div = document.createElement('div');
    div.textContent = via;
    div.className = 'risultato';
    div.addEventListener('click', () => aggiungiPreferita(via));
    risultatiEl.appendChild(div);
  });
}

// Aggiungi via ai preferiti
function aggiungiPreferita(via) {
  if (!preferite.includes(via)) {
    preferite.push(via);
    aggiornaListaPreferiti();
  }
}

// Mostra vie preferite e info pulizia
function aggiornaListaPreferiti() {
  preferitiEl.innerHTML = '';

  preferite.forEach(via => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${via}</strong><br>${getPuliziaInfo(via)}`;
    preferitiEl.appendChild(li);
  });
}
