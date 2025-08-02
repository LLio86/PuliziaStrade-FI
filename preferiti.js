const STORAGE_KEY = 'mieViePreferite';
const inputRicerca = document.getElementById("input-via");
const risultatiContainer = document.getElementById("risultati-vie");
const preferitiContainer = document.getElementById("lista-preferiti");

function caricaPreferiti() {
    const salvati = localStorage.getItem(STORAGE_KEY);
    return salvati ? JSON.parse(salvati) : [];
}

function salvaPreferiti(preferiti) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
}

function aggiungiPreferito(via) {
    let preferiti = caricaPreferiti();
    if (!preferiti.includes(via)) {
        preferiti.push(via);
        salvaPreferiti(preferiti);
        aggiornaListaPreferiti();
    }
}

function rimuoviPreferito(via) {
    let preferiti = caricaPreferiti().filter(v => v !== via);
    salvaPreferiti(preferiti);
    aggiornaListaPreferiti();
}

function aggiornaListaPreferiti() {
    const preferiti = caricaPreferiti();
    preferitiContainer.innerHTML = '';

    if (preferiti.length === 0) {
        preferitiContainer.innerHTML = "<em>Nessuna via preferita salvata.</em>";
        return;
    }

    preferiti.forEach(via => {
        const wrapper = document.createElement("div");
        wrapper.className = "preferito-item";

        const titolo = document.createElement("h4");
        titolo.textContent = via;

        const dettagli = document.createElement("div");
        dettagli.innerHTML = getPuliziaInfo(via);

        const btnRimuovi = document.createElement("button");
        btnRimuovi.textContent = "Rimuovi";
        btnRimuovi.className = "btn-rimuovi";
        btnRimuovi.onclick = () => rimuoviPreferito(via);

        wrapper.appendChild(titolo);
        wrapper.appendChild(dettagli);
        wrapper.appendChild(btnRimuovi);

        preferitiContainer.appendChild(wrapper);
    });
}

inputRicerca.addEventListener("input", () => {
    const query = inputRicerca.value.trim().toLowerCase();
    risultatiContainer.innerHTML = '';

    if (!query) return;

    const vieDisponibili = (pulizieGeoJSON?.features || []).map(f => {
        const descrizione = f.properties.description || "";
        const indirizzo = estraiValoreDescrizione(descrizione, "indirizzo");
        return indirizzo;
    }).filter(Boolean);

    const risultati = vieDisponibili
        .filter(v => v.toLowerCase().includes(query))
        .slice(0, 10);

    if (risultati.length === 0) {
        risultatiContainer.innerHTML = "<em>Nessun risultato</em>";
        return;
    }

    risultati.forEach(via => {
        const voce = document.createElement("div");
        voce.textContent = via;
        voce.className = "risultato-via";
        voce.onclick = () => {
            aggiungiPreferito(via);
            inputRicerca.value = '';
            risultatiContainer.innerHTML = '';
        };
        risultatiContainer.appendChild(voce);
    });
});

document.addEventListener("DOMContentLoaded", aggiornaListaPreferiti);
