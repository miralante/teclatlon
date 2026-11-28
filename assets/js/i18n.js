/* ==========================================================================
   Teclatlon · Internationalization (i18n)
   Exposes window.App.i18n. Load AFTER utils.js and BEFORE tts.js/feedback.js.
   Standard order: utils.js -> i18n.js -> tts.js -> storage.js -> feedback.js
   -> strings.es.js -> strings.en.js -> data.js -> app.js.

   Active language: localStorage 'teclatlon:locale' if supported; otherwise
   detected from navigator.language (first 2-letter prefix in SUPPORTED,
   fallback `en`, the source of truth).

   Each strings.<locale>.js calls App.i18n.register({key: 'text', ...}, 'es'|'en').
   ========================================================================== */

(function () {
  "use strict";

  window.App = window.App || {};

  var STORAGE_KEY = "teclatlon:locale";
  var SUPPORTED = ["es", "en"];
  var DEFAULT_LOCALE = "en";
  var BCP47 = { es: "es-ES", en: "en-US" };
  var TITLE_SUFFIX = " | Teclatlon";
  var TEXT_FIELDS = {
    titulo: 1, texto: 1, aviso: 1, avisoSeguro: 1,
    confirmacion: 1, regla: 1, contacto: 1, relacion: 1
  };

  /* Built-in shell strings. strings.<locale>.js may override any of them:
     register() deep-merges over this table. */
  var DICT = {
    es: {
      core: {
        back: 'Menú de Teclatlon',
        close: 'Cerrar',
        next: 'Siguiente →',
        save: 'Guardar',
        cancel: 'Cancelar',
        understood: 'Entendido',
        listen: '🔊 Escuchar',
        listenInstructions: 'Escuchar las instrucciones',
        listenText: 'Escuchar el texto',
        rest: '¡Llevas un buen rato! Puedes descansar si quieres.',
        restContinue: 'Seguir',
        moreGoal: 'A por más',
        starEarned: '¡Has conseguido la estrella!',
        loading: 'Cargando…',
        chrome: { appName: 'Teclatlon' },
        dataProtection: 'Teclatlon no recolecta datos',
        config: 'Configuración',
        aboutApp: 'Sobre la App',
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
        back: 'Teclatlon menu',
        close: 'Close',
        next: 'Next →',
        save: 'Save',
        cancel: 'Cancel',
        understood: 'Got it',
        listen: '🔊 Listen',
        listenInstructions: 'Listen to the instructions',
        listenText: 'Listen to the text',
        rest: 'You have been playing a while! You can rest if you want.',
        restContinue: 'Keep going',
        moreGoal: 'Go for more',
        starEarned: 'You got the star!',
        loading: 'Loading…',
        chrome: { appName: 'Teclatlon' },
        dataProtection: 'Teclatlon does not collect data',
        config: 'Settings',
        aboutApp: 'About the App',
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
      var first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
      var prefix = first.split(/[-_]/)[0].toLowerCase();
      if (SUPPORTED.indexOf(prefix) !== -1) return prefix;
    } catch (e) { /* ignore */ }
    return DEFAULT_LOCALE;
  }

  /* Optional resolvers, checked before ?lang, storage and the browser. An app
     whose language lives somewhere else (sinonimia: the URL hash) adds one with
     App.i18n.addResolver(fn); fn returns 'es', 'en' or anything else. */
  var RESOLVERS = [];

  function urlLocale() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;
    } catch (e) { /* old browser: ignore */ }
    return null;
  }

  function locale() {
    for (var r = 0; r < RESOLVERS.length; r++) {
      try {
        var found = RESOLVERS[r]();
        if (SUPPORTED.indexOf(found) !== -1) return found;
      } catch (e) { /* a resolver that throws is skipped */ }
    }
    var fromUrl = urlLocale();
    if (fromUrl) return fromUrl;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* storage may be off */ }
    return detect();
  }

  function setLocale(loc) {
    if (SUPPORTED.indexOf(loc) === -1) return;
    try { localStorage.setItem(STORAGE_KEY, loc); } catch (e) { /* ignore */ }
    window.location.reload();
  }

  function addResolver(fn) {
    if (typeof fn === "function") RESOLVERS.push(fn);
  }

  function lang() {
    return BCP47[locale()] || BCP47[DEFAULT_LOCALE];
  }

  /* Deep merge, so several files (a page's own strings and the app's shared
     strings) can register keys under the same branch. */
  function merge(into, from) {
    for (var key in from) {
      if (!Object.prototype.hasOwnProperty.call(from, key)) continue;
      var value = from[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (!into[key] || typeof into[key] !== "object") into[key] = {};
        merge(into[key], value);
      } else {
        into[key] = value;
      }
    }
  }

  /* Two signatures:
       register(table, "es" | "en")     one locale per file (the standard)
       register({ es: {...}, en: {...} })  both locales in one call (legacy) */
  function register(table, loc) {
    if (typeof loc !== "string") {
      if (!table || typeof table !== "object") return;
      SUPPORTED.forEach(function (l) { if (table[l]) merge(DICT[l], table[l]); });
      return;
    }
    if (SUPPORTED.indexOf(loc) === -1 || !table || typeof table !== "object") return;
    merge(DICT[loc], table);
  }

  function lookup(table, key) {
    var parts = key.split(".");
    var current = table;
    for (var i = 0; i < parts.length; i++) {
      if (current == null) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  function raw(key) {
    if (typeof key !== "string") return undefined;
    var loc = locale();
    var value = lookup(DICT[loc], key);
    if (value === undefined && loc !== DEFAULT_LOCALE) value = lookup(DICT[DEFAULT_LOCALE], key);
    return value;
  }

  /* params (optional): replaces each {name} with params.name; a placeholder
     without a value is left as it is. */
  function t(key, params) {
    var value = raw(key);
    if (value === undefined || value === null) {
      if (window.console && console.warn) console.warn("[i18n] missing key:", key, "(locale=" + locale() + ")");
      return "";
    }
    if (Array.isArray(value)) value = value.join(", ");
    value = String(value);
    if (params) {
      value = value.replace(/\{(\w+)\}/g, function (mark, name) {
        return params[name] !== undefined ? String(params[name]) : mark;
      });
    }
    return value;
  }

  /* A random entry of an array key (e.g. feedback.success). */
  function pick(key) {
    var value = raw(key);
    if (!Array.isArray(value) || !value.length) return "";
    return value[Math.floor(Math.random() * value.length)];
  }

  /* The noun that follows a star count: "1 estrella", "2 estrellas". */
  function starsWord(count) {
    return t(Number(count) === 1 ? "core.starOne" : "core.starOther");
  }

  /* Structured data trees (escenarios, variantes, pasos...) are returned as
     they are, not flattened: register them with register({data: {...}}, loc)
     and read them with App.i18n.data("data"). */
  function data(key) {
    return raw(key);
  }

  /* Locale-neutral structure (ids, types, flags) registered once; the text
     for each locale is merged over it by dataByLocale(). */
  function registerStructure(structure) {
    SUPPORTED.forEach(function (loc) {
      DICT[loc].__structure__ = structure;
    });
  }

  /* Deep-merges structure + text: text fields (TEXT_FIELDS) come from the text
     tree when present; everything else stays in the structure side. */
  function mergeStructureAndText(structure, text) {
    if (!structure && !text) return null;
    if (!text) return structure;
    if (!structure) return text;
    if (Array.isArray(structure)) {
      return structure.map(function (item, i) {
        return mergeStructureAndText(item, Array.isArray(text) ? text[i] : null);
      });
    }
    if (typeof structure === "object") {
      var out = {};
      var keys = {};
      Object.keys(structure).forEach(function (k) { keys[k] = true; });
      Object.keys(text).forEach(function (k) { keys[k] = true; });
      Object.keys(keys).forEach(function (k) {
        var sVal = structure[k];
        var tVal = text[k];
        if (TEXT_FIELDS[k]) {
          out[k] = (tVal !== undefined) ? tVal : sVal;
        } else if (Array.isArray(sVal) || Array.isArray(tVal) || (sVal && typeof sVal === "object")) {
          out[k] = mergeStructureAndText(sVal, tVal);
        } else {
          out[k] = (tVal !== undefined) ? tVal : sVal;
        }
      });
      return out;
    }
    return text !== undefined ? text : structure;
  }

  /* Returns the per-locale data tree: { es: {...}, en: {...} }, rebuilt from
     the registered structure plus each locale's text tree. */
  function dataByLocale() {
    var out = {};
    SUPPORTED.forEach(function (loc) {
      var text = (DICT[loc] && DICT[loc].data) || null;
      var structure = DICT[loc] && DICT[loc].__structure__;
      out[loc] = mergeStructureAndText(structure, text);
    });
    return out;
  }

  function apply(root) {
    root = root || document;
    var i;
    var nodes = root.querySelectorAll("[data-i18n]");
    for (i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    var aria = root.querySelectorAll("[data-i18n-aria]");
    for (i = 0; i < aria.length; i++) aria[i].setAttribute("aria-label", t(aria[i].getAttribute("data-i18n-aria")));
    var meta = root.querySelectorAll("[data-i18n-meta]");
    for (i = 0; i < meta.length; i++) meta[i].setAttribute("content", t(meta[i].getAttribute("data-i18n-meta")));
    var titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey) + TITLE_SUFFIX;
  }

  /* applyTo("#selector") or applyTo(element): applies the bindings inside one
     part of the page (for example a block rendered after a round). */
  function applyTo(target) {
    apply(typeof target === "string" ? document.querySelector(target) : target);
  }

  function init() {
    document.documentElement.lang = locale();
    apply(document);
  }

  window.App.i18n = {
    SUPPORTED: SUPPORTED,
    DEFAULT_LOCALE: DEFAULT_LOCALE,
    STORAGE_KEY: STORAGE_KEY,
    locale: locale,
    setLocale: setLocale,
    lang: lang,
    register: register,
    addResolver: addResolver,
    registerStructure: registerStructure,
    t: t,
    pick: pick,
    data: data,
    dataByLocale: dataByLocale,
    apply: apply,
    applyTo: applyTo,
    starsWord: starsWord,
    LABEL: { es: "Español", en: "English" },
    FLAG: { es: "🇪🇸", en: "🇬🇧" }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
