/* ==========================================================================
   Miralante stars engine. ONE definition for every suite app.

   Canonical source: apptonomia/scripts/suite/stars-engine.js
   Copies: assets/js/stars-engine.js (calculia, memofun, routime, teclatlon)
           js/stars-engine.js        (sinonimia)
   Keep every copy byte-identical: run `node apptonomia/scripts/sync-stars-engine.js --apply`
   after editing this file. Never edit a copy by hand.

   Rules (suite-wide, same in every app):
     - Achievements ("logros") are multiples of 10: 10, 20, 30...
       The text says "ya tienes XX estrellas" with the last one reached.
     - The next goal ("a por") is the nearest number above the total that
       ends in 5: 5, 15, 25... The text says "a por las XX estrellas".

   API (window.MiralanteStars):
     goalFor(total)                  next goal above total, always ends in 5
     milestoneFor(total)             last achievement reached (0 if none)
     crossedMilestone(prev, next)    achievement reached going prev -> next, or 0
     line(total, strings)            one line of text, e.g.
                                     "Ya tienes 10 estrellas · A por las 15 estrellas"
     goal(anchorEl, total, strings)  shows that line in a <span class="stars-goal">
                                     placed right after anchorEl (created once)

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

  /** Next goal above `total`: the nearest number that ends in 5. */
  function goalFor(total) {
    var n = whole(total);
    var base = n - (n % 10);
    return n % 10 < 5 ? base + 5 : base + 15;
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

  function fill(text, n) {
    return String(text).replace('{n}', String(n));
  }

  /** The text for `total`: last achievement (if any), then the next goal. */
  function line(total, strings) {
    var s = strings || {};
    var parts = [];
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
    goal: goal
  };

  root.MiralanteStars = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
