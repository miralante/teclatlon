/* ============================================================
   Teclatlon — Erase the person's data (hidden route).
   Clears the saved name and the visual options (text size, theme,
   legend, numpad, celebration, key sound, colour, keyboard layout).
   Stars and completed lessons are kept.
   Two-step confirmation: the first tap asks to confirm, the second
   one erases. The label reverts after 5 seconds without a second tap.
   ============================================================ */
(function () {
  'use strict';

  var $ = App.utils.$;
  var SLUG = 'keyboard';

  function confirmTwice(btn, normalKey, confirmKey, onConfirm) {
    var confirming = false;
    var timeoutId = null;
    btn.textContent = App.i18n.t(normalKey);
    btn.addEventListener('click', function () {
      if (!confirming) {
        confirming = true;
        btn.textContent = App.i18n.t(confirmKey);
        timeoutId = setTimeout(function () {
          confirming = false;
          btn.textContent = App.i18n.t(normalKey);
        }, 5000);
        return;
      }
      clearTimeout(timeoutId);
      confirming = false;
      btn.textContent = App.i18n.t(normalKey);
      onConfirm();
    });
  }

  function resetPersonalData() {
    /* Keep stars and completed; wipe name + options. */
    var data = App.storage.get(SLUG);
    var kept = {
      stars: data.stars || 0,
      completed: data.completed || {}
    };
    App.storage.set(SLUG, kept);
    var f = $('#feedbackPersona');
    if (f) {
      f.textContent = App.i18n.t('personal.done');
      f.className = 'feedback acierto';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    App.i18n.apply();
    confirmTwice($('#btnBorrarPersona'), 'personal.button', 'personal.confirm', resetPersonalData);
  });
})();
