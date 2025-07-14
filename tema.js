// Funzione per applicare il tema scelto
function applicaTema(tema) {
  document.body.classList.remove('tema-scuro', 'tema-alto-contrasto');
  if (tema === 'scuro') {
    document.body.classList.add('tema-scuro');
  } else if (tema === 'alto-contrasto') {
    document.body.classList.add('tema-alto-contrasto');
  }
  localStorage.setItem('temaApp', tema);
}

// Quando seleziono un nuovo tema dal menu a tendina
document.getElementById('tema-select').addEventListener('change', function () {
  applicaTema(this.value);
});

// Al caricamento, applica il tema salvato
window.addEventListener('DOMContentLoaded', () => {
  const temaSalvato = localStorage.getItem('temaApp') || 'chiaro';
  document.getElementById('tema-select').value = temaSalvato;
  applicaTema(temaSalvato);
});
