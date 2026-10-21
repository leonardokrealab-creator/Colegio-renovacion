/* =====================================================================
   Acordeón "Talleres Productivos" — comportamiento igual al de Divi:
   · siempre queda un taller abierto
   · al abrir uno, el anterior se cierra
   · apertura y cierre con animación de altura y desvanecido
   ===================================================================== */
(function () {
  'use strict';
  var DURACION = 600; // milisegundos
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animar(panel, abrir, done) {
    if (reduce) {
      panel.hidden = !abrir;
      if (done) done();
      return;
    }
    panel.hidden = false;
    var inicio = abrir ? 0 : panel.scrollHeight;
    var fin = abrir ? panel.scrollHeight : 0;
    panel.style.overflow = 'hidden';
    panel.style.height = inicio + 'px';
    panel.style.opacity = abrir ? '0' : '1';
    // forzar el estado inicial antes de animar
    panel.getBoundingClientRect();
    panel.style.transition = 'height ' + DURACION + 'ms cubic-bezier(.4,0,.2,1), opacity ' + DURACION + 'ms ease';
    panel.style.height = fin + 'px';
    panel.style.opacity = abrir ? '1' : '0';
    var terminado = false;
    function limpiar() {
      if (terminado) return;
      terminado = true;
      panel.style.transition = panel.style.height = panel.style.overflow = panel.style.opacity = '';
      if (!abrir) panel.hidden = true;
      if (done) done();
    }
    panel.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', handler);
      limpiar();
    });
    setTimeout(limpiar, DURACION + 100); // por si transitionend no se dispara
  }

  document.querySelectorAll('[data-accordion]').forEach(function (acc) {
    var items = Array.prototype.slice.call(acc.querySelectorAll('.et_pb_toggle'));
    var ocupado = false;

    function setEstado(item, abierto) {
      item.classList.toggle('et_pb_toggle_open', abierto);
      item.classList.toggle('et_pb_toggle_close', !abierto);
      item.querySelector('.et_pb_toggle_title').setAttribute('aria-expanded', abierto ? 'true' : 'false');
    }

    items.forEach(function (item) {
      var boton = item.querySelector('.et_pb_toggle_title');
      var panel = item.querySelector('.et_pb_toggle_content');
      boton.addEventListener('click', function () {
        if (ocupado || item.classList.contains('et_pb_toggle_open')) return; // como en Divi: el abierto no se cierra solo
        ocupado = true;
        var abierto = items.filter(function (o) { return o.classList.contains('et_pb_toggle_open'); })[0];
        if (abierto) {
          setEstado(abierto, false);
          animar(abierto.querySelector('.et_pb_toggle_content'), false);
        }
        setEstado(item, true);
        animar(panel, true, function () { ocupado = false; });
      });
      // Navegación con flechas del teclado entre títulos
      boton.addEventListener('keydown', function (e) {
        var idx = items.indexOf(item), dest = null;
        if (e.key === 'ArrowDown') dest = items[(idx + 1) % items.length];
        if (e.key === 'ArrowUp') dest = items[(idx - 1 + items.length) % items.length];
        if (dest) { e.preventDefault(); dest.querySelector('.et_pb_toggle_title').focus(); }
      });
    });
  });
})();