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

  /* Step-by-step list: the lessons are drawn under their block titles
     (DATA.lessonBlocks). Numbering and unlocking still use the flat
     DATA.lessons order, so the block layout changes nothing else. */
  function renderLessons() {
    var container = $('#lessonsList');
    container.innerHTML = '';
    var allLessons = T.lessons();
    var blocks = DATA.lessonBlocks[App.i18n.locale()] || DATA.lessonBlocks.es;
    blocks.forEach(function (block) {
      var section = document.createElement('section');
      section.className = 'lesson-block';
      var heading = document.createElement('h3');
      heading.className = 'lesson-block-title';
      heading.textContent = block.title;
      var grid = document.createElement('div');
      grid.className = 'grid-lessons';
      section.appendChild(heading);
      section.appendChild(grid);
      block.lessons.forEach(function (id) {
        var i = allLessons.findIndex(function (l) { return l.id === id; });
        if (i >= 0) grid.appendChild(lessonButton(allLessons, i));
      });
      container.appendChild(section);
    });
  }

  function lessonButton(allLessons, i) {
    var l = allLessons[i];
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
    return b;
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

  /* ---------- Star notebook (carnet) ----------
     A read-only view of progress that already exists: every lesson, mode
     and real text, with whether it is done and how many stars it has.
     Repeats add stars (award() in core.js), so a count can be above one.
     Only completed keys and the star counts are read; nothing is stored here. */
  function starsFor(key) {
    var n = S.state.starsBy[key] || 0;
    /* Saves from before the counter: a completed key counts as one star. */
    if (!n && S.state.completed[key]) n = 1;
    return n;
  }

  function carnetItem(name, key) {
    var li = document.createElement('li');
    li.className = 'carnet-item';
    var done = !!S.state.completed[key];
    var nameEl = document.createElement('span');
    nameEl.className = 'carnet-name';
    nameEl.textContent = name;
    var statusEl = document.createElement('span');
    statusEl.className = 'carnet-status ' + (done ? 'is-done' : 'is-pending');
    statusEl.textContent = done ? App.i18n.t('carnetDone') : App.i18n.t('carnetPending');
    var starsEl = document.createElement('span');
    starsEl.className = 'carnet-stars';
    starsEl.textContent = '⭐ ' + starsFor(key);
    li.appendChild(nameEl);
    li.appendChild(statusEl);
    li.appendChild(starsEl);
    return li;
  }

  function carnetSection(title, items) {
    var section = document.createElement('section');
    section.className = 'carnet-section';
    var heading = document.createElement('h3');
    heading.className = 'carnet-section-title';
    heading.textContent = title;
    var list = document.createElement('ul');
    list.className = 'carnet-list';
    items.forEach(function (it) { list.appendChild(carnetItem(it.name, it.key)); });
    section.appendChild(heading);
    section.appendChild(list);
    return section;
  }

  function renderCarnet() {
    var container = $('#carnetList');
    container.innerHTML = '';
    var total = 0;
    var done = 0;
    function count(key) {
      total += 1;
      if (S.state.completed[key]) done += 1;
    }

    /* Lessons, under the same block titles as Paso a paso. */
    var byId = {};
    T.lessons().forEach(function (l) { byId[l.id] = l; });
    var blocks = DATA.lessonBlocks[App.i18n.locale()] || DATA.lessonBlocks.es;
    blocks.forEach(function (block) {
      var items = [];
      block.lessons.forEach(function (id) {
        if (!byId[id]) return;
        count(id);
        items.push({ name: byId[id].title, key: id });
      });
      container.appendChild(carnetSection(block.title, items));
    });

    /* Modes that give a star. Dictation and free writing give none. */
    var modes = [
      ['placement', 'modePlacementName'],
      ['allKeys', 'modeAllKeysName'],
      ['words', 'modeWordsName'],
      ['numbers', 'modeNumbersName']
    ];
    var modeItems = modes.map(function (m) {
      count(m[0]);
      return { name: App.i18n.t(m[1]), key: m[0] };
    });
    container.appendChild(carnetSection(App.i18n.t('carnetSectionModes'), modeItems));

    /* Real texts: one star each. */
    var templateItems = T.templates().map(function (p) {
      count('template_' + p.id);
      return { name: p.title, key: 'template_' + p.id };
    });
    container.appendChild(carnetSection(App.i18n.t('carnetSectionTemplates'), templateItems));

    $('#carnetSummary').textContent = App.i18n.t('carnetSummary')
      .replace('{stars}', S.state.stars)
      .replace('{done}', done)
      .replace('{total}', total);
  }

  function goCarnet() {
    renderCarnet();
    T.showScreen('screenCarnet');
    var title = $('#screenCarnet .game-title');
    title.setAttribute('tabindex', '-1');
    title.focus();
  }

  T.goCarnet = goCarnet;
  T.goFree = goFree;
  T.goLessons = goLessons;
  T.goMenu = goMenu;
  T.goName = goName;
  T.goTemplates = goTemplates;
  T.renderMenu = renderMenu;
})(window.Teclatlon);
