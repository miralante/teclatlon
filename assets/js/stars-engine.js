/* ==========================================================================
   Apptonomia stars engine. ONE definition for every suite app.

   Canonical source: apptonomia/scripts/suite/stars-engine.js
   Copies: the TARGETS list of apptonomia/scripts/sync-stars-engine.js (the apps
           with stars, and apptonomia/doc/templates for new apps).
   Keep every copy byte-identical: run `node apptonomia/scripts/sync-stars-engine.js --apply`
   after editing this file. Never edit a copy by hand.

   Rules (suite-wide, same in every app):
     - Achievements ("logros") are multiples of 10: 10, 20, 30...
       The text says "ya tienes XX estrellas" with the last one reached.
     - The next goal ("a por") is the nearest multiple of 5 above the total:
       with 16 stars the goal is 20; with 20 it is 25. The text says
       "a por las XX estrellas".

   API (window.ApptonomiaStars):
     goalFor(total)                  next goal above total: the next multiple of 5
     milestoneFor(total)             last achievement reached (0 if none)
     crossedMilestone(prev, next)    achievement reached going prev -> next, or 0
     line(total, strings)            one line of text, e.g.
                                     "Ya tienes 10 estrellas · A por las 15 estrellas"
     goal(anchorEl, total, strings)  shows that line in a <span class="stars-goal">
                                     placed right after anchorEl (created once)
     takeNewStar()                   true once when the total went up since the last
                                     celebration (the celebrate block calls it)
     useStorageKey(key)              where the last celebrated total is kept. Default
                                     'apptonomia:stars:last'; an app passes a key with
                                     its own prefix ('<slug>:stars:last') so its
                                     config/ reset clears it with the rest of its data.
     storageKey()                    the key in use

   Note: line() and goal() also record `total` as the total to celebrate next
   (mark): build the goal line for the counter the person sees, and only for it.

   strings = { reached: 'Ya tienes {n} estrellas', goal: 'A por las {n} estrellas' }
   The words live in each app's own strings files; this file has no copy.
   ========================================================================== */
(function (root) {
  'use strict';

  var SEPARATOR = ' · ';
  var GOAL_CLASS = 'stars-goal';

  function whole(total) {
    var n = Math.floor(Number(total));
    return n > 0 ? n : 0;
  }

  /** Next goal above `total`: the nearest multiple of 5 that is strictly above it. */
  function goalFor(total) {
    var n = whole(total);
    return (Math.floor(n / 5) + 1) * 5;
  }

  /** Last achievement reached: the largest multiple of 10 not above `total`. */
  function milestoneFor(total) {
    var n = whole(total);
    return n - (n % 10);
  }

  /** Achievement reached going from `prev` to `next` (the largest one), or 0. */
  function crossedMilestone(prev, next) {
    var before = milestoneFor(prev);
    var after = milestoneFor(next);
    return after > before ? after : 0;
  }

  /* Replaces every {n}. A function replacement, so a "$" in the text is kept as is. */
  function fill(text, n) {
    return String(text).replace(/\{n\}/g, function () { return String(n); });
  }

  var LAST_KEY = 'apptonomia:stars:last';

  function useStorageKey(key) {
    if (typeof key === 'string' && key) LAST_KEY = key;
    return LAST_KEY;
  }
  var pending = null; // the total of the last goal line, until a celebration takes it

  function readLast() {
    try {
      var v = localStorage.getItem(LAST_KEY);
      return v === null ? null : Number(v);
    } catch (e) { return null; }
  }

  function writeLast(n) {
    try { localStorage.setItem(LAST_KEY, String(n)); } catch (e) { /* storage may be off */ }
  }

  /** Records the total that a goal line is built for. */
  function mark(total) {
    pending = whole(total);
    return pending;
  }

  /**
   * True when the stars went up since the last celebration: a new star to congratulate.
   * It looks at the total of the last goal line built, and reading it stores that total.
   */
  function takeNewStar() {
    if (pending === null) return false;
    var total = pending, last = readLast();
    pending = null;
    writeLast(total);
    return last === null ? total > 0 : total > last;
  }

  /** The text for `total`: last achievement (if any), then the next goal. */
  function line(total, strings) {
    var s = strings || {};
    var parts = [];
    mark(total);
    var reached = milestoneFor(total);
    if (reached > 0 && s.reached) parts.push(fill(s.reached, reached));
    if (s.goal) parts.push(fill(s.goal, goalFor(total)));
    return parts.join(SEPARATOR);
  }

  /** Shows line(total) in the goal span that sits right after `anchorEl`. */
  function goal(anchorEl, total, strings) {
    if (!anchorEl || !anchorEl.parentNode) return;
    var next = anchorEl.nextElementSibling;
    var el = next && next.classList.contains(GOAL_CLASS) ? next : null;
    if (!el) {
      el = document.createElement('span');
      el.className = GOAL_CLASS;
      anchorEl.parentNode.insertBefore(el, anchorEl.nextSibling);
    }
    el.textContent = line(total, strings);
  }

  var api = {
    goalFor: goalFor,
    milestoneFor: milestoneFor,
    crossedMilestone: crossedMilestone,
    line: line,
    goal: goal,
    mark: mark,
    takeNewStar: takeNewStar,
    useStorageKey: useStorageKey,
    storageKey: function () { return LAST_KEY; }
  };

  root.ApptonomiaStars = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
