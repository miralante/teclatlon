/* Teclatlon · locale picker config.

   Teclatlon uses the suite's shared gear and drawer. The language is the first
   row of that drawer; the app's own rows (text size, theme, sounds, keyboard,
   rest reminder...) live in #settingsExtra and are moved into the drawer by the
   component. standardRows:false keeps the shared size, theme and contrast rows
   out, because Teclatlon has its own (four text sizes, theme buttons).

   Must load BEFORE assets/js/locale-picker.js. Teclatlon stores strings next to
   index.html, so path: 'strings'. storageKey matches assets/js/i18n.js. */
window.LocalePickerConfig = {
  storageKey: 'teclatlon:locale',
  path: 'strings',
  defaultLocale: 'en',
  languageInDrawer: true,
  standardRows: false,
  extraRowsId: 'settingsExtra',
  soundSettings: false
};
