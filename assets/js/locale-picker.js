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
   - Si no, la app registra `window.LocalePicker.onChange(locale,
     nativeName, prev)`. Se llama SIEMPRE, tenga o no `App.i18n`:
     hay páginas cuyo contenido no son tablas sino pares de bloques
     `[data-lang-block]` que se muestran u ocultan moviendo un
     atributo en <html> (las about/ legal/ config/ de sinonimia).

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
   identidad visual al cambiar.

   Cabecera: DOS controles y ninguno dentro del otro.
     · el desplegable de idioma, siempre visible en #locale-picker;
     · el ⚙️, su hermano inmediato a la derecha, que abre el cajón de
       accesibilidad (tema, tamaño de letra, alto contraste y, si la app
       tiene sonido, sus interruptores).
   El idioma NO vive dentro del cajón: llegar al idioma cuesta un clic,
   no dos. Es el modelo de Teclatlon, donde la app trae su propio cajón
   y este componente se limita al desplegable (`settings: false`).

   `languageInDrawer: true` invierte esa decisión para una app concreta:
   el desplegable se MUEVE al cajón compartido como primera fila y el ⚙️
   se queda solo en la cabecera. Es lo que hace Apptonomia, en la que el
   propio ⚙️ ES la configuración. Las demás apps siguen con el modelo de
   cabecera, que es el que construye este componente por defecto.

   El cajón NO lleva enlace "Más ajustes": cada proyecto tiene su propia
   ruta de ajustes en su navegación, y un segundo acceso al mismo sitio
   dentro de otro control era una configuración repetida. Por eso
   `settingsHref` ya no existe. */
