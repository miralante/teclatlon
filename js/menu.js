/* ==========================================================================
   Teclatlon — Menu, lessons, templates and name/free screens.
   Part of the classic-script split of app.js (see doc/en/technical.md §2.2).
   Shares state through window.Teclatlon: T.store (S) and module exports (T).
   Cross-module calls go through T.<name> so load order only matters for
   top-level code. Load order is set in index.html.
   ========================================================================== */
(function (T) {
  'use strict';
  var S = T.store;
  var $ = App.utils.$;
  var $$ = App.utils.$$;

  function goMenu() {
    renderMenu();
    T.showScreen('screenMenu');
  }

  function goLessons() {
    renderLessons();
    T.showScreen('screenLessons');
  }

  function goName() {
    $('#inputName').value = S.state.name;
    $('#nameNotice').textContent = '';
    T.showScreen('screenName');
    $('#inputName').focus();
  }

  function goFree() {
    T.showScreen('screenFree');
    $('#freeArea').focus();
  }

  function renderMenu() {
    $('#greeting').textContent = S.state.name
      ? App.i18n.t('greetingWithName').replace('{name}', T.capitalize(S.state.name))
      : App.i18n.t('greetingHello');
    var allLessons = T.lessons();
    var done = allLessons.filter(function (l) { return S.doneThisSession[l.id]; }).length;
    var allTemplates = T.templates();
    var doneTemplates = allTemplates.filter(function (p) { return S.doneThisSession['template_' + p.id]; }).length;
    $$('.mode-card').forEach(function (t) {
      var badge = t.querySelector('.done');
      var m = t.dataset.mode;
      if (m === 'lessons') badge.textContent = done > 0 ? App.i18n.t('doneOfTotal').replace('{done}', done).replace('{total}', allLessons.length) : '';
      else if (m === 'templates') badge.textContent = doneTemplates > 0 ? App.i18n.t('doneOfTotal').replace('{done}', doneTemplates).replace('{total}', allTemplates.length) : '';
      else badge.textContent = S.doneThisSession[m] ? '⭐' : '';
    });
    T.updateStars();
  }

  function renderLessons() {
    var container = $('#lessonsList');
    container.innerHTML = '';
    var allLessons = T.lessons();
    allLessons.forEach(function (l, i) {
      var unlocked = i === 0 || !!S.state.completed[allLessons[i - 1].id];
      var done = !!S.doneThisSession[l.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-lesson' + (done ? ' done' : '') + (!unlocked ? ' locked' : '');
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      var titleEl = document.createElement('span');
      titleEl.className = 'title';
      titleEl.textContent = l.title;
      var statusEl = document.createElement('span');
      statusEl.setAttribute('aria-hidden', 'true');
      statusEl.textContent = done ? '⭐' : (unlocked ? '' : '🔒');
      b.appendChild(num); b.appendChild(titleEl); b.appendChild(statusEl);
      if (unlocked) {
        b.addEventListener('click', function () { T.playLesson(l); });
      } else {
        b.disabled = true;
        b.setAttribute('aria-label', App.i18n.t('lessonLockedAria').replace('{n}', i + 1));
      }
      container.appendChild(b);
    });
  }

  /* "Real texts" (templates): unlike renderLessons(), every entry
     is always open -- these are independent practice texts, not a
     graded, linearly-unlocked curriculum. */
  function renderTemplates() {
    var container = $('#templatesList');
    container.innerHTML = '';
    T.templates().forEach(function (p, i) {
      var done = !!S.doneThisSession['template_' + p.id];
      /* A template with no line the active keyboard can type cannot be
         finished, so it is shown as unavailable rather than started. */
      var playable = T.templateSteps(p).length > 0;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-lesson' + (done ? ' done' : '') + (playable ? '' : ' locked');
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      var titleEl = document.createElement('span');
      titleEl.className = 'title';
      titleEl.textContent = p.title;
      var statusEl = document.createElement('span');
      statusEl.setAttribute('aria-hidden', 'true');
      statusEl.textContent = done ? '⭐' : (playable ? '' : '🔒');
      b.appendChild(num); b.appendChild(titleEl); b.appendChild(statusEl);
      if (playable) {
        b.addEventListener('click', function () { T.playTemplate(p); });
      } else {
        b.disabled = true;
      }
      container.appendChild(b);
    });
  }

  function goTemplates() {
    renderTemplates();
    T.showScreen('screenTemplates');
  }

  T.goFree = goFree;
  T.goLessons = goLessons;
  T.goMenu = goMenu;
  T.goName = goName;
  T.goTemplates = goTemplates;
  T.renderMenu = renderMenu;
})(window.Teclatlon);
