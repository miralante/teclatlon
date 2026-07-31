/* ==========================================================================
   Teclatlon — Progress in localStorage
   Exposes window.App.storage.get(id) / .set(id, data) / .remove(id)
   Internal key: 'teclatlon:<id>'. No personal data leaves the device.
   Always fault-tolerant (private mode can throw exceptions).
   ========================================================================== */
(function () {
  'use strict';

  window.App = window.App || {};

  var PREFIJO = 'teclatlon:';

  /**
   * Reads saved progress.
   * @param {string} id
   * @returns {object} saved progress, or {} if there is none / on error
   */
  function get(id) {
    try {
      var raw = localStorage.getItem(PREFIJO + id);
      return raw ? JSON.parse(raw) : {};
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
      localStorage.setItem(PREFIJO + id, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Deletes saved progress. */
  function remove(id) {
    try {
      localStorage.removeItem(PREFIJO + id);
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
