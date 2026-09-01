/* ============================================================
   Teclatlon — Textos de Ajustes (ES)
   Archivo específico del idioma. Se carga condicionalmente
   desde index.html según App.i18n.locale().
   ============================================================ */
(function () {
  'use strict';

  App.i18n.register({
    title: '⚙️ Teclatlon — Ajustes',
    routeNotice: 'Página de ajustes. No aparece en el menú de la aplicación: solo se llega escribiendo esta dirección.',
    intro: 'Aquí se puede borrar lo guardado en este navegador. Pensada para quien gestiona el dispositivo (familia, profesorado), no para la persona usuaria.',

    stateTitle: 'Estado actual de este navegador',
    currentLanguage: 'Idioma actual: {lang}',
    languageNameEs: 'Español',
    languageNameEn: 'English',
    savedName: 'Nombre guardado: {name}',
    noNameSaved: 'No hay nombre guardado.',
    starsTotal: 'Estrellas: {n}',
    lessonsCompleted: 'Lecciones completadas: {n}',
    keyboardLayout: 'Distribución de teclado: {layout}',
    textSize: 'Tamaño de texto: {size}',

    personalDataTitle: 'Borrar los datos de la persona',
    personalDataIntro: 'Borra el nombre guardado, el tamaño del texto, el tema visual y el modo foco.',
    personalDataKeeps: 'Se conservan',
    btnResetPersonal: 'Borrar mis datos personales',
    confirmResetPersonal: 'Toca otra vez para confirmar',
    feedbackResetPersonalDone: 'Hecho. Se ha borrado el nombre y los ajustes personales.',

    wipeTitle: 'Borrar todo',
    wipeIntro: 'Borra todas las claves bajo teclatlon:: nombre, estrellas, lecciones completadas, preferencias, idioma. Equivale a abrir la app por primera vez.',
    btnResetAll: 'Borrar todo lo guardado',
    confirmResetAll: 'Toca otra vez para confirmar',
    feedbackResetAllDone: 'Hecho. Se ha borrado todo lo guardado en este navegador.',

    footer: 'Nada sale de este navegador. No hay cuenta, ni servidor, ni copia de seguridad en la nube.'
  }, 'es');
})();
