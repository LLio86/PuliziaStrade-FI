// Funzioni di utilità per gestione dati pulizia

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
                date.push({
                    data,
                    settimana
                });
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

function getPuliziaInfo(via, pulizieGeoJSON) {
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

            let prossimaDataStr;
            let classeData = "";

            if (prossimaData) {
                const oggi = new Date();
                const diffTime = prossimaData.setHours(0, 0, 0, 0) - oggi.setHours(0, 0, 0, 0);
                const diffGiorni = Math.round(diffTime / (1000 * 60 * 60 * 24));

                let extraInfo = "";

                if (diffGiorni === 1) {
                    extraInfo = "(domani)";
                    classeData = "pulizia-domani";
                } else if (diffGiorni > 1 && diffGiorni <= 3) {
                    extraInfo = `(tra ${diffGiorni} giorni)`;
                    classeData = "pulizia-prossimi";
                }

                prossimaDataStr = `${prossimaData.toLocaleDateString("it-IT", {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })} <span class="extra-info">${extraInfo}</span>`;
            } else {
                prossimaDataStr = "Data non trovata";
            }

            return `
            <div class="pulizia-entry ${classeData}">
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

function filtraPulizieOggi(pulizieGeoJSON) {
    if (!pulizieGeoJSON) return "Dati pulizia non disponibili.";

    const oggi = new Date();
    const giorniSettimanaIT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const giornoNome = giorniSettimanaIT[oggi.getDay()];
    const settimanaCorrente = Math.floor((oggi.getDate() - 1) / 7) + 1;
    const settimanaStr = settimanaCorrente + "ª";

    const features = pulizieGeoJSON.features;

    const pulizieOggi = features.filter(f => {
        const desc = f.properties.description || "";

        const giornoCod = estraiValoreDescrizione(desc, "giorno_settimana") || "";
        const giorniMap = {
            LU: "Lunedì",
            MA: "Martedì",
            ME: "Mercoledì",
            GI: "Giovedì",
            VE: "Venerdì",
            SA: "Sabato",
            DO: "Domenica"
        };
        const giornoPulizia = giorniMap[giornoCod.toUpperCase()] || "";

        if (giornoPulizia !== giornoNome) return false;

        const settimane = [];
        if (estraiValoreDescrizione(desc, "prima_settimana") === "1") settimane.push("1ª");
        if (estraiValoreDescrizione(desc, "seconda_settimana") === "1") settimane.push("2ª");
        if (estraiValoreDescrizione(desc, "terza_settimana") === "1") settimane.push("3ª");
        if (estraiValoreDescrizione(desc, "quarta_settimana") === "1") settimane.push("4ª");
        if (estraiValoreDescrizione(desc, "quinta_settimana") === "1") settimane.push("5ª");

        return settimane.includes(settimanaStr);
    });

    if (pulizieOggi.length === 0) {
        return "<em>Nessuna pulizia programmata per oggi.</em>";
    }

    // Ordinamento per ora e poi indirizzo
    pulizieOggi.sort((a, b) => {
        const descA = a.properties.description || "";
        const descB = b.properties.description || "";

        const oraA = estraiValoreDescrizione(descA, "ora_inizio") || "00:00";
        const oraB = estraiValoreDescrizione(descB, "ora_inizio") || "00:00";

        const indirizzoA = estraiValoreDescrizione(descA, "indirizzo") || "";
        const indirizzoB = estraiValoreDescrizione(descB, "indirizzo") || "";

        const confrontoOrario = oraA.localeCompare(oraB);
        if (confrontoOrario !== 0) return confrontoOrario;

        return indirizzoA.localeCompare(indirizzoB);
    });

    const oraAttuale = oggi.getHours().toString().padStart(2, "0") + ":" + oggi.getMinutes().toString().padStart(2, "0");

    return pulizieOggi.map(f => {
        const desc = f.properties.description || "";

        const indirizzo = estraiValoreDescrizione(desc, "indirizzo") || "Indirizzo non specificato";
        const oraInizio = estraiValoreDescrizione(desc, "ora_inizio") || "-";
        const oraFine = estraiValoreDescrizione(desc, "ora_fine") || "-";
        const tratto = estraiValoreDescrizione(desc, "tratto_strada") || "";

        const conclusa = oraFine < oraAttuale;

        const orarioDisplay = conclusa ?
            `<s>${oraInizio} - ${oraFine}</s> <span class="conclusa">conclusa</span>` :
            `<strong>${oraInizio} - ${oraFine}</strong>`;

        return `<div class="pulizia-entry">
            <strong>${indirizzo}</strong> (${orarioDisplay})<br>
            <em>${tratto}</em>
        </div>`;
    }).join("");
}
