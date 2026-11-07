/* ==========================================================================
   Teclatlon — Practice-set selection. Pure functions: no DOM, no state.
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

  /* Returns true if EVERY character of `seq` is in the `target` set
     (typeable characters of the active layout). Filters out
     candidates whose `seq` uses keys not available in the current
     layout (e.g. a sentence with "1" in the "simple" layout) so
     coverage is computed only over keys that are actually typeable. */
  function seqFitsLayout(seq, target) {
    for (var i = 0; i < seq.length; i++) {
      if (!target[seq[i]]) return false;
    }
    return true;
  }

  /* Counts the per-key presses (including space) that `seq` would add
     to the running `coverage` accumulator. Used to score candidates
     in the greedy algorithm. */
  function scoreSeq(seq, coverage, target, deficit) {
    var total = 0;
    for (var i = 0; i < seq.length; i++) {
      var ch = seq[i];
      if (!target[ch]) continue;
      if (deficit[ch] > 0) total += deficit[ch];
    }
    return total;
  }

  /* Picks a set of words from the bank that covers every key of the
     active layout at least `minimum` times, with a `maximum` cap on
     word count so the round doesn't drag on. Strategy:
     1) filter out candidates whose characters don't fit the layout;
     2) start from an `initialCoverage` (typically the presses the
        player's name contributes if it enters as the first step);
     3) greedy loop: each iteration, compute the per-key deficit
        against coverage and pick the candidate that reduces it the
        most; break ties at random to vary the round;
     4) stop once every key reaches `minimum` or the `maximum` word
        cap is hit. If keys are still under-covered after the greedy
        loop (unlikely unless the bank is very small), nothing extra
        is done: the current bank covers all 31 keys with margin. */
  function pickWordSet(bank, target, initialCoverage, minimum, maximum) {
    var candidates = bank.filter(function (w) { return seqFitsLayout(w, target); });
    if (candidates.length === 0) return [];
    var chosen = [];
    var coverage = {};
    Object.keys(target).forEach(function (k) { coverage[k] = 0; });
    if (initialCoverage) {
      Object.keys(initialCoverage).forEach(function (k) {
        if (target[k]) coverage[k] = initialCoverage[k];
      });
    }

    function deficit() {
      var d = {};
      Object.keys(coverage).forEach(function (k) {
        d[k] = Math.max(0, minimum - coverage[k]);
      });
      return d;
    }

    function tryAdd(seq) {
      chosen.push(seq);
      for (var i = 0; i < seq.length; i++) {
        var ch = seq[i];
        if (target[ch]) coverage[ch] = (coverage[ch] || 0) + 1;
      }
    }

    /* Greedy: at each step, take every unused candidate, score it
       against the current deficit, group by the top score and pick
       one at random among the ties (so the round varies). Stop once
       every key reaches the minimum or the word cap is reached. */
    var used = {};
    var attempts = 0;
    var maxAttempts = candidates.length * 4;
    while (chosen.length < maximum && attempts < maxAttempts) {
      attempts++;
      var def = deficit();
      var totalDeficit = 0;
      Object.keys(def).forEach(function (k) { totalDeficit += def[k]; });
      if (totalDeficit === 0) break;
      var bestScore = -1;
      var best = [];
      for (var i = 0; i < candidates.length; i++) {
        var w = candidates[i];
        if (used[w]) continue;
        var s = scoreSeq(w, coverage, target, def);
        if (s > bestScore) { bestScore = s; best = [w]; }
        else if (s === bestScore) { best.push(w); }
      }
      if (best.length === 0 || bestScore <= 0) break;
      var picked = best[Math.floor(Math.random() * best.length)];
      used[picked] = true;
      tryAdd(picked);
    }
    return chosen;
  }

  T.pickWordSet = pickWordSet;
  T.seqFitsLayout = seqFitsLayout;
})(window.Teclatlon);
