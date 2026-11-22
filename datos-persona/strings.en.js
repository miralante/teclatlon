/* Teclatlon — «Erase the person's data» texts, in English. Support page:
   it does not appear in the app menu. */
window.App = window.App || {};
if (window.App.i18n) {
  App.i18n.register({
    personal: {
      title: 'Erase the person’s data',
      routeNotice: 'Settings page. It is not in the app menu: you only get here by typing this address.',
      intro: 'Clears the saved name, the text size, the visual theme and the other settings. Stars and completed lessons are kept.',
      button: 'Erase my personal data',
      confirm: 'Tap again to confirm',
      done: 'Done. The name and the personal settings have been erased.'
    }
  }, 'en');
}
