/* ==========================================================================
   Miralante achievements engine. ONE definition for every suite app that
   gives achievements ("logros").

   Canonical source: apptonomia/scripts/suite/achievements-engine.js
   Copies: assets/js/achievements-engine.js (memofun, calculia, routime, teclatlon)
           js/achievements-engine.js        (apptonomia/doc/templates)
   Keep every copy byte-identical: run `node apptonomia/scripts/sync-achievements-engine.js --apply`
   after editing this file. Never edit a copy by hand.

   Policy: apptonomia/doc/es/spec.md §2.6 (same in every app).
     - Achievements are milestones computed from saved progress.
     - No streaks, no timers, no deadlines, no losses, no rankings.
     - A new achievement is announced once, neutrally, when the activity that
       earns it is finished. Pages that describe the app do not list them.
     - Unlock dates live only on this device; the first date is kept.

   Each app keeps its own catalogue (rules and text keys) and passes it in.
   The engine never contains app-specific rules or words.

   API (window.ApptonomiaAchievements):
     create(options) -> board
       options.storageKey  localStorage key for { id: timestamp }
       options.catalog     [{ id, icon, nameKey, descKey, test(progress) -> boolean }]
       options.t           function(key) -> string, the app's App.i18n.t
     board.list                  the catalogue
     board.unlocked()            { id: timestamp } of achievements already earned
     board.evaluate(progress)    checks every not-yet-earned rule against `progress`,
                                 saves the new ones, returns their ids (may be [])
     board.notify(el, ids)       writes one neutral line into `el` (aria-live) for
                                 the ids given, using the 'achievementNew' text with
                                 {name} replaced. Does nothing when ids is empty.
     board.render(el)            fills `el` with the badge grid: one <li> per
                                 catalogue item (.achievement-badge.locked|.unlocked
                                 with .achievement-badge-icon/-name/-desc/-status).
                                 Texts: nameKey, descKey, 'achievementUnlockedAt'
                                 ({date}) and 'achievementLocked'. The styles are
                                 NOT in this file: each app defines .achievements-grid
                                 and .achievement-badge* once in its shared stylesheet.
     options.locale              optional BCP 47 tag for the unlock date.
   ========================================================================== */
(function (root) {
  'use strict';

  function readStore(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* Storage can be unavailable (private mode). The achievement is then
         simply not kept; nothing else breaks. */
    }
  }

  function create(options) {
    var catalog = options.catalog || [];
    var key = options.storageKey;
    var t = options.t || function (k) { return k; };

    function unlocked() {
      return readStore(key);
    }

    function evaluate(progress) {
      var done = unlocked();
      var fresh = [];
      catalog.forEach(function (item) {
        if (done[item.id]) return;
        var earned = false;
        try { earned = !!item.test(progress); } catch (e) { earned = false; }
        if (earned) {
          done[item.id] = Date.now();
          fresh.push(item.id);
        }
      });
      if (fresh.length) writeStore(key, done);
      return fresh;
    }

    function nameOf(id) {
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].id === id) return t(catalog[i].nameKey);
      }
      return id;
    }

    function notify(el, ids) {
      if (!el || !ids || !ids.length) return;
      el.textContent = ids.map(function (id) {
        return t('achievementNew').replace('{name}', nameOf(id));
      }).join(' ');
    }

    function render(el) {
      if (!el) return;
      var done = unlocked();
      el.textContent = '';
      catalog.forEach(function (item) {
        var isUnlocked = !!done[item.id];
        var li = document.createElement('li');
        li.className = 'achievement-badge ' + (isUnlocked ? 'unlocked' : 'locked');

        var icon = document.createElement('span');
        icon.className = 'achievement-badge-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = item.icon;

        var name = document.createElement('span');
        name.className = 'achievement-badge-name';
        name.textContent = t(item.nameKey);

        var desc = document.createElement('span');
        desc.className = 'achievement-badge-desc';
        desc.textContent = t(item.descKey);

        var status = document.createElement('span');
        status.className = 'achievement-badge-status';
        status.textContent = isUnlocked
          ? t('achievementUnlockedAt').replace('{date}', new Date(done[item.id]).toLocaleDateString(options.locale))
          : t('achievementLocked');

        li.appendChild(icon);
        li.appendChild(name);
        li.appendChild(desc);
        li.appendChild(status);
        el.appendChild(li);
      });
    }

    return {
      list: catalog,
      unlocked: unlocked,
      evaluate: evaluate,
      notify: notify,
      render: render
    };
  }

  root.ApptonomiaAchievements = { create: create };
})(typeof window !== 'undefined' ? window : this);
