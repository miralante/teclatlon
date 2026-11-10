/* ==========================================================================
   Teclatlon — Progress in localStorage
   Exposes window.App.storage.get(id) / .set(id, data) / .remove(id)
   Internal key: 'teclatlon:<id>'. No personal data leaves the device.
   Always fault-tolerant (private mode can throw exceptions).
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var PREFIX = 'teclatlon:';

  /**
   * Reads saved progress.
   * @param {string} id
   * @returns {object} saved progress, or {} if there is none / on error
   */
  function get(id) {
    try {
      var raw = localStorage.getItem(PREFIX + id);
      var data = raw ? JSON.parse(raw) : null;
      /* Only an object is progress. A stored "null", a number or a string
         would otherwise reach the callers, which read fields off it at
         boot and fail before the app can start. */
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Saves progress.
   * @param {string} id
   * @param {object} data - JSON-serializable object
   * @returns {boolean} true if it was saved
   */
  function set(id, data) {
    try {
      localStorage.setItem(PREFIX + id, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Deletes saved progress. */
  function remove(id) {
    try {
      localStorage.removeItem(PREFIX + id);
      return true;
    } catch (e) {
      return false;
    }
  }

  window.App.storage = {
    get: get,
    set: set,
    remove: remove
  };
})();
