/* ==========================================================================
   Teclatlon — About page achievements renderer
   Reads state.achievements from localStorage and renders the badge grid.
   Loaded after strings.es.js / strings.en.js so App.i18n is available.
   ========================================================================== */
(function () {
  'use strict';

  var ACHIEVEMENTS = [
    { id: 'firstStar',    icon: '⭐', key: 'achievementFirstStar' },
    { id: 'tenStars',     icon: '🌟', key: 'achievementTenStars' },
    { id: 'streak3',      icon: '🔥', key: 'achievementStreak3' },
    { id: 'allLessons',   icon: '🎓', key: 'achievementAllLessons' },
    { id: 'allKeys',      icon: '🏆', key: 'achievementAllKeys' },
    { id: 'perfectRound', icon: '💯', key: 'achievementPerfectRound' }
  ];

  function renderAchievements() {
    var container = document.getElementById('achievementsGrid');
    if (!container) return;
    var state = {};
    try { state = JSON.parse(localStorage.getItem('teclatlon:state') || '{}'); } catch (e) {}
    var unlocked = state.achievements || {};
    ACHIEVEMENTS.forEach(function (a) {
      var date = unlocked[a.id];
      var isUnlocked = !!date;
      var dateStr = isUnlocked ? new Date(date).toLocaleDateString() : null;
      var item = document.createElement('div');
      item.className = 'achievement-badge' + (isUnlocked ? ' unlocked' : ' locked');
      item.setAttribute('aria-label', App.i18n.t(a.key + 'Desc') + (isUnlocked ? '' : ' (' + App.i18n.t('achievementLocked') + ')'));
      item.innerHTML =
        '<span class="achievement-badge-icon">' + a.icon + '</span>' +
        '<span class="achievement-badge-name">' + App.i18n.t(a.key) + '</span>' +
        '<span class="achievement-badge-desc">' + App.i18n.t(a.key + 'Desc') + '</span>' +
        '<span class="achievement-badge-status">' +
          (isUnlocked
            ? App.i18n.t('achievementUnlockedAt').replace('{date}', dateStr)
            : App.i18n.t('achievementLocked')) +
        '</span>';
      container.appendChild(item);
    });
  }

  /* Render when the DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAchievements);
  } else {
    renderAchievements();
  }
})();
