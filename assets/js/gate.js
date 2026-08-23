/* ==========================================================================
   Teclatlon — pre-paint bootstrap (device gate + locale + accessibility).
   Lives in an external file so the CSP can keep `script-src 'self'`
   without 'unsafe-inline'. Loaded synchronously in <head>, before the
   stylesheet cascade, so the gate verdict is on the page before the
   first paint. Has no project dependencies (assets/js/* core isn't
   loaded yet at this point).
   ========================================================================== */
(function () {
  var SUPPORTED = ['es', 'en'];
  var DEFAULT_LOCALE = 'es';

  function detectLocale() {
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

  var lang = detectLocale();
  document.documentElement.lang = lang;

  /* Device gate: Teclatlon is computer-only (see SPEC.md §2).
     Detection combines UA + coarse pointer + touch capability +
     viewport width + platform hint. iPadOS 13+ and modern iOS
     Safari in 'Request Desktop Site' mode lie about every signal:
     the UA becomes 'Macintosh', navigator.platform becomes
     'MacIntel' and the on-screen keyboard has the OSK.

     The reliable iOS-spoof signals across Safari iOS 13..18:
       * navigator.maxTouchPoints > 1 catches iPad (5+) — a real
         Mac trackpad reports 0 or 1.
       * window.orientation / window.orientationchange exist on
         iOS but NOT on macOS — this is the canonical iPhone
         Safari signal even when the rest lies.
       * navigator.standalone (Safari iOS only — true when the
         page is launched as a home-screen PWA on iOS).
       * typeof window.TouchEvent !== 'undefined' is true on every
         Safari iOS but also on touch-screen Mac browsers, so we
         only trust it as a secondary hint.
       * navigator.vendor === 'Apple Computer, Inc.' is true on
         Safari iOS/macOS; combined with 'Macintosh' UA + a
         touch screen it's an extra vote for spoofed-iOS.

     Order of priority:
       1. If the platform is iOS/Android, always block.
       2. If the device claims 'Macintosh' but has any iOS-only
          signal (orientation, maxTouchPoints > 1, standalone
          PWA), block.
       3. A real desktop UA (Windows / Mac / Linux X11 / ChromeOS)
          with no mobile UA and no iOS-only signals is allowed
          even with a touch screen (Surface, MacBook Touch Bar,
          Chromebook) so people with a physical keyboard can play.
       4. Otherwise fall back to the coarse-pointer + touch +
          viewport heuristic. */
  function isMobile() {
    var ua = (navigator.userAgent || '').toLowerCase();
    var platform = ((navigator.userAgentData && navigator.userAgentData.platform) ||
                    navigator.platform || '').toLowerCase();
    var touchPoints = (navigator.maxTouchPoints || 0) | 0;
    var mobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/.test(ua);
    var desktopUA = /windows nt|macintosh|x11|cros /.test(ua);
    /* iOS / Android are *mobile platforms by definition*; no UA
       spoofing can change the OS the page is actually running on,
       so we trust this signal even when "Macintosh" appears in
       the UA string. */
    var mobilePlatform = platform === 'iphone' || platform === 'ipad' ||
                         platform === 'ipod' || platform === 'android';
    /* iOS-only signals: each of these is true on a real iPhone /
       iPad (in either regular or 'Request Desktop Site' mode) and
       false on a real macOS Safari. Any one is enough to confirm
       a spoofed-Mac. */
    var hasOrientation = typeof window.orientation !== 'undefined' &&
                         typeof window.onorientationchange !== 'undefined';
    var isSpoofedIPad = platform === 'macintel' && touchPoints > 1;
    var isIOSStandalonePWA = typeof navigator.standalone === 'boolean' && navigator.standalone === true;
    var claimsMacUA = /macintosh/.test(ua);
    var spoofedMacWithIOSSignals = claimsMacUA && !mobilePlatform &&
                                    (hasOrientation || isSpoofedIPad || isIOSStandalonePWA);
    var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    var touch = touchPoints > 0;
    var small = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    /* navigator.virtualKeyboard exists in Chromium/Edge and is a
       strong "this is a touch-first device with an OSK" signal;
       we only use it when the OS platform is unknown (some
       browsers don't expose userAgentData), and only to *strengthen*
       an existing mobile hint, never to override a desktop one. */
    var hasVirtualKeyboard = typeof navigator.virtualKeyboard !== 'undefined';
    /* Step 1 — mobile OS: always block, regardless of UA. */
    if (mobilePlatform) return true;
    /* Step 2 — spoofed iOS (Safari iOS 13+ in 'Request Desktop
       Site'): a Mac that has iOS-only signals. Block unconditionally. */
    if (spoofedMacWithIOSSignals) return true;
    /* Step 3 — clean desktop UA: allow, even with touch (Surface,
       Chromebook, MacBook Touch Bar, touch-screen all-in-one). */
    if (desktopUA && !mobileUA) return false;
    /* Step 4 — heuristic fallback. */
    if (mobileUA && (coarse || small)) return true;
    if (coarse && touch) return true;
    if (small && touch) return true;
    if (hasVirtualKeyboard && touch && !desktopUA) return true;
    return false;
  }

  if (isMobile()) {
    /* Hide the app shell — every section has the .hidden class
       except this overlay; we also force-hide via inline style so
       it works even before styles.css loads. */
    document.documentElement.setAttribute('data-app-blocked', 'mobile');
    /* Override the <title> so the browser tab reads the gate too. */
    document.title = lang === 'en' ? 'Computer only — Teclatlon' : 'Solo en el ordenador — Teclatlon';
  }

  /* Apply saved accessibility settings before the first paint, the
     same way the language above is applied early: otherwise the
     page would flash the default theme/size/font for a moment
     before app.js#applyOptions() runs. Reads the same localStorage
     key assets/js/storage.js writes to ('teclatlon:keyboard');
     kept in a try/catch since storage can throw in private mode. */
  try {
    var saved = JSON.parse(localStorage.getItem('teclatlon:keyboard') || '{}');
    var rawOptions = saved.options || saved.opciones || {};
    /* Read both the current (English) and legacy (Spanish) field
       names: app.js migrates and re-saves the whole object on its
       first run, but this script executes before app.js loads, so
       on the very first paint after an update it may still find
       the old shape (opciones.tema/.texto/.foco) on disk. Falling
       back per-field avoids a one-time flash of the default theme/
       text-size/focus-mode for returning users. */
    var theme = rawOptions.theme || rawOptions.tema;
    var textSize = rawOptions.textSize || rawOptions.texto;
    var focusMode = rawOptions.focusMode || rawOptions.foco;
    var html = document.documentElement;
    /* Default theme is "light". If the user has chosen "auto" we
       still need a concrete data-theme before first paint to
       avoid flashing dark on systems with prefers-color-scheme:
       dark — auto resolves to "light" for first paint and the
       real OS theme is applied right after by app.js#applyOptions()
       when it swaps back to data-theme unset for "auto". If they
       picked an explicit theme we honour it as before. */
    if (theme === 'dark' || theme === 'oscuro' || theme === 'contrast' || theme === 'contraste') {
      html.setAttribute('data-theme', theme === 'oscuro' ? 'dark' : (theme === 'contraste' ? 'contrast' : theme));
    } else {
      html.setAttribute('data-theme', 'light');
    }
    if (textSize && textSize !== 'normal') {
      var textSizeMap = { chico: 'small', grande: 'large', enorme: 'huge' };
      html.setAttribute('data-text-size', textSizeMap[textSize] || textSize);
    }
    if (focusMode) html.classList.add('focus-mode');
  } catch (e) { /* ignore */ }
})();