// Selettore del bottone installazione (assicurati di avere un <button id="btnInstall"> nel tuo HTML)
const installBtn = document.getElementById('btnInstall');

let deferredPrompt = null;

// Rileva Android e mostra il pulsante quando possibile
window.addEventListener('beforeinstallprompt', (e) => {
  //alert('L’app può essere installata facendo clic sul banner');
  //e.preventDefault();  // Blocca il popup automatico
  //console.log('Evento beforeinstallprompt ricevuto', e); // Debug
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'block';
});

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  if (installBtn) installBtn.style.display = 'none';
}

// Gestione click sul pulsante per mostrare la richiesta di installazione
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('App installata con successo');
    } else {
      console.log('Installazione rifiutata');
    }

    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

// Nascondi il pulsante se l'app è già installata
window.addEventListener('appinstalled', () => {
  console.log('App già installata');
  if (installBtn) installBtn.style.display = 'none';
});

// Funzione per mostrare messaggio guida su iOS Safari
function showIosInstallMessage() {
  const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isInStandalone = window.navigator.standalone === true;

  if (isIos && !isInStandalone) {
    let msg = document.getElementById('ios-install-msg');

    // Se il messaggio non esiste, crealo
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'ios-install-msg';
      msg.innerHTML = `
        📱 Per installare l'app: tocca il pulsante <b>Condividi</b> in Safari e scegli <b>"Aggiungi a Home"</b>.
      `;
      

      // Aggiungi evento click per nascondere il messaggio
      msg.addEventListener('click', () => {
        msg.style.display = 'none';
      });

      document.body.appendChild(msg);
    }

    // Funzione per mostrare il messaggio
    function mostraMessaggio() {
      msg.style.display = 'block';
    }

    // Mostra il messaggio dopo 5 secondi
    setTimeout(() => {
      mostraMessaggio();

      // Imposta un intervallo per farlo ricomparire ciclicamente ogni 20 secondi,
      // solo se è nascosto (es. se l’utente ha cliccato)
      setInterval(() => {
        if (msg.style.display === 'none') {
          mostraMessaggio();
        }
      }, 20000);

    }, 5000);
  }
}

window.addEventListener('load', showIosInstallMessage);












