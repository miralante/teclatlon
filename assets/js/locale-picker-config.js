/* Teclatlon · locale picker config.

   This object used to live in an inline <script> in index.html. The
   production CSP is `script-src 'self'` (see _headers) and inline
   scripts are NOT executable there, so the browser threw the whole
   config away and locale-picker.js fell back to its defaults:
   `settings: false` never arrived, so ENABLE_SETTINGS evaluated to true
   and the component rendered a SECOND ⚙️ settings drawer inside the
   app's own settings drawer, repeating text size, contrast and sounds
   that index.html already offers. Nothing caught it: the preview server
   (scripts/ui-server.js) sent no CSP, so the bug only existed in
   production.

   Keep it external. Load it BEFORE assets/js/locale-picker.js.
   Teclatlon stores strings next to index.html (not under assets/js/),
   so path: 'strings'. storageKey must match the one assets/js/i18n.js
   writes to localStorage ('teclatlon:locale'). */
window.LocalePickerConfig = {
  storageKey: 'teclatlon:locale',
  path: 'strings',
  defaultLocale: 'en',
  /* Teclatlon's own settings drawer is the only settings UI: the app
     already offers text size, theme/high contrast, key sound and error
     sound. Opt out of the shared accessibility drawer so the options
     cannot be duplicated inside it. */
  settings: false
};
