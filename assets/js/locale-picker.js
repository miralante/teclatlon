/* Apptonomia — locale picker (dropdown de siglas).
   Componente reutilizable para las 8 apps de la suite. Cada app lo
   incluye con UN solo cambio en su HTML:

     <div id="locale-picker"></div>
     <script src="assets/js/locale-picker.js" defer></script>

   El script se autobusca los archivos `js/strings.*.js` o
   `assets/js/strings.*.js` del directorio actual (cualquier ruta
   relativa donde estén las traducciones), descubre los idiomas
   disponibles y construye el dropdown dinámicamente.

   Funciona con CUALQUIER app de la suite:
   - Si la app expone `App.i18n.locale()` / `App.i18n.register(table, locale)`,
     el componente re-aplica las traducciones al cambiar (igual que el
     switcher de 2 botones que tenía cada app).
   - Si no, expone `window.LocalePicker.onChange(locale, nativeName)` y
     la app debe implementar su propio handler.

   Accesibilidad:
   - Botón con `aria-haspopup="listbox"`, `aria-expanded`, `aria-label`
     dinámico ("Idioma: Español").
   - Panel con `role="listbox"`, opciones con `role="option"` y
     `aria-selected`.
   - Cierre con Escape, click-fuera, o selección.
   - Foco se mantiene en el botón al cerrar.

   Visualmente:
   - Sigla en mayúsculas del locale activo + chevron pequeño.
   - Panel flotante debajo del botón, fondo claro, borde sutil.
   - Animación de entrada de 120 ms.

   Multi-idioma nativo: cada opción muestra el nombre del idioma en
   SU PROPIO idioma ("Español" para es, "English" para en, etc.) —
   no se traduce a la locale activa, porque entonces perdería
   identidad visual al cambiar. */
