/* =====================================================================
   Teclatlon — Team page text (ES).
   Hidden route; reached by typing the URL, not linked from the main
   app. Loaded as its own strings.<locale>.js so the I18N parity check
   in scripts/check.js catches any missing translation.
   ===================================================================== */
(function () {
  'use strict';

  App.i18n.register({
    pageTitle: 'Teclatlon — Quiénes la hacen',
    pageDescription: 'Quién mantiene Teclatlon y cómo contribuir al proyecto.',
    routeNotice: 'Esta página no se enlaza desde la aplicación. Solo se llega escribiendo la dirección.',
    tagline: 'Teclatlon es software libre (MIT), mantenido por la comunidad Apptonomia. Aquí explicamos quién hay detrás del proyecto y cómo ayudar.',
    techTeamTitle: 'Equipo técnico',
    techTeamText: 'Mantiene el código, el despliegue, la accesibilidad técnica y la integración continua. Suele trabajar vía pull requests y revisión en GitHub.',
    clinicTeamTitle: 'Equipo clínico y educativo',
    clinicTeamText: 'Terapeutas ocupacionales, maestros de educación especial, psicopedagogos y logopedas que prueban las actividades con su población y aportan criterios sobre cómo encaja en una sesión, una clase o un plan de apoyo.',
    outreachTeamTitle: 'Equipo de divulgación y sostenibilidad',
    outreachTeamText: 'Comunicación, fundaciones y administraciones públicas que difunden el proyecto, financian su mantenimiento o coordinan forks comunitarios.',
    howHelpTitle: 'Cómo ayudar',
    howHelpText: 'Pull requests a los repositorios abiertos, traducción de la interfaz a más idiomas, prueba con población real y reporte de incidencias, o difusión entre centros, profesionales y familias. Cualquier forma de ayuda cuenta.',
    footerActivities: 'Ir a la aplicación',
    footerDataProtection: 'Protección de datos',
    footerAbout: 'Sobre este proyecto',
    footerSettings: 'Ajustes'
  }, 'es');
})();
