/* =====================================================================
   I.E.E. Melitón Carvajal — interacciones (sin librerías)
   Menú móvil · header al hacer scroll · animaciones al aparecer ·
   sliders · comunicado flotante
   ===================================================================== */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.mobile-toggle');
  var nav = document.getElementById('top-menu-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- Header compacto al hacer scroll ---------- */
  var ticking = false;
  function onScroll() {
    document.body.classList.toggle('scrolled', window.scrollY > 40);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Animaciones al aparecer en pantalla ---------- */
  var items = document.querySelectorAll('[data-reveal]');
  // escalonado: cada elemento de una misma fila entra un poco después
  document.querySelectorAll('.et_pb_row').forEach(function (row) {
    var i = 0;
    row.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.setProperty('--d', Math.min(i * 0.12, 0.6) + 's');
      i++;
    });
  });
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Sliders ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.et_pb_slides');
    var slides = Array.prototype.slice.call(track.children);
    var dotsBox = slider.querySelector('.et-pb-controllers');
    var prev = slider.querySelector('.et-pb-arrow-prev');
    var next = slider.querySelector('.et-pb-arrow-next');
    var n = slides.length, i = 0, timer = null;
    if (n < 2) { prev.hidden = next.hidden = true; if (slides[0]) slides[0].classList.add('is-active'); return; }
    var dots = slides.map(function (_, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir a la diapositiva ' + (k + 1));
      b.addEventListener('click', function () { go(k); restart(); });
      dotsBox.appendChild(b);
      return b;
    });
    function go(k) {
      i = (k + n) % n;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      slides.forEach(function (s, j) {
        s.classList.toggle('is-active', j === i);
        s.setAttribute('aria-hidden', j === i ? 'false' : 'true');
        s.querySelectorAll('a').forEach(function (a) { a.tabIndex = j === i ? 0 : -1; });
      });
      dots.forEach(function (d, j) { d.setAttribute('aria-current', j === i ? 'true' : 'false'); });
    }
    function restart() {
      clearInterval(timer);
      if (!reduce) timer = setInterval(function () { go(i + 1); }, 7000);
    }
    prev.addEventListener('click', function () { go(i - 1); restart(); });
    next.addEventListener('click', function () { go(i + 1); restart(); });
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', restart);
    var x0 = null;
    slider.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
      x0 = null;
    });
    go(0); restart();
  });

  /* ---------- Comunicado flotante ---------- */
  var modal = document.getElementById('comunicado');
  if (modal && modal.getAttribute('data-activo') === 'si') {
    var hasta = modal.getAttribute('data-hasta');
    var vencido = false;
    if (hasta) {
      var fin = new Date(hasta + 'T23:59:59');
      vencido = !isNaN(fin) && new Date() > fin;
    }
    var unaVez = modal.getAttribute('data-mostrar') === 'una-vez';
    var visto = false;
    try { visto = unaVez && sessionStorage.getItem('comunicadoVisto') === '1'; } catch (e) {}
    if (!vencido && !visto) {
      var caja = modal.querySelector('.comunicado-caja');
      var cerrarBtn = modal.querySelector('.comunicado-cerrar');
      var lastFocus = null;
      var abrir = function () {
        lastFocus = document.activeElement;
        modal.hidden = false;
        document.body.classList.add('modal-open');
        requestAnimationFrame(function () { modal.classList.add('is-open'); });
        cerrarBtn.focus();
        try { if (unaVez) sessionStorage.setItem('comunicadoVisto', '1'); } catch (e) {}
      };
      var cerrar = function () {
        modal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
        setTimeout(function () { modal.hidden = true; }, reduce ? 0 : 350);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      };
      // Cerrar con la X
      cerrarBtn.addEventListener('click', cerrar);
      // Cerrar al hacer clic fuera del comunicado
      modal.addEventListener('click', function (e) { if (!caja.contains(e.target)) cerrar(); });
      // Cerrar con la tecla Esc
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) cerrar(); });
      // Mantener el foco dentro del comunicado
      modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var f = modal.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      // Si una imagen del comunicado no existe, se oculta
      modal.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('error', function () { img.style.display = 'none'; });
      });
      if (document.readyState === 'complete') setTimeout(abrir, 400);
      else window.addEventListener('load', function () { setTimeout(abrir, 400); });
    }
  }

  /* ---------- Año actual en el pie ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
