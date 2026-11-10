/* ==========================================================================
   Teclatlon — achievements catalogue ("logros").

   The policy is the suite's (apptonomia/doc/es/spec.md §2.6): milestones
   computed from saved progress, no streaks, no timers, no losses. A new one is
   announced once, neutrally, when the activity that earns it is finished. The
   mechanism lives in ./achievements-engine.js (identical in every app); this file
   holds Teclatlon's rules and texts.

   Storage: 'teclatlon:achievements' -> { <id>: <timestamp of first unlock> }.
   The caller passes the saved state and the lesson ids when an activity ends;
   perfectRound and allKeys are event facts, so they are passed only at that moment.

   Public API (window.App.achievements):
     list                       the catalogue
     unlocked()                 { id: timestamp }
     onActivityFinished(event)  event = { state, lessons, perfect?, allKeys? }:
                                saves the new ones and announces them once in
                                #achievement-notice
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  App.i18n.register({
    achievementNew: 'Nuevo logro: {name}',
    achievementFirstStar: 'Primera estrella',
    achievementFirstStarDesc: 'Consigue tu primera estrella.',
    achievementTenStars: 'Diez estrellas',
    achievementTenStarsDesc: 'Consigue diez estrellas en total.',
    achievementAllLessons: 'Todas las lecciones',
    achievementAllLessonsDesc: 'Termina todas las lecciones.',
    achievementPerfectRound: 'Ronda perfecta',
    achievementPerfectRoundDesc: 'Termina una actividad sin ningún fallo.',
    achievementAllKeys: 'Todas las teclas',
    achievementAllKeysDesc: 'Termina el reto de todas las teclas.'
  }, 'es');

  App.i18n.register({
    achievementNew: 'New achievement: {name}',
    achievementFirstStar: 'First star',
    achievementFirstStarDesc: 'Get your first star.',
    achievementTenStars: 'Ten stars',
    achievementTenStarsDesc: 'Get ten stars in total.',
    achievementAllLessons: 'All lessons',
    achievementAllLessonsDesc: 'Finish all the lessons.',
    achievementPerfectRound: 'Perfect round',
    achievementPerfectRoundDesc: 'Finish an activity without a single mistake.',
    achievementAllKeys: 'All keys',
    achievementAllKeysDesc: 'Finish the all-keys challenge.'
  }, 'en');

  var CATALOG = [
    { id: 'firstStar', icon: '⭐', nameKey: 'achievementFirstStar', descKey: 'achievementFirstStarDesc',
      test: function (p) { return p.stars >= 1; } },
    { id: 'tenStars', icon: '🌟', nameKey: 'achievementTenStars', descKey: 'achievementTenStarsDesc',
      test: function (p) { return p.stars >= 10; } },
    { id: 'allLessons', icon: '🎓', nameKey: 'achievementAllLessons', descKey: 'achievementAllLessonsDesc',
      test: function (p) { return p.allLessons === true; } },
    { id: 'perfectRound', icon: '💯', nameKey: 'achievementPerfectRound', descKey: 'achievementPerfectRoundDesc',
      test: function (p) { return p.perfect === true; } },
    { id: 'allKeys', icon: '⌨️', nameKey: 'achievementAllKeys', descKey: 'achievementAllKeysDesc',
      test: function (p) { return p.allKeys === true; } }
  ];

  var board = window.MiralanteAchievements.create({
    storageKey: 'teclatlon:achievements',
    catalog: CATALOG,
    t: function (key) { return App.i18n.t(key); }
  });

  /** Progress as the rules read it: stars, all lessons completed, and the event facts. */
  function snapshot(event) {
    var state = event.state || {};
    var completed = state.completed || {};
    var ids = Array.isArray(event.lessons) ? event.lessons : [];
    return {
      stars: typeof state.stars === 'number' ? state.stars : 0,
      allLessons: ids.length > 0 && ids.every(function (id) { return !!completed[id]; }),
      perfect: event.perfect === true,
      allKeys: event.allKeys === true
    };
  }

  /** Neutral notice. The element is created on first use. */
  function announce(ids) {
    if (!ids || !ids.length) return;
    var el = document.getElementById('achievement-notice');
    if (!el) {
      el = document.createElement('p');
      el.id = 'achievement-notice';
      el.className = 'achievement-notice';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    board.notify(el, ids);
  }

  window.App.achievements = {
    list: CATALOG,
    unlocked: board.unlocked,
    onActivityFinished: function (event) {
      announce(board.evaluate(snapshot(event || {})));
    }
  };
})();
