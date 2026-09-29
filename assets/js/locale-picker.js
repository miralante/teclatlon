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
  var DEFAULT_LOCALE = cfg.defaultLocale || 'en';
  var ENABLE_SETTINGS = cfg.settings !== false;
  var SETTINGS_KEY = cfg.settingsStorageKey || (STORAGE_KEY + ':accessibility');
  var SOUND_SETTINGS_KEY = cfg.soundStorageKey || 'miralante:sounds';
  var SETTINGS_HREF = cfg.settingsHref || '';
  var settingsState = null;
  var soundState = null;
  var baseRootFontSize = null;

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

    var active = locales.indexOf(activeLocale) !== -1 ? activeLocale
      : (locales.indexOf(DEFAULT_LOCALE) !== -1 ? DEFAULT_LOCALE : locales[0]);
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

    if (ENABLE_SETTINGS) buildSettings(root, active);

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

  /* ============================================================
     Shared accessibility settings.
     The gear lives next to the language picker on every suite app.
     Teclatlon opts out because its richer drawer is already part of
     that app's main screen. Other apps get the same small, focused
     panel: text size, high contrast, and a link to their full settings
     route when one exists.
     ============================================================ */
  var SETTINGS_COPY = {
    es: {
      title: 'Ajustes', close: 'Cerrar ajustes', textSize: 'Tamaño de letra',
      small: 'Pequeño', normal: 'Normal', large: 'Grande',
      contrast: 'Alto contraste', successSound: 'Sonido de acierto', errorSound: 'Sonido de error', more: 'Más ajustes', help: 'Se guarda en este dispositivo.'
    },
    en: {
      title: 'Settings', close: 'Close settings', textSize: 'Text size',
      small: 'Small', normal: 'Normal', large: 'Large',
      contrast: 'High contrast', successSound: 'Correct answer sound', errorSound: 'Error sound', more: 'More settings', help: 'Saved on this device.'
    }
  };

  function settingsLocale() {
    var loc = '';
    if (window.App && window.App.i18n && typeof window.App.i18n.locale === 'function') {
      loc = window.App.i18n.locale();
    }
    if (!loc) loc = document.documentElement.lang || DEFAULT_LOCALE;
    return String(loc).slice(0, 2).toLowerCase() === 'en' ? 'en' : 'es';
  }

  function loadSettings() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch (e) {}
    saved = saved && typeof saved === 'object' ? saved : {};
    return {
      textSize: ['small', 'normal', 'large'].indexOf(saved.textSize) !== -1 ? saved.textSize : 'normal',
      contrast: saved.contrast === true
    };
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState)); } catch (e) {}
  }

  function loadSoundSettings() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(SOUND_SETTINGS_KEY) || 'null'); } catch (e) {}
    saved = saved && typeof saved === 'object' ? saved : {};
    return { success: saved.success !== false, error: saved.error === true };
  }

  function saveSoundSettings() {
    try { localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(soundState)); } catch (e) {}
  }

  function applySettings() {
    var html = document.documentElement;
    if (baseRootFontSize === null) baseRootFontSize = parseFloat(window.getComputedStyle(html).fontSize) || 16;
    html.setAttribute('data-a11y-text', settingsState.textSize);
    html.setAttribute('data-a11y-contrast', settingsState.contrast ? 'high' : 'normal');
    html.style.fontSize = settingsState.textSize === 'normal'
      ? ''
      : (baseRootFontSize * (settingsState.textSize === 'large' ? 1.15 : 0.9)) + 'px';
    html.classList.toggle('high-contrast', settingsState.contrast && cfg.legacyContrastClass === true);
  }

  function renderSettings(drawer) {
    var copy = SETTINGS_COPY[settingsLocale()];
    drawer.querySelector('[data-settings-title]').textContent = copy.title;
    drawer.querySelector('[data-settings-close]').setAttribute('aria-label', copy.close);
    drawer.querySelector('[data-settings-size-label]').textContent = copy.textSize;
    drawer.querySelector('[data-settings-size-small]').textContent = copy.small;
    drawer.querySelector('[data-settings-size-normal]').textContent = copy.normal;
    drawer.querySelector('[data-settings-size-large]').textContent = copy.large;
    drawer.querySelector('[data-settings-contrast-label]').textContent = copy.contrast;
    drawer.querySelector('[data-settings-success-label]').textContent = copy.successSound;
    drawer.querySelector('[data-settings-error-label]').textContent = copy.errorSound;
    drawer.querySelector('[data-settings-help]').textContent = copy.help;
    var more = drawer.querySelector('[data-settings-more]');
    if (more) more.textContent = copy.more;
    drawer.querySelectorAll('[data-settings-size]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-settings-size') === settingsState.textSize));
    });
    var contrast = drawer.querySelector('[data-settings-contrast]');
    contrast.checked = settingsState.contrast;
    drawer.querySelector('[data-settings-success]').checked = soundState.success;
    drawer.querySelector('[data-settings-error]').checked = soundState.error;
  }

  function closeSettings(trigger, backdrop, drawer) {
    backdrop.classList.remove('is-open');
    drawer.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    window.setTimeout(function () { backdrop.hidden = true; drawer.hidden = true; }, 160);
    trigger.focus();
  }

  function buildSettings(root) {
    settingsState = loadSettings();
    soundState = loadSoundSettings();
    saveSoundSettings();
    applySettings();
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'locale-settings-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'accessibility-settings');
    trigger.setAttribute('aria-label', settingsLocale() === 'en' ? 'Settings' : 'Ajustes');
    trigger.textContent = '⚙️';
    root.appendChild(trigger);

    var backdrop = document.createElement('div');
    backdrop.className = 'locale-settings-backdrop';
    backdrop.hidden = true;
    var drawer = document.createElement('aside');
    drawer.id = 'accessibility-settings';
    drawer.className = 'locale-settings-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'accessibility-settings-title');
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="locale-settings-drawer-header">' +
        '<h2 id="accessibility-settings-title" data-settings-title></h2>' +
        '<button type="button" class="locale-settings-close" data-settings-close>✕</button>' +
      '</div>' +
      '<div class="locale-settings-drawer-body">' +
        '<div class="locale-settings-row"><span data-settings-size-label></span>' +
          '<div class="locale-settings-options" role="group">' +
            '<button type="button" data-settings-size="small" data-settings-size-small></button>' +
            '<button type="button" data-settings-size="normal" data-settings-size-normal></button>' +
            '<button type="button" data-settings-size="large" data-settings-size-large></button>' +
          '</div>' +
        '</div>' +
        '<label class="locale-settings-row locale-settings-check"><span data-settings-contrast-label></span>' +
          '<input type="checkbox" data-settings-contrast></label>' +
        '<label class="locale-settings-row locale-settings-check"><span data-settings-success-label></span>' +
          '<input type="checkbox" data-settings-success></label>' +
        '<label class="locale-settings-row locale-settings-check"><span data-settings-error-label></span>' +
          '<input type="checkbox" data-settings-error></label>' +
        (SETTINGS_HREF ? '<a class="locale-settings-more" data-settings-more href="' + SETTINGS_HREF + '"></a>' : '') +
        '<p class="locale-settings-help" data-settings-help></p>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    renderSettings(drawer);

    function open() {
      renderSettings(drawer);
      backdrop.hidden = false;
      drawer.hidden = false;
      window.requestAnimationFrame(function () {
        backdrop.classList.add('is-open');
        drawer.classList.add('is-open');
      });
      trigger.setAttribute('aria-expanded', 'true');
      drawer.querySelector('[data-settings-close]').focus();
    }
    trigger.addEventListener('click', open);
    drawer.querySelector('[data-settings-close]').addEventListener('click', function () {
      closeSettings(trigger, backdrop, drawer);
    });
    backdrop.addEventListener('click', function () { closeSettings(trigger, backdrop, drawer); });
    drawer.querySelectorAll('[data-settings-size]').forEach(function (button) {
      button.addEventListener('click', function () {
        settingsState.textSize = button.getAttribute('data-settings-size');
        saveSettings(); applySettings(); renderSettings(drawer);
      });
    });
    drawer.querySelector('[data-settings-contrast]').addEventListener('change', function (event) {
      settingsState.contrast = event.target.checked;
      saveSettings(); applySettings(); renderSettings(drawer);
    });
    drawer.querySelector('[data-settings-success]').addEventListener('change', function (event) {
      soundState.success = event.target.checked;
      saveSoundSettings(); renderSettings(drawer);
    });
    drawer.querySelector('[data-settings-error]').addEventListener('change', function (event) {
      soundState.error = event.target.checked;
      saveSoundSettings(); renderSettings(drawer);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !drawer.hidden) closeSettings(trigger, backdrop, drawer);
    });
    settingsState._refresh = function () { renderSettings(drawer); };
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
    if (settingsState && typeof settingsState._refresh === 'function') settingsState._refresh();
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
