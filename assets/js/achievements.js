/* ==========================================================================
   Teclatlon — Achievements catalog and badge grid
   Exposes window.App.achievements.list / .unlocked() / .render(container).
   The unlock logic lives in app.js (achieve()), which stores
   { id: timestamp } under state.achievements of the 'keyboard' slug.
   This file only knows the catalog and how to draw it, so the
   "About the app" page (about-app/) can show the badges without
   loading the whole game. Texts come from App.i18n (keys
   achievement<Name>, achievement<Name>Desc, achievementLocked,
   achievementUnlockedAt).
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var SLUG = 'keyboard';

  var LIST = [
    { id: 'firstStar',    icon: '⭐', key: 'achievementFirstStar' },
    { id: 'tenStars',     icon: '🌟', key: 'achievementTenStars' },
    { id: 'streak3',      icon: '🔥', key: 'achievementStreak3' },
    { id: 'allLessons',   icon: '🎓', key: 'achievementAllLessons' },
    { id: 'allKeys',      icon: '🏆', key: 'achievementAllKeys' },
    { id: 'perfectRound', icon: '💯', key: 'achievementPerfectRound' }
  ];

  /** Unlocked achievements as { id: timestamp }. */
  function unlocked() {
    var data = App.storage.get(SLUG);
    return (data.achievements && typeof data.achievements === 'object') ? data.achievements : {};
  }

  /** Draws one badge per achievement inside `container`. */
  function render(container) {
    if (!container) return;
    var t = App.i18n.t;
    var done = unlocked();
    container.innerHTML = '';
    LIST.forEach(function (a) {
      var isUnlocked = !!done[a.id];
      var dateStr = isUnlocked ? new Date(done[a.id]).toLocaleDateString(App.i18n.lang()) : null;
      var item = document.createElement('li');
      item.className = 'achievement-badge' + (isUnlocked ? ' unlocked' : ' locked');
      item.innerHTML =
        '<span class="achievement-badge-icon" aria-hidden="true">' + a.icon + '</span>' +
        '<span class="achievement-badge-name">' + t(a.key) + '</span>' +
        '<span class="achievement-badge-desc">' + t(a.key + 'Desc') + '</span>' +
        '<span class="achievement-badge-status">' +
          (isUnlocked ? t('achievementUnlockedAt').replace('{date}', dateStr) : t('achievementLocked')) +
        '</span>';
      container.appendChild(item);
    });
  }

  window.App.achievements = {
    list: LIST,
    unlocked: unlocked,
    render: render
  };
})();
