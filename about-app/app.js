/* ============================================================
   Teclatlon — About the app (about-app/)
   Linked from the main footer, right before "Settings".
   Shows the achievements the person has unlocked. The catalog
   and the badge renderer live in ../assets/js/achievements.js;
   unlocking happens in the main app (app.js, achieve()).
   ============================================================ */
(function () {
  'use strict';

  function paintLanguageSelector() {
    var active = App.i18n.locale();
    App.utils.$$('.btn-lang').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.locale === active));
      btn.addEventListener('click', function () { App.i18n.setLocale(btn.dataset.locale); });
    });
  }

  function renderAchievements() {
    App.achievements.render(document.getElementById('achievementsGrid'));
    var total = App.achievements.list.length;
    var done = App.achievements.list.filter(function (a) {
      return !!App.achievements.unlocked()[a.id];
    }).length;
    document.getElementById('achievementsCount').textContent = App.i18n.t('achievementsCount')
      .replace('{n}', String(done))
      .replace('{total}', String(total));
  }

  document.addEventListener('DOMContentLoaded', function () {
    paintLanguageSelector();
    App.i18n.apply();
    renderAchievements();
  });
})();
