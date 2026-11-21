/* ==========================================================================
   Apptonomia achievements engine. ONE definition for every suite app that
   gives achievements ("logros").

   Canonical source: apptonomia/scripts/suite/achievements-engine.js
   Copies: the TARGETS list of apptonomia/scripts/sync-achievements-engine.js.
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
       options.newKey      text key of the announcement (default 'achievementNew'),
                           with {name} replaced by the achievement's name
     board.list                  the catalogue
     board.unlocked()            { id: timestamp } of achievements already earned
     board.evaluate(progress)    checks every not-yet-earned rule against `progress`,
                                 saves the new ones, returns their ids (may be [])
     board.notify(el, ids)       writes one neutral line into `el` (aria-live) for
                                 the ids given, using the 'achievementNew' text with
                                 {name} replaced. Does nothing when ids is empty.
   ========================================================================== */
(function (root) {
  'use strict';

  function readStore(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
    var newKey = options.newKey || 'achievementNew';

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
        /* A function replacement, so a "$" in a name is kept as is. */
        return t(newKey).replace('{name}', function () { return nameOf(id); });
      }).join(' ');
    }

    return {
      list: catalog,
      unlocked: unlocked,
      evaluate: evaluate,
      notify: notify
    };
  }

  var api = { create: create };
  root.ApptonomiaAchievements = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
