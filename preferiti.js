let vieDisponibili = [];
let preferite = [];

const inputRicerca = document.getElementById('ricerca-via');
const contenitoreRisultati = document.getElementById('risultati-ricerca');
const listaPreferiti = document.getElementById('lista-preferiti');

inputRicerca.disabled = true;

fetch('pulizia_firenze.geojson')
    .then(response => response.json())
    .then(data => {
        vieDisponibili = [...new Set(
            data.features
                .map(f => f.properties.indirizzo)
                .filter(nome => typeof nome === 'string' && nome.trim() !== '')
        )];
        inputRicerca.disabled = false;
    })
    .catch(err => {
        console.error('Errore nel caricamento del GeoJSON:', err);
        inputRicerca.placeholder = 'Errore nel caricamento dati';
    });

inputRicerca.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const risultati = vieDisponibili.filter(via =>
        typeof via === 'string' && via.toLowerCase().includes(query)
    );
    mostraRisultati(risultati);
});

function mostraRisultati(risultati) {
    contenitoreRisultati.innerHTML = '';
    risultati.slice(0, 10).forEach(via => {
        const div = document.createElement('div');
        div.textContent = via;
        div.className = 'risultato';
        div.addEventListener('click', () => aggiungiPreferita(via));
        contenitoreRisultati.appendChild(div);
    });
}

function aggiungiPreferita(via) {
    if (!preferite.includes(via)) {
        preferite.push(via);
        aggiornaListaPreferiti();
    }
}

function aggiornaListaPreferiti() {
    listaPreferiti.innerHTML = '';
    preferite.forEach(via => {
        const li = document.createElement('li');
        li.textContent = via;

        const btnRimuovi = document.createElement('button');
        btnRimuovi.textContent = '×';
        btnRimuovi.className = 'rimuovi';
        btnRimuovi.title = 'Rimuovi dai preferiti';
        btnRimuovi.addEventListener('click', () => {
            preferite = preferite.filter(v => v !== via);
            aggiornaListaPreferiti();
        });

        li.appendChild(btnRimuovi);
        listaPreferiti.appendChild(li);
    });
}
