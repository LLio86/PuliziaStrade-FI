let vieDisponibili = [];  // Popolato dal GeoJSON
let preferite = [];

// Carica e legge il GeoJSON (es. 'strade.geojson')
fetch('pulizia_firenze.geojson')
    .then(response => response.json())
    .then(data => {
        vieDisponibili = data.features.map(f => f.properties.nome_via); // Assumi campo "nome_via"
    });

// Cerca tra le vie quando l'utente digita
document.getElementById('ricerca-via').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const risultati = vieDisponibili.filter(via => via.toLowerCase().includes(query));
    mostraRisultati(risultati);
});

// Mostra i risultati come elenco cliccabile
function mostraRisultati(risultati) {
    const contenitore = document.getElementById('risultati-ricerca');
    contenitore.innerHTML = '';
    risultati.slice(0, 10).forEach(via => {
        const div = document.createElement('div');
        div.textContent = via;
        div.className = 'risultato';
        div.addEventListener('click', () => aggiungiPreferita(via));
        contenitore.appendChild(div);
    });
}

// Aggiungi una via ai preferiti e aggiorna la lista
function aggiungiPreferita(via) {
    if (!preferite.includes(via)) {
        preferite.push(via);
        aggiornaListaPreferiti();
    }
}

// Mostra la lista delle vie preferite
function aggiornaListaPreferiti() {
    const lista = document.getElementById('lista-preferiti');
    lista.innerHTML = '';
    preferite.forEach(via => {
        const li = document.createElement('li');
        li.textContent = via;
        lista.appendChild(li);
    });
}

