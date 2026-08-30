/* ==========================================================================
   Teclatlon · Internationalization (i18n)
   Exposes window.App.i18n. Load AFTER utils.js and BEFORE tts.js/feedback.js.
   Standard order: utils.js -> i18n.js -> tts.js -> storage.js -> feedback.js
   -> strings.es.js -> strings.en.js -> data.js -> app.js.

   Active language: localStorage 'teclatlon:locale' if supported; otherwise
   detected from navigator.language (first 2-letter prefix in SUPPORTED,
   fallback `es`, the source of truth).

   Each strings.<locale>.js calls App.i18n.register({key: 'text', ...}, 'es'|'en').
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var LOCALE_KEY = 'teclatlon:locale';
  var SUPPORTED = ['es', 'en'];
  var DEFAULT_LOCALE = 'es';
  /* BCP47 mapping for speechSynthesis voices. Add a new entry for each
     locale in SUPPORTED. Falls back to DEFAULT_LOCALE if a language
     isn't listed. */
  var BCP47 = { es: 'es-ES', en: 'en-US' };

  var DICT = {
    es: {
      core: {
        back: '← Volver',
        close: 'Cerrar',
        next: 'Siguiente →',
        save: 'Guardar',
        cancel: 'Cancelar',
        understood: 'Entendido',
        listen: '🔊 Escuchar',
        listenInstructions: 'Escuchar las instrucciones',
        listenText: 'Escuchar el texto',
        rest: '¡Llevas un buen rato! Puedes descansar si quieres.',
        loading: 'Cargando…',
        dataProtection: 'Teclatlon no recolecta datos',
        otraAppLinkHint: 'Se abre en otra aplicación, en una pestaña nueva.',
        apptonomiaNombre: 'Apptonomia',
        calculiaNombre: 'Calculia',
        okeymoneyNombre: 'Okeymoney',
        sinonimiaNombre: 'Sinonimia'
      },
      feedback: {
        success: ['¡Muy bien!', '¡Genial!', '¡Lo has conseguido!', '¡Estupendo!', '¡Sigue así!'],
        encourage: ['Casi. ¡Inténtalo otra vez!', 'No pasa nada. ¡Otra vez!', 'Prueba de nuevo. ¡Tú puedes!']
      }
    },
    en: {
      core: {
        back: '← Back',
        close: 'Close',
        next: 'Next →',
        save: 'Save',
        cancel: 'Cancel',
        understood: 'Got it',
        listen: '🔊 Listen',
        listenInstructions: 'Listen to the instructions',
        listenText: 'Listen to the text',
        rest: 'You have been playing a while! You can rest if you want.',
        loading: 'Loading…',
        dataProtection: 'Teclatlon does not collect data',
        otraAppLinkHint: 'Opens another app, in a new tab.',
        apptonomiaNombre: 'Apptonomia',
        calculiaNombre: 'Calculia',
        okeymoneyNombre: 'Okeymoney',
        sinonimiaNombre: 'Sinonimia'
      },
      feedback: {
        success: ['Well done!', 'Great!', 'You got it!', 'Fantastic!', 'Keep it up!'],
        encourage: ['Almost. Try again!', "That's okay. Try again!", 'Try once more. You can do it!']
      }
    }
  };

  function detect() {
    try {
      var langs = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ''];
      for (var i = 0; i < langs.length; i++) {
        var prefix = (langs[i] || '').slice(0, 2).toLowerCase();
        if (SUPPORTED.indexOf(prefix) !== -1) return prefix;
      }
    } catch (e) { /* ignore */ }
    return DEFAULT_LOCALE;
  }

  function locale() {
    try {
      var saved = localStorage.getItem(LOCALE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* ignore */ }
    return detect();
  }

  function setLocale(loc) {
    if (SUPPORTED.indexOf(loc) === -1) return;
    try {
      localStorage.setItem(LOCALE_KEY, loc);
    } catch (e) { /* ignore */ }
    location.reload();
  }

  function lang() {
    return BCP47[locale()] || BCP47[DEFAULT_LOCALE];
  }

  /** Merges one language's texts into the internal dictionary.
      App.i18n.register({title: 'Mi dinero', ...}, 'es'); */
  function register(dict, loc) {
    if (SUPPORTED.indexOf(loc) === -1 || !dict || typeof dict !== 'object') return;
    DICT[loc] = DICT[loc] || {};
    for (var key in dict) {
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        DICT[loc][key] = dict[key];
      }
    }
  }

  function lookup(dictForLocale, key) {
    var parts = key.split('.');
    var current = dictForLocale;
    for (var i = 0; i < parts.length; i++) {
      if (current == null) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  function t(key) {
    var loc = locale();
    var value = lookup(DICT[loc], key);
    if (value === undefined && loc !== DEFAULT_LOCALE) {
      value = lookup(DICT[DEFAULT_LOCALE], key);
    }
    if (value === undefined) return key;
    if (Array.isArray(value)) return value.join(', ');
    return value;
  }

  function pick(key) {
    var loc = locale();
    var value = lookup(DICT[loc], key);
    if (!Array.isArray(value) && loc !== DEFAULT_LOCALE) {
      value = lookup(DICT[DEFAULT_LOCALE], key);
    }
    if (!Array.isArray(value) || !value.length) return '';
    return value[Math.floor(Math.random() * value.length)];
  }

  function apply(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var ariaNodes = root.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < ariaNodes.length; j++) {
      ariaNodes[j].setAttribute('aria-label', t(ariaNodes[j].getAttribute('data-i18n-aria')));
    }
    var titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) {
      document.title = t(titleKey) + ' | Teclatlon';
    }
  }

  function init() {
    document.documentElement.lang = locale();
    apply(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.App.i18n = {
    SUPPORTED: SUPPORTED,
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    locale: locale,
    setLocale: setLocale,
    lang: lang,
    register: register,
    t: t,
    pick: pick,
    apply: apply
  };

  /* ---- language selector metadata (drives the index.html button list) ----
     LABEL is the visible text on the language button, FLAG is the emoji
     shown before it. Add a new entry per locale in SUPPORTED. */
  var LABEL = { es: 'Español', en: 'English' };
  var FLAG = { es: '🇪🇸', en: '🇬🇧' };

  /* Expose for the language selector (rendered by index.html /
     app.js). Read-only at runtime; extend these maps when adding a
     supported language. */
  window.App.i18n.LABEL = LABEL;
  window.App.i18n.FLAG = FLAG;
})();