(function () {
  'use strict';

  /* ============================================================
     Configuración inyectable.
     Cada app puede sobreescribir ANTES de cargar este script:
       <script>window.LocalePickerConfig = { storageKey: 'miapp:locale', path: 'assets/js/strings' };</script>
     `path: null` (o `path: ''`) desactiva el descubrimiento por HEAD
     (modo "skip discovery") — útil para apps con strings inline.
     ============================================================ */
  var cfg = window.LocalePickerConfig || {};
  var STORAGE_KEY = cfg.storageKey || 'apptonomia:locale';
  var STRINGS_PATH = cfg.path !== undefined ? cfg.path : 'js/strings';
  var LOCALE_LABELS = cfg.localeLabels || null; // override opcional
  var ON_CHANGE = cfg.onChange || null; // callback custom si no usa App.i18n
  var DEFAULT_LOCALE = cfg.defaultLocale || 'es';

  /* Mapa de etiquetas nativas (cómo se llama cada idioma en sí
     mismo). Si la app pasa su propio `localeLabels`, se usa ese;
     si no, usamos este fallback para los locales comunes. */
  var NATIVE_LABELS = LOCALE_LABELS || {
    es: 'Español',
    en: 'English',
    ca: 'Català',
    gl: 'Galego',
    eu: 'Euskara',
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    nl: 'Nederlands',
    pl: 'Polski',
    ru: 'Русский',
    zh: '中文',
    ja: '日本語',
    ar: 'العربية',
  };

  /* ============================================================
     Descubrimiento de locales disponibles.
     Estrategia: hacer fetch en HEAD sobre archivos `strings.<locale>.js`
     en la ruta STRINGS_PATH. Si el archivo existe (200), ese locale
     está disponible. Si da 404, no.
     Si STRINGS_PATH es null/falsy (modo "skip discovery"), usamos
     directamente NATIVE_LABELS sin hacer ningún fetch. Esto es lo que
     usan apps como sinonimia que guardan sus strings inline en
     js/i18n.js en vez de un archivo por locale.
     ============================================================ */
  var COMMON_LOCALES = ['es', 'en', 'ca', 'gl', 'eu', 'pt', 'fr', 'de', 'it'];

  function discoverLocales(cb) {
    if (!STRINGS_PATH) {
      /* Modo "skip discovery": usamos la lista de locales que la app
         pasó explícitamente (requiredLocales), o caemos al
         fallback de NATIVE_LABELS. */
      cb(cfg.requiredLocales || Object.keys(NATIVE_LABELS));
      return;
    }
    var found = [];
    var pending = COMMON_LOCALES.length;
    COMMON_LOCALES.forEach(function (loc) {
      var url = STRINGS_PATH + '.' + loc + '.js';
      fetch(url, { method: 'HEAD' }).then(function (r) {
        if (r.ok) found.push(loc);
        if (--pending === 0) cb(found.sort());
      }).catch(function () {
        if (--pending === 0) cb(found.sort());
      });
    });
  }

  /* ============================================================
     Render del dropdown.
     ============================================================ */
  function buildUI(locales, activeLocale) {
    var root = document.getElementById('locale-picker');
    if (!root) return;

    var active = locales.indexOf(activeLocale) !== -1 ? activeLocale : locales[0];
    var activeLabel = NATIVE_LABELS[active] || active.toUpperCase();

    /* Botón trigger */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'locale-picker-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Idioma: ' + activeLabel);
    btn.innerHTML = '<span class="locale-picker-current">' + active.toUpperCase() + '</span>' +
                     '<svg class="locale-picker-chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">' +
                     '<path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
                     '</svg>';

    /* Panel */
    var panel = document.createElement('ul');
    panel.className = 'locale-picker-panel';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', 'Idiomas disponibles');

    locales.forEach(function (loc) {
      var label = NATIVE_LABELS[loc] || loc.toUpperCase();
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('data-locale', loc);
      if (loc === active) li.setAttribute('aria-selected', 'true');
      li.innerHTML = '<span class="locale-picker-sigla">' + loc.toUpperCase() + '</span>' +
                     '<span class="locale-picker-nombre">' + label + '</span>';
      panel.appendChild(li);
    });

    root.innerHTML = '';
    root.appendChild(btn);
    root.appendChild(panel);

    /* Eventos */
    btn.addEventListener('click', function () { toggle(panel, btn); });
    panel.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-locale]');
      if (!li) return;
      var chosen = li.getAttribute('data-locale');
      close(panel, btn);
      apply(chosen, active);
    });
    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) close(panel, btn);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(panel, btn);
    });
  }

  function open(panel, btn) {
    panel.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }
  function close(panel, btn) {
    panel.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }
  function toggle(panel, btn) {
    if (panel.classList.contains('is-open')) close(panel, btn);
    else open(panel, btn);
  }

  /* ============================================================
     Aplicar el locale elegido.
     Detecta automáticamente si la app tiene App.i18n (patrón
     apptonomia/memofun/teclatlon) o si necesita callback custom.
     ============================================================ */
  function apply(chosen, prev) {
    try { localStorage.setItem(STORAGE_KEY, chosen); } catch (e) {}

    /* 1) Si la app expone App.i18n.locale(), úsalo para re-aplicar
          las traducciones en caliente. */
    if (window.App && window.App.i18n && typeof window.App.i18n.locale === 'function') {
      /* Detección automática del método de cambio. Las apps de la
         suite exponen `set(loc)`, `setLocale(loc)` o simplemente
         recargan la página al cambiar. Cubrimos las tres formas. */
      var api = window.App.i18n;
      if (typeof api.set === 'function') {
        api.set(chosen);
      } else if (typeof api.setLocale === 'function') {
        api.setLocale(chosen);
      } else {
        /* Fallback genérico: emitir un CustomEvent. La app debe
           suscribirse si quiere reaccionar (ver ON_CHANGE abajo). */
        document.documentElement.lang = chosen;
        document.dispatchEvent(new CustomEvent('localechange', {
          detail: { locale: chosen, prev: prev }
        }));
      }
    }

    /* 2) Callback custom (para apps que no usan App.i18n). */
    if (typeof ON_CHANGE === 'function') {
      ON_CHANGE(chosen, NATIVE_LABELS[chosen] || chosen.toUpperCase());
    }

    /* 3) Reflejar el cambio en la UI del propio picker. */
    var btn = document.querySelector('.locale-picker-btn');
    if (btn) {
      btn.querySelector('.locale-picker-current').textContent = chosen.toUpperCase();
      btn.setAttribute('aria-label', 'Idioma: ' + (NATIVE_LABELS[chosen] || chosen.toUpperCase()));
    }
    document.querySelectorAll('.locale-picker-panel li[data-locale]').forEach(function (li) {
      var sel = li.getAttribute('data-locale') === chosen;
      li.setAttribute('aria-selected', sel ? 'true' : 'false');
    });
  }

  /* ============================================================
     Bootstrap: detectar locale actual y construir UI.
     La detección sigue el mismo orden que el bootstrap de la app:
       1) localStorage guardado
       2) prefix del navigator.language
       3) DEFAULT_LOCALE
     ============================================================ */
  function detectLocale() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {}
    var navLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    var prefix = navLang.slice(0, 2).toLowerCase();
    return prefix || DEFAULT_LOCALE;
  }

  function init() {
    var current = detectLocale();
    discoverLocales(function (locales) {
      if (locales.length === 0) {
        /* Fallback: si el fetch HEAD falla (file:// sin servidor), usar
           SOLO los locales hardcodeados que la app pasó en cfg o el
           fallback COMMON_LOCALES. Esto permite que el componente
           funcione también en previews locales. */
        locales = Object.keys(NATIVE_LABELS);
        if (cfg.requiredLocales) locales = cfg.requiredLocales;
      }
      buildUI(locales, current);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
