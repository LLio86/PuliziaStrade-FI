const temiDisponibili = ['chiaro', 'scuro', 'alto-contrasto'];
const temaSelect = document.getElementById('tema-select');
const temaAutoCheckbox = document.getElementById('tema-auto-checkbox');

// Applica il tema scelto
function applicaTema(tema) {
  temiDisponibili.forEach(t => document.body.classList.remove(`tema-${t}`));
  if (temiDisponibili.includes(tema) && tema !== 'chiaro') {
    document.body.classList.add(`tema-${tema}`);
  }
  localStorage.setItem('temaApp', tema);
}

// Controlla se è notte (tra 20:00 e 7:00)
function èNotte() {
  const ora = new Date().getHours();
  return ora >= 20 || ora < 7;
}

// Abilita/disabilita il selettore tema in base all'interruttore automatico
function aggiornaStatoSelettoreTema() {
  temaSelect.disabled = temaAutoCheckbox.checked;
}

// Al caricamento della pagina
window.addEventListener('DOMContentLoaded', () => {
  const autoTema = localStorage.getItem('temaAuto') === 'true';
  temaAutoCheckbox.checked = autoTema;

  aggiornaStatoSelettoreTema();

  let temaSalvato = localStorage.getItem('temaApp') || 'chiaro';

  if (autoTema) {
    temaSalvato = èNotte() ? 'scuro' : 'chiaro';
  }

  temaSelect.value = temaSalvato;
  applicaTema(temaSalvato);
});

// Quando si cambia manualmente il tema
temaSelect.addEventListener('change', function () {
  localStorage.setItem('temaAuto', 'false'); // disattiva automatico se cambio manuale
  temaAutoCheckbox.checked = false;
  aggiornaStatoSelettoreTema();
  applicaTema(this.value);
});

// Quando si attiva/disattiva il tema automatico
temaAutoCheckbox.addEventListener('change', function () {
  localStorage.setItem('temaAuto', this.checked);
  aggiornaStatoSelettoreTema();

  // Applica subito il tema senza ricaricare la pagina
  let temaDaApplicare;
  if (this.checked) {
    temaDaApplicare = èNotte() ? 'scuro' : 'chiaro';
  } else {
    temaDaApplicare = temaSelect.value;
  }
  applicaTema(temaDaApplicare);
});



// 📢 Notifiche
const notificheCheckbox = document.getElementById("notifiche-checkbox");
if (localStorage.getItem("notifiche") === "true") {
    notificheCheckbox.checked = true;
}
notificheCheckbox.addEventListener("change", function () {
    localStorage.setItem("notifiche", this.checked);
    if (this.checked) {
        Notification.requestPermission().then((perm) => {
            if (perm !== "granted") {
                alert("Le notifiche non sono state autorizzate");
                notificheCheckbox.checked = false;
                localStorage.setItem("notifiche", false);
            }
        });
    }
});

// 🔠 Dimensione testo
const dimensioneTestoRange = document.getElementById("dimensione-testo");
if (localStorage.getItem("dimensioneTesto")) {
    dimensioneTestoRange.value = localStorage.getItem("dimensioneTesto");
    document.body.style.fontSize = dimensioneTestoRange.value + "rem";
}
dimensioneTestoRange.addEventListener("input", function () {
    document.body.style.fontSize = this.value + "rem";
    localStorage.setItem("dimensioneTesto", this.value);
});
