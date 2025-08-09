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


// 📢 Notifiche
const notificheCheckbox = document.getElementById("notifiche-checkbox");

// Al caricamento imposta lo stato checkbox da localStorage
if (localStorage.getItem("notifiche") === "true") {
    notificheCheckbox.checked = true;
}

// Funzione helper per disiscrivere la push subscription
function unsubscribePush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    return navigator.serviceWorker.ready.then(registration => {
      return registration.pushManager.getSubscription().then(subscription => {
        if (subscription) {
          return subscription.unsubscribe();
        }
      });
    });
  }
  return Promise.resolve();
}

// Funzione helper per sottoscrivere le notifiche push
function subscribePush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    return navigator.serviceWorker.ready.then(registration => {
      // Sostituisci con la tua chiave pubblica VAPID in base64 URL-safe
      const vapidPublicKey = '<YOUR_PUBLIC_VAPID_KEY>';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    });
  }
  return Promise.reject('Push non supportate');
}

// Convertitore base64 URL-safe per VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

notificheCheckbox.addEventListener("change", function () {
  if (this.checked) {
    // Controlla stato permessi notifiche
    if (Notification.permission === 'granted') {
      // Già autorizzato: sottoscrivi push
      subscribePush()
        .then(() => {
          localStorage.setItem("notifiche", "true");
        })
        .catch(err => {
          alert("Errore sottoscrizione notifiche: " + err);
          notificheCheckbox.checked = false;
          localStorage.setItem("notifiche", "false");
        });
    } else if (Notification.permission === 'default') {
      // Richiedi permesso notifiche
      Notification.requestPermission().then(perm => {
        if (perm === "granted") {
          subscribePush()
            .then(() => {
              localStorage.setItem("notifiche", "true");
            })
            .catch(err => {
              alert("Errore sottoscrizione notifiche: " + err);
              notificheCheckbox.checked = false;
              localStorage.setItem("notifiche", "false");
            });
        } else {
          alert("Le notifiche non sono state autorizzate");
          notificheCheckbox.checked = false;
          localStorage.setItem("notifiche", "false");
        }
      });
    } else {
      // Permesso negato
      alert(
        "Hai negato le notifiche nelle impostazioni del browser.\n" +
        "Per riabilitarle, vai nelle impostazioni del browser e consenti le notifiche per questo sito."
      );
      notificheCheckbox.checked = false;
      localStorage.setItem("notifiche", "false");
    }
  } else {
    // Disattiva notifiche: cancella subscription e aggiorna localStorage
    unsubscribePush().then(() => {
      localStorage.setItem("notifiche", "false");
    }).catch(err => {
      console.error("Errore disiscrizione notifiche:", err);
    });
  }
});
