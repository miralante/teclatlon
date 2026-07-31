/* ==========================================================================
   Teclatlon — Internationalization (i18n)
   Exposes window.App.i18n. Load AFTER utils.js and BEFORE tts.js/feedback.js.
   Standard order: utils.js -> i18n.js -> tts.js -> storage.js -> feedback.js ->
   conditional load of strings.<locale>.js -> data.js -> app.js.

   Active language: localStorage 'teclatlon:locale' if supported; otherwise
   detected from navigator.language ('en' prefix -> 'en', anything else -> 'es').

   Texts are split by language: strings.es.js, strings.en.js. Only the
   active locale's file is loaded (saves bandwidth, simpler maintenance).
   Each file calls App.i18n.register({key: 'text', ...}, 'es'|'en').
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var CLAVE_LOCALE = 'teclatlon:locale';
  var SOPORTADOS = ['es', 'en'];
  var POR_DEFECTO = 'es';

  var DICT = {
    es: {
      core: {
        back: '← Volver',
        understood: 'Entendido',
        listen: '🔊 Escuchar',
        listenInstructions: 'Escuchar las instrucciones',
        listenText: 'Escuchar el texto',
        rest: '¡Llevas un buen rato! Puedes descansar si quieres.',
        dataProtection: 'Teclatlon no recolecta datos'
      },
      feedback: {
        success: ['¡Muy bien!', '¡Genial!', '¡Lo has conseguido!', '¡Estupendo!', '¡Sigue así!'],
        encourage: ['Casi. ¡Inténtalo otra vez!', 'No pasa nada. ¡Otra vez!', 'Prueba de nuevo. ¡Tú puedes!']
      }
    },
    en: {
      core: {
        back: '← Back',
        understood: 'Got it',
        listen: '🔊 Listen',
        listenInstructions: 'Listen to the instructions',
        listenText: 'Listen to the text',
        rest: 'You have been playing a while! You can rest if you want.',
        dataProtection: 'Teclatlon does not collect data'
      },
      feedback: {
        success: ['Well done!', 'Great!', 'You got it!', 'Fantastic!', 'Keep it up!'],
        encourage: ['Almost. Try again!', "That's okay. Try again!", 'Try once more. You can do it!']
      }
    }
  };

  function detectar() {
    try {
      var idiomas = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ''];
      for (var i = 0; i < idiomas.length; i++) {
        var prefijo = (idiomas[i] || '').slice(0, 2).toLowerCase();
        if (SOPORTADOS.indexOf(prefijo) !== -1) return prefijo;
      }
    } catch (e) { /* ignore */ }
    return POR_DEFECTO;
  }

  function locale() {
    try {
      var guardado = localStorage.getItem(CLAVE_LOCALE);
      if (guardado && SOPORTADOS.indexOf(guardado) !== -1) return guardado;
    } catch (e) { /* ignore */ }
    return detectar();
  }

  function setLocale(loc) {
    if (SOPORTADOS.indexOf(loc) === -1) return;
    try {
      localStorage.setItem(CLAVE_LOCALE, loc);
    } catch (e) { /* ignore */ }
    location.reload();
  }

  function lang() {
    return locale() === 'en' ? 'en-US' : 'es-ES';
  }

  /**
   * Merges texts into the internal dictionary.
   *
   * Two backward-compatible signatures:
   *  1. Multi-file (recommended): App.i18n.register(dict, locale)
   *       Loads only the active language. E.g.: App.i18n.register({title: 'Teclado', ...}, 'es');
   *  2. Legacy (single file with both languages): App.i18n.register({es: {...}, en: {...}})
   *       Registers into every locale present in the dict.
   */
  function register(dict, locale) {
    if (typeof locale === 'string') {
      if (SOPORTADOS.indexOf(locale) === -1) return;
      if (!dict || typeof dict !== 'object') return;
      DICT[locale] = DICT[locale] || {};
      for (var clave in dict) {
        if (Object.prototype.hasOwnProperty.call(dict, clave)) {
          DICT[locale][clave] = dict[clave];
        }
      }
      return;
    }
    SOPORTADOS.forEach(function (loc) {
      if (!dict[loc]) return;
      DICT[loc] = DICT[loc] || {};
      for (var clave in dict[loc]) {
        if (Object.prototype.hasOwnProperty.call(dict[loc], clave)) {
          DICT[loc][clave] = dict[loc][clave];
        }
      }
    });
  }

  function buscar(dictLoc, key) {
    var partes = key.split('.');
    var actual = dictLoc;
    for (var i = 0; i < partes.length; i++) {
      if (actual == null) return undefined;
      actual = actual[partes[i]];
    }
    return actual;
  }

  function t(key) {
    var loc = locale();
    var valor = buscar(DICT[loc], key);
    if (valor === undefined && loc !== POR_DEFECTO) {
      valor = buscar(DICT[POR_DEFECTO], key);
    }
    if (valor === undefined) return key;
    if (Array.isArray(valor)) return valor.join(', ');
    return valor;
  }

  function pick(key) {
    var loc = locale();
    var valor = buscar(DICT[loc], key);
    if (!Array.isArray(valor) && loc !== POR_DEFECTO) {
      valor = buscar(DICT[POR_DEFECTO], key);
    }
    if (!Array.isArray(valor) || !valor.length) return '';
    return valor[Math.floor(Math.random() * valor.length)];
  }

  function apply(root) {
    root = root || document;
    var nodos = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodos.length; i++) {
      nodos[i].textContent = t(nodos[i].getAttribute('data-i18n'));
    }
    var ariaNodos = root.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < ariaNodos.length; j++) {
      ariaNodos[j].setAttribute('aria-label', t(ariaNodos[j].getAttribute('data-i18n-aria')));
    }
    var tituloClave = document.documentElement.getAttribute('data-i18n-title');
    if (tituloClave) {
      document.title = t(tituloClave) + ' | Teclatlon';
    }
  }

  function inicio() {
    document.documentElement.lang = locale();
    apply(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicio);
  } else {
    inicio();
  }

  window.App.i18n = {
    SOPORTADOS: SOPORTADOS,
    POR_DEFECTO: POR_DEFECTO,
    locale: locale,
    setLocale: setLocale,
    lang: lang,
    register: register,
    t: t,
    pick: pick,
    apply: apply
  };
})();
