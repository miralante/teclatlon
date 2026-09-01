/* ============================================================
   Teclatlon — Settings texts (EN)
   Parity with strings.es.js (enforced by scripts/check.js).
   ============================================================ */
(function () {
  'use strict';

  App.i18n.register({
    title: '⚙️ Teclatlon — Settings',
    routeNotice: 'Settings page. It does not appear in the app menu: you get here by typing this address.',
    intro: 'Here you can clear what is saved in this browser. Aimed at whoever manages the device (family, teachers), not at the person using the app.',

    stateTitle: 'Current state of this browser',
    currentLanguage: 'Current language: {lang}',
    languageNameEs: 'Spanish',
    languageNameEn: 'English',
    savedName: 'Saved name: {name}',
    noNameSaved: 'No saved name.',
    starsTotal: 'Stars: {n}',
    lessonsCompleted: 'Lessons completed: {n}',
    keyboardLayout: 'Keyboard layout: {layout}',
    textSize: 'Text size: {size}',

    personalDataTitle: "Clear the person's data",
    personalDataIntro: 'Clears the saved name, the text size, the visual theme and the focus mode.',
    personalDataKeeps: 'Kept',
    btnResetPersonal: "Clear my personal data",
    confirmResetPersonal: 'Tap again to confirm',
    feedbackResetPersonalDone: 'Done. The name and personal settings have been cleared.',

    wipeTitle: 'Clear everything',
    wipeIntro: 'Clears every key under teclatlon:: name, stars, completed lessons, preferences, language. Equivalent to opening the app for the first time.',
    btnResetAll: 'Clear everything saved',
    confirmResetAll: 'Tap again to confirm',
    feedbackResetAllDone: 'Done. Everything saved in this browser has been cleared.',

    footer: 'Nothing leaves this browser. There is no account, no server, no cloud backup.'
  });
})();
