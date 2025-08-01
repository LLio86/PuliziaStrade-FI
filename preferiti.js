console.log('📢 preferiti.js caricato');

let vieDisponibili = [];
let preferite = [];

const inputRicerca = document.getElementById('ricerca-via');
const contenitoreRisultati = document.getElementById('risultati-ricerca');
const listaPreferiti = document.getElementById('lista-preferiti');

if (!inputRicerca || !contenitoreRisultati || !listaPreferiti) {
    console.error('❌ Elementi DOM non trovati!');
    // Non proseguire
} else {
    // Disabilita input finché dati non caricati
    inputRicerca.disabled = true;
    inputRicerca.placeholder = 'Caricamento vie...';

    fetch('pulizia_firenze.geojson')
        .then(response => response.json())
        .then(data => {
            console.log('GeoJSON caricato:', data);

            vieDisponibili = data.features
                .map(f => f.properties.indirizzo)
                .filter(via => typeof via === 'string' && via.trim() !== '');

            console.log(`Vie disponibili (${vieDisponibili.length}):`, vieDisponibili);

            // Abilita input e resetta placeholder
            inputRicerca.disabled = false;
            inputRicerca.placeholder = 'Cerca una via...';
        })
        .catch(err => {
            console.error('Errore caricamento GeoJSON:', err);
            inputRicerca.placeholder = 'Errore caricamento vie';
        });

    inputRicerca.addEventListener('input', function () {
        if (inputRicerca.disabled) {
            console.log('Input disabilitato, ignorando input');
            return;
        }

        const query = this.value.toLowerCase();
        console.log('Ricerca per:', query);

        if (query.trim() === '') {
            contenitoreRisultati.innerHTML = '';
            return;
        }

        const risultati = vieDisponibili.filter(via => via.toLowerCase().includes(query));
        console.log(`Risultati trovati: ${risultati.length}`, risultati);
        mostraRisultati(risultati);
    });
}

function mostraRisultati(risultati) {
    contenitoreRisultati.innerHTML = '';

    if (risultati.length === 0) {
        contenitoreRisultati.textContent = 'Nessun risultato';
        return;
    }

    risultati.slice(0, 10).forEach(via => {
        const div = document.createElement('div');
        div.textContent = via;
        div.className = 'risultato';
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            console.log('Aggiunta preferita:', via);
            aggiungiPreferita(via);
        });
        contenitoreRisultati.appendChild(div);
    });
}

function aggiungiPreferita(via) {
    if (!preferite.includes(via)) {
        preferite.push(via);
        aggiornaListaPreferiti();
    } else {
        console.log('Via già nei preferiti:', via);
    }
}

function aggiornaListaPreferiti() {
    listaPreferiti.innerHTML = '';

    if (preferite.length === 0) {
        const liVuoto = document.createElement('li');
        liVuoto.textContent = 'Nessuna via preferita';
        listaPreferiti.appendChild(liVuoto);
        return;
    }

    preferite.forEach(via => {
        const li = document.createElement('li');
        li.textContent = via + ' ';

        const btnRimuovi = document.createElement('button');
        btnRimuovi.textContent = '×';
        btnRimuovi.title = 'Rimuovi dai preferiti';
        btnRimuovi.style.marginLeft = '8px';
        btnRimuovi.addEventListener('click', () => {
            preferite = preferite.filter(v => v !== via);
            aggiornaListaPreferiti();
        });

        li.appendChild(btnRimuovi);
        listaPreferiti.appendChild(li);
    });
}

// Inizializza lista preferiti vuota
aggiornaListaPreferiti();