(function () {
  'use strict';

  /* ============================================================
     Configuración inyectable.
     Cada app puede sobreescribir ANTES de cargar este script:
       <script>window.LocalePickerConfig = { storageKey: 'miapp:locale', path: 'assets/js/strings' };</script>
     `path: null` (o `path: ''`) desactiva el descubrimiento por HEAD
     (modo "skip discovery") — útil para apps con strings inline.
     ============================================================ */
  /* Punto de enganche público. Una página sin `App.i18n` registra aquí
     su manejador y el componente se lo llama en cada cambio de idioma
     (ver apply(), paso 2b). Antes este objeto no lo creaba nadie y el
     hook solo existía en el comentario de arriba. */
  window.LocalePicker = window.LocalePicker || {};
  var cfg = window.LocalePickerConfig || {};
  var STORAGE_KEY = cfg.storageKey || 'apptonomia:locale';
  var STRINGS_PATH = cfg.path !== undefined ? cfg.path : 'js/strings';
  var LOCALE_LABELS = cfg.localeLabels || null; // override opcional
  var ON_CHANGE = cfg.onChange || null; // callback custom si no usa App.i18n
  var DEFAULT_LOCALE = cfg.defaultLocale || 'en';
  var ENABLE_SETTINGS = cfg.settings !== false;
  /* `languageInDrawer: true` deja el desplegable DENTRO del cajón
     compartido, como su primera fila, y el ⚙️ solo en la cabecera. Por
     defecto (false) el idioma se queda en #locale-picker, junto al ⚙️,
     y llegar a él cuesta un clic en lugar de dos. */
  var LANGUAGE_IN_DRAWER = cfg.languageInDrawer === true;
  var SETTINGS_KEY = cfg.settingsStorageKey || (STORAGE_KEY + ':accessibility');
  var SOUND_SETTINGS_KEY = cfg.soundStorageKey || 'miralante:sounds';
  var SOUND_SETTINGS_ENABLED = cfg.soundSettings !== false;
  var settingsState = null;
  var soundState = null;
  var baseRootFontSize = null;
  /* Apps whose body copy is sized in px through --text-base (Apptonomia's
     landing) do not resize when only the root font-size moves, so they
     opt in and this component scales that token as well. */
  var TEXT_BASE_TOKEN = cfg.textBaseToken === true;
  var baseTextBaseSize = null;
  var textSizeIsExplicit = false;
  var _discoveredLocales = null;  /* populado por discoverLocales */
  var _activeLocale = null;        /* populado por discoverLocales */

  /* Mapa de etiquetas nativas (cómo se llama cada idioma en sí
     mismo). Si la app pasa su propio `localeLabels`, se usa ese;
     si no, usamos este fallback para los idiomas soportados. */
  var NATIVE_LABELS = LOCALE_LABELS || {
    es: 'Español',
    en: 'English'
  };

  /* ============================================================
     Descubrimiento de locales disponibles.
     Estrategia: comprobar en HEAD los archivos `strings.es.js` y
     `strings.en.js` en STRINGS_PATH. Solo esos dos idiomas están
     disponibles en la suite.
     Si STRINGS_PATH es null/falsy (modo "skip discovery"), usamos
     directamente NATIVE_LABELS sin hacer ningún fetch. Esto es lo que
     usan apps como sinonimia que guardan sus strings inline en
     js/i18n.js en vez de un archivo por locale.
     ============================================================ */
  var COMMON_LOCALES = ['es', 'en'];
  var SUPPORTED_LOCALES = ['es', 'en'];

  function filterSupportedLocales(locales) {
    return SUPPORTED_LOCALES.filter(function (loc) { return locales.indexOf(loc) !== -1; });
  }

  function discoverLocales(cb) {
    if (!STRINGS_PATH) {
      /* Modo "skip discovery": usamos la lista de locales que la app
         pasó explícitamente (requiredLocales), o caemos al
         fallback de NATIVE_LABELS. */
      cb(filterSupportedLocales(cfg.requiredLocales || SUPPORTED_LOCALES));
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
  /* Render del dropdown de idioma. Por defecto en la cabecera, dentro
     de #locale-picker: el idioma es un control de primer nivel, no un
     subapartado del cajón de ajustes. Con `languageInDrawer` ese mismo
     #locale-picker ya vive dentro del cajón y se construye ahí. */
  function buildUI(locales, activeLocale) {
    locales = filterSupportedLocales(locales);
    var root = document.getElementById('locale-picker');
    if (!root || !locales.length) return;

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
     The gear sits next to the language picker on the top right of
     the header, on every suite app. Its drawer holds ONLY the
     controls it is the only entry point for: theme, text size, high
     contrast and — where the app has sounds — their switches.
     The language is not repeated in here, and there is no "more
     settings" link: each project already exposes its own settings
     route from its own navigation, so a second way in was a
     duplicated control. Teclatlon opts out of the gear entirely
     because its richer drawer is already part of its main screen.
     With `languageInDrawer` the drawer DOES take the language as its
     first row, and the header keeps the gear alone.
     ============================================================ */
  var SETTINGS_COPY = {
    es: {
      title: 'Ajustes', close: 'Cerrar ajustes', textSize: 'Tamaño de letra',
      small: 'Pequeño', normal: 'Normal', large: 'Grande',
      theme: 'Tema', themeLight: 'Claro', themeDark: 'Oscuro',
      language: '🌐 Idioma',
      contrast: 'Alto contraste', successSound: 'Sonido de acierto', errorSound: 'Sonido de error', help: 'Se guarda en este dispositivo.'
    },
    en: {
      title: 'Settings', close: 'Close settings', textSize: 'Text size',
      small: 'Small', normal: 'Normal', large: 'Large',
      theme: 'Theme', themeLight: 'Light', themeDark: 'Dark',
      language: '🌐 Language',
      contrast: 'High contrast', successSound: 'Correct answer sound', errorSound: 'Error sound', help: 'Saved on this device.'
    }
  };

  /* Temas que la suite soporta: claro y oscuro. Antes estaba tambien
     "auto", que no fijaba atributo y dejaba que el navegador aplicase
     prefers-color-scheme; en un equipo en oscuro el sitio salia
     oscuro sin que nadie lo hubiera pedido, y eso no es elegir un
     tema. Los dos valores se aplican con data-theme, que es lo que
     escuchan las paletas de cada tokens.css. Un "auto" ya guardado se
     migra a "light" al leer, por no estar en la lista. */
  var THEMES = ['light', 'dark'];

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
    textSizeIsExplicit = saved.textSizeSet === true || saved.textSize === 'small' || saved.textSize === 'large';
    return {
      textSize: ['small', 'normal', 'large'].indexOf(saved.textSize) !== -1 ? saved.textSize : 'normal',
      textSizeSet: textSizeIsExplicit,
      theme: THEMES.indexOf(saved.theme) !== -1 ? saved.theme : 'light',
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
    if (!SOUND_SETTINGS_ENABLED) return;
    try { localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(soundState)); } catch (e) {}
  }

  /* El conmutador de alto contraste y el de tema son la misma palanca
     para quien tiene baja visión: el contraste es el extremo de la
     misma serie. Cuando el contraste está activo manda sobre el tema,
     y por eso se aplica y se revierte data-theme en ambos sentidos. */
  function applyTheme() {
    var html = document.documentElement;
    if (settingsState.contrast) {
      html.setAttribute('data-theme', 'contrast');
    } else {
      /* Siempre se fija el atributo. Antes el tema "auto" lo quitaba y
         dejaba `:root:not([data-theme])` de las hojas de tokens decidir
         por prefers-color-scheme; sin "auto" ese bloque ya no decide
         nada, porque data-theme siempre esta. */
      html.setAttribute('data-theme', settingsState.theme);
    }
  }

  function applySettings() {
    var html = document.documentElement;
    if (baseRootFontSize === null) baseRootFontSize = parseFloat(window.getComputedStyle(html).fontSize) || 16;
    html.setAttribute('data-a11y-text', settingsState.textSize);
    html.setAttribute('data-a11y-contrast', settingsState.contrast ? 'high' : 'normal');
    html.style.fontSize = settingsState.textSize === 'normal'
      ? ''
      : (baseRootFontSize * (settingsState.textSize === 'large' ? 1.15 : 0.9)) + 'px';
    if (textSizeIsExplicit) {
      var scale = settingsState.textSize === 'large' ? 1.15 : (settingsState.textSize === 'small' ? 0.9 : 1);
      if (TEXT_BASE_TOKEN) {
        if (baseTextBaseSize === null) {
          baseTextBaseSize = parseFloat(window.getComputedStyle(html).getPropertyValue('--text-base')) || 18;
        }
        html.style.setProperty('--text-base', (baseTextBaseSize * scale) + 'px');
      }
      html.style.setProperty('--text-scale', scale);
      html.style.setProperty('--escala-texto', scale);
    } else if (TEXT_BASE_TOKEN) {
      /* Sin elección explícita los tokens vuelven a la hoja: si se
         quedaron fijados en <html> el "Normal" ya no significaría lo
         mismo que el tamaño de la hoja de estilos. */
      html.style.removeProperty('--text-base');
      html.style.removeProperty('--text-scale');
      html.style.removeProperty('--escala-texto');
    }
    html.classList.toggle('high-contrast', settingsState.contrast && cfg.legacyContrastClass === true);
    applyTheme();
  }

  function renderSettings(drawer) {
    var copy = SETTINGS_COPY[settingsLocale()];
    drawer.querySelector('[data-settings-title]').textContent = copy.title;
    drawer.querySelector('[data-settings-close]').setAttribute('aria-label', copy.close);
    /* Solo existe con `languageInDrawer`: sin esa opción el cajón no
       tiene fila de idioma y no hay nada que traducir. */
    var languageLabel = drawer.querySelector('[data-settings-language-label]');
    if (languageLabel) languageLabel.textContent = copy.language;
    drawer.querySelector('[data-settings-size-label]').textContent = copy.textSize;
    drawer.querySelector('[data-settings-theme-label]').textContent = copy.theme;
    drawer.querySelector('[data-settings-theme-light]').textContent = copy.themeLight;
    drawer.querySelector('[data-settings-theme-dark]').textContent = copy.themeDark;
    drawer.querySelector('[data-settings-size-small]').textContent = copy.small;
    drawer.querySelector('[data-settings-size-normal]').textContent = copy.normal;
    drawer.querySelector('[data-settings-size-large]').textContent = copy.large;
    drawer.querySelector('[data-settings-contrast-label]').textContent = copy.contrast;
    if (SOUND_SETTINGS_ENABLED) {
      drawer.querySelector('[data-settings-success-label]').textContent = copy.successSound;
      drawer.querySelector('[data-settings-error-label]').textContent = copy.errorSound;
    } else {
      var soundRows = drawer.querySelectorAll('[data-settings-success], [data-settings-error]');
      Array.prototype.forEach.call(soundRows, function (input) {
        var row = input.closest('label');
        if (row) row.remove();
      });
    }
    drawer.querySelector('[data-settings-help]').textContent = copy.help;
    drawer.querySelectorAll('[data-settings-size]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-settings-size') === settingsState.textSize));
    });
    drawer.querySelectorAll('[data-settings-theme]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-settings-theme') === settingsState.theme));
    });
    var contrast = drawer.querySelector('[data-settings-contrast]');
    contrast.checked = settingsState.contrast;
    if (SOUND_SETTINGS_ENABLED) {
      drawer.querySelector('[data-settings-success]').checked = soundState.success;
      drawer.querySelector('[data-settings-error]').checked = soundState.error;
    }
  }

  function closeSettings(trigger, backdrop, drawer) {
    backdrop.classList.remove('is-open');
    drawer.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    /* El foco vuelve SOLO cuando el cajon ya esta oculto. El elemento que lo
       tenia (el boton de cerrar) vive dentro del cajon, y ocultar un subarbol
       que contiene el elemento con el foco lo manda a <body>: hacerlo aqui,
       160 ms antes de que el cajon desapareciera, pasaba cualquier comprobacion
       que solo mirase aria-expanded y dejaba sin foco a quien navega con
       teclado. */
    window.setTimeout(function () {
      backdrop.hidden = true;
      drawer.hidden = true;
      trigger.focus();
    }, 160);
  }

  function buildSettings() {
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
    /* La fila de cabecera se captura ANTES de mover nada: con
       `languageInDrawer` el contenedor del desplegable se va al cajón y
       su parentNode deja de ser la cabecera. */
    var headerLocalePicker = document.getElementById('locale-picker');
    var headerRow = headerLocalePicker ? headerLocalePicker.parentNode : null;
    if (headerRow) {
      if (LANGUAGE_IN_DRAWER) {
        /* En esa fila se queda solo el ⚙️, y .suite-controls está
           alineada al final: sigue cayendo arriba a la derecha. */
        headerRow.appendChild(trigger);
      } else {
        /* Inmediatamente después del desplegable de idioma y dentro de su
           misma fila (que es el extremo derecho de la cabecera), el ⚙️ cae
           arriba a la derecha. No se toca #locale-picker: su panel se
           ancla a ese contenedor y un hijo más lo desplazaría. */
        headerRow.insertBefore(trigger, headerLocalePicker.nextSibling);
      }
    }

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

    /* Con `languageInDrawer` el idioma es la PRIMERA fila del cajón: es
       el ajuste que más se usa, y puesta arriba su panel cae sobre las
       filas siguientes en vez de desbordar el borde inferior. */
    var languageRow = LANGUAGE_IN_DRAWER
      ? '<div class="locale-settings-row locale-settings-language" data-settings-language-row>' +
          '<span data-settings-language-label></span></div>'
      : '';
    drawer.innerHTML =
      '<div class="locale-settings-drawer-header">' +
        '<h2 id="accessibility-settings-title" data-settings-title></h2>' +
        '<button type="button" class="locale-settings-close" data-settings-close>✕</button>' +
      '</div>' +
      '<div class="locale-settings-drawer-body">' +
        languageRow +
        '<div class="locale-settings-row"><span data-settings-theme-label></span>' +
          '<div class="locale-settings-options" role="group">' +
            '<button type="button" data-settings-theme="light" data-settings-theme-light></button>' +
            '<button type="button" data-settings-theme="dark" data-settings-theme-dark></button>' +
          '</div>' +
        '</div>' +
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
        '<p class="locale-settings-help" data-settings-help></p>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    if (LANGUAGE_IN_DRAWER && headerLocalePicker) {
      /* Se MUEVE el contenedor que trae la app, no se reconstruye: así
         conserva el id que busca el resto del componente, el ancla del
         panel y sus escuchas. buildUI() lo rellena después, ya dentro
         del cajón. */
      drawer.querySelector('[data-settings-language-row]').appendChild(headerLocalePicker);
    }
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
        settingsState.textSizeSet = true;
        textSizeIsExplicit = true;
        saveSettings(); applySettings(); renderSettings(drawer);
      });
    });
    drawer.querySelectorAll('[data-settings-theme]').forEach(function (button) {
      button.addEventListener('click', function () {
        var chosen = button.getAttribute('data-settings-theme');
        if (THEMES.indexOf(chosen) === -1) return;
        settingsState.theme = chosen;
        /* Elegir un tema apaga el alto contraste: si no, el contraste
           se comería la eleccion y los botones aparecerian pulsados
           sin efecto visible. */
        settingsState.contrast = false;
        saveSettings(); applySettings(); renderSettings(drawer);
      });
    });
    drawer.querySelector('[data-settings-contrast]').addEventListener('change', function (event) {
      settingsState.contrast = event.target.checked;
      saveSettings(); applySettings(); renderSettings(drawer);
    });
    if (SOUND_SETTINGS_ENABLED) {
      drawer.querySelector('[data-settings-success]').addEventListener('change', function (event) {
        soundState.success = event.target.checked;
        saveSoundSettings(); renderSettings(drawer);
      });
      drawer.querySelector('[data-settings-error]').addEventListener('change', function (event) {
        soundState.error = event.target.checked;
        saveSoundSettings(); renderSettings(drawer);
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || drawer.hidden) return;
      /* Con el desplegable dentro del cajón hay dos capas abiertas: la
         primera Escape cierra el desplegable y deja el cajón, como en
         cualquier desplegable. Este escuchador se registró antes que el
         del propio componente, así que cerrar el panel aquí evita que el
         cajón se cierre en la misma pulsación. */
      var openPanel = drawer.querySelector('.locale-picker-panel.is-open');
      if (openPanel) {
        var languageBtn = openPanel.previousElementSibling;
        openPanel.classList.remove('is-open');
        if (languageBtn) {
          languageBtn.setAttribute('aria-expanded', 'false');
          languageBtn.focus();
        }
        return;
      }
      closeSettings(trigger, backdrop, drawer);
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

    /* 2b) Hook público `window.LocalePicker.onChange`. Va DESPUÉS del
       camino de App.i18n a propósito: en las apps con tablas las
       traducciones ya están aplicadas y este aviso solo les llega a las
       que se hayan registrado. Sin él, una página sin App.i18n recibe
       el cambio de idioma en el localStorage y en nada más: el
       desplegable parece funcionar y la página no se entera. */
    if (typeof window.LocalePicker.onChange === 'function') {
      window.LocalePicker.onChange(
        chosen,
        NATIVE_LABELS[chosen] || chosen.toUpperCase(),
        prev
      );
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
      if (SUPPORTED_LOCALES.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var navLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    var prefix = navLang.split(/[-_]/)[0].toLowerCase();
    return SUPPORTED_LOCALES.indexOf(prefix) !== -1 ? prefix : DEFAULT_LOCALE;
  }

  function init() {
    var current = detectLocale();
    discoverLocales(function (locales) {
      if (locales.length === 0) {
        /* Fallback: si el fetch HEAD falla (file:// sin servidor), usar
           SOLO los locales hardcodeados que la app pasó en cfg o el
           fallback de idiomas soportados. Esto permite que el componente
           funcione también en previews locales. */
        locales = filterSupportedLocales(cfg.requiredLocales || SUPPORTED_LOCALES);
      }
      _discoveredLocales = locales;
      _activeLocale = current;

      /* El ⚙️ se inserta antes que nada porque es hermano del
         #locale-picker —o, con `languageInDrawer`, el único control de
         esa fila—, no hijo: el orden de los dos controles en la
         cabecera no depende de cuál se construya primero. */
      if (ENABLE_SETTINGS) buildSettings();

      /* El idioma va a la cabecera —o al cajón, con `languageInDrawer`—,
         tenga la app o no el ⚙️. buildSettings() corre antes y, cuando la
         fila de idioma va dentro del cajón, ya ha movido #locale-picker
         allí: buildUI() lo rellena donde esté. */
      buildUI(locales, current);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
