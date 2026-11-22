/* Teclatlon — textos de «Borrar los datos de la persona», en español. Página de apoyo:
   no aparece en el menú de la aplicación. */
window.App = window.App || {};
if (window.App.i18n) {
  App.i18n.register({
    personal: {
      title: 'Borrar los datos de la persona',
      routeNotice: 'Página de ajustes. No aparece en el menú de la aplicación: solo se llega escribiendo esta dirección.',
      intro: 'Borra el nombre guardado, el tamaño del texto, el tema visual y los demás ajustes. Se conservan las estrellas y las lecciones completadas.',
      button: 'Borrar mis datos personales',
      confirm: 'Toca otra vez para confirmar',
      done: 'Hecho. Se ha borrado el nombre y los ajustes personales.'
    }
  }, 'es');
}
