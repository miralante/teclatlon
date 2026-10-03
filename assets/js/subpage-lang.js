/* Teclatlon · language selector for the standalone subpages
   (about/, legal/, team/).

   External file for the same CSP reason as locale-picker-config.js: the
   wiring used to sit in an inline <script> on each subpage and was
   blocked in production, so both language buttons were dead and their
   aria-pressed stayed on "false" (nothing showed which language was
   active). One shared file replaces the three identical copies.

   Load AFTER assets/js/i18n.js, which defines window.App.i18n. */
(function () {
  'use strict';
  var es = document.getElementById('btnLangEs');
  var en = document.getElementById('btnLangEn');
  if (!es || !en) return;

  function paint() {
    var active = App.i18n.locale();
    es.setAttribute('aria-pressed', String(active === 'es'));
    en.setAttribute('aria-pressed', String(active === 'en'));
  }

  es.addEventListener('click', function () { App.i18n.setLocale('es'); });
  en.addEventListener('click', function () { App.i18n.setLocale('en'); });
  paint();
})();
