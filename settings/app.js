/* ============================================================
   Teclatlon — Settings (hidden route)
   View/reset what's saved in localStorage. Two actions:
   - "Reset the person's data": clears the saved name and
     the visual preferences (textSize, theme, focusMode,
     spatialSound, color, keyboard layout). Stars and
     completed lessons are kept.
   - "Reset the whole app": clears every key under the
     'teclatlon:' prefix (equivalent to opening the app
     for the first time).
   Two-step confirmation (same pattern as routime/settings
   and calculia/settings): one tap asks to confirm, the second
   deletes.
   ============================================================ */
(function () {
  'use strict';

  var $ = App.utils.$;
  var SLUG = 'keyboard';

  function defaultState() {
    return {
      name: '',
      stars: 0,
      completed: {},
      options: {
        keyboard: 'simple',
        color: 'hands',
        theme: 'light',
        textSize: 'normal',
        focusMode: false,
        spatialSound: false,
        metrics: false
      }
    };
  }

  function renderState() {
    var data = App.storage.get(SLUG);
    var opts = data.options || {};
    var languageName = App.i18n.t(App.i18n.locale() === 'en' ? 'languageNameEn' : 'languageNameEs');

    var nameText = (typeof data.name === 'string' && data.name.length > 0)
      ? App.i18n.t('savedName').replace('{name}', data.name)
      : App.i18n.t('noNameSaved');
    var starsText = App.i18n.t('starsTotal').replace('{n}', String(data.stars || 0));
    var completedCount = (data.completed && typeof data.completed === 'object')
      ? Object.keys(data.completed).length
      : 0;
    var lessonsText = App.i18n.t('lessonsCompleted').replace('{n}', String(completedCount));
    var layoutText = App.i18n.t('keyboardLayout').replace('{layout}', opts.keyboard || 'simple');
    var sizeText = App.i18n.t('textSize').replace('{size}', opts.textSize || 'normal');

    var items = [
      App.i18n.t('currentLanguage').replace('{lang}', languageName),
      nameText,
      starsText,
      lessonsText,
      layoutText,
      sizeText
    ];

    var list = $('#listaEstado');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
  }

  /* Two-step confirmation on the same button. */
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
      f.textContent = App.i18n.t('feedbackResetPersonalDone');
      f.className = 'feedback acierto';
    }
    renderState();
  }

  function resetEverything() {
    App.storage.remove(SLUG);
    var f = $('#feedbackTodo');
    if (f) {
      f.textContent = App.i18n.t('feedbackResetAllDone');
      f.className = 'feedback acierto';
    }
    renderState();
  }

  function wireLanguageButtons() {
    var currentLocale = App.i18n.locale();
    App.utils.$$('.btn-idioma').forEach(function (btn) {
      var pressed = btn.dataset.locale === currentLocale;
      btn.setAttribute('aria-pressed', String(pressed));
      btn.addEventListener('click', function () {
        App.i18n.setLocale(btn.dataset.locale);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireLanguageButtons();
    renderState();
    App.i18n.apply();

    confirmTwice(
      $('#btnBorrarPersona'),
      'btnResetPersonal',
      'confirmResetPersonal',
      resetPersonalData
    );
    confirmTwice(
      $('#btnBorrarTodo'),
      'btnResetAll',
      'confirmResetAll',
      resetEverything
    );
  });
})();
