console.log('📢 preferiti.js caricato');

let vieDisponibili = ["BORGO ALLEGRI", "VIA ROMA", "VIA GIUSTI"]; // Dati di prova
let preferite = [];

const inputRicerca = document.getElementById('ricerca-via');
const contenitoreRisultati = document.getElementById('risultati-ricerca');
const listaPreferiti = document.getElementById('lista-preferiti');

console.log('Elementi DOM:', {inputRicerca, contenitoreRisultati, listaPreferiti});

if (!inputRicerca || !contenitoreRisultati || !listaPreferiti) {
    console.error('❌ Elementi DOM non trovati!');
} else {
    console.log('✅ Elementi DOM trovati correttamente');
}

inputRicerca.disabled = false;

inputRicerca.addEventListener('input', function () {
    console.log('✍️ Evento input: valore digitato ->', this.value);

    const query = this.value.toLowerCase();
    const risultati = vieDisponibili.filter(via => {
        const check = typeof via === 'string' && via.toLowerCase().includes(query);
        console.log(`- Verifico via "${via}" -> ${check}`);
        return check;
    });

    console.log('Risultati filtrati:', risultati);

    mostraRisultati(risultati);
});

function mostraRisultati(risultati) {
    console.log('Mostro risultati, quantità:', risultati.length);
    contenitoreRisultati.innerHTML = '';

    if (risultati.length === 0) {
        contenitoreRisultati.textContent = 'Nessun risultato';
        console.log('⚠️ Nessun risultato da mostrare');
        return;
    }

    risultati.slice(0, 10).forEach(via => {
        console.log('Aggiungo risultato:', via);
        const div = document.createElement('div');
        div.textContent = via;
        div.className = 'risultato';
        div.addEventListener('click', () => {
            console.log('Clicked su:', via);
            aggiungiPreferita(via);
        });
        contenitoreRisultati.appendChild(div);
    });
}

function aggiungiPreferita(via) {
    console.log('Aggiungo preferita:', via);
    if (!preferite.includes(via)) {
        preferite.push(via);
        console.log('Lista preferiti aggiornata:', preferite);
        aggiornaListaPreferiti();
    } else {
        console.log('Via già presente nei preferiti');
    }
}

function aggiornaListaPreferiti() {
    console.log('Aggiorno lista preferiti');
    listaPreferiti.innerHTML = '';

    if (preferite.length === 0) {
        const liVuoto = document.createElement('li');
        liVuoto.textContent = 'Nessuna via preferita';
        listaPreferiti.appendChild(liVuoto);
        console.log('Lista preferiti vuota');
        return;
    }

    preferite.forEach(via => {
        console.log('Mostro preferita:', via);
        const li = document.createElement('li');
        li.textContent = via;

        const btnRimuovi = document.createElement('button');
        btnRimuovi.textContent = '×';
        btnRimuovi.className = 'rimuovi';
        btnRimuovi.title = 'Rimuovi dai preferiti';
        btnRimuovi.addEventListener('click', () => {
            console.log('Rimuovo preferita:', via);
            preferite = preferite.filter(v => v !== via);
            aggiornaListaPreferiti();
        });

        li.appendChild(btnRimuovi);
        listaPreferiti.appendChild(li);
    });
}

// All'avvio, mostra messaggio se preferiti vuoti
aggiornaListaPreferiti();
