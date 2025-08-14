const STORAGE_KEY = 'mieViePreferite';
let vieDisponibili = [];
let preferite = [];

// Elementi DOM
const ricercaEl = document.getElementById('ricerca-via');
const risultatiEl = document.getElementById('risultati-ricerca');
const preferitiEl = document.getElementById('lista-preferiti');

// Carica preferite da localStorage all'avvio
const saved = localStorage.getItem(STORAGE_KEY);
preferite = saved ? JSON.parse(saved) : [];
//console.log('Preferiti caricati:', preferite);
aggiornaListaPreferiti();

// Carica vie disponibili da GeoJSON
fetch('pulizia_firenze.geojson')
  .then(res => res.json())
  .then(data => {
    datiPulizia = data.features;

    vieDisponibili = Array.from(new Set(
      datiPulizia
        .map(f => estraiValoreDescrizione(f.properties.description || '', 'indirizzo'))
        .filter(v => v)
    ));

    aggiornaListaPreferiti();
  });

// Ricerca dinamica
ricercaEl.addEventListener('input', () => {
  const query = ricercaEl.value.toLowerCase().trim();
  if (!query) {
    mostraRisultati([]);
    return;
  }
  const risultati = vieDisponibili.filter(via => via.toLowerCase().includes(query));
  mostraRisultati(risultati);
});

// Mostra risultati ricerca
function mostraRisultati(risultati) {
  risultatiEl.innerHTML = '';
  if (risultati.length === 0) {
    risultatiEl.innerHTML = '<em></em>';
    return;
  }
  risultati.slice(0, 10).forEach(via => {
    const div = document.createElement('div');
    div.textContent = via;
    div.className = 'risultato';
    div.addEventListener('click', () => {
      aggiungiPreferita(via);
    });
    risultatiEl.appendChild(div);
  });
}

// Aggiungi preferito e salva
function aggiungiPreferita(via) {
  if (!preferite.includes(via)) {
    preferite.push(via);
    salvaPreferiti();
    aggiornaListaPreferiti();
  }
  // Svuota la casella di ricerca
  ricercaEl.value = '';
  // Pulisci i risultati mostrati
  mostraRisultati([]);
}

// Salva preferiti su localStorage
function salvaPreferiti() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferite));
  console.log('Preferiti salvati:', preferite);
}

// Aggiorna la lista preferiti con pulsante rimuovi
function aggiornaListaPreferiti() {
  preferitiEl.innerHTML = '';
  if (preferite.length === 0) {
    preferitiEl.innerHTML = '<li>Nessuna via preferita</li>';
    return;
  }
  preferite.forEach(via => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${via}</strong>
      <button class="rimuovi">×</button>
      <div class="info-pulizia">${getPuliziaInfo(via)}</div>
    `;
    li.querySelector('.rimuovi').addEventListener('click', () => {
      rimuoviPreferita(via);
    });
    preferitiEl.appendChild(li);
  });
}

// Rimuovi preferito e aggiorna storage/UI
function rimuoviPreferita(via) {
  preferite = preferite.filter(v => v !== via);
  salvaPreferiti();
  aggiornaListaPreferiti();
}




