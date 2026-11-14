/* suite-chrome.js — shared header and footer of every suite app.
   ONE definition for the whole suite. Canonical source:
   apptonomia/scripts/suite/suite-chrome.js. Copied byte for byte to
   assets/js/suite-chrome.js (or js/suite-chrome.js in the scaffold) by
   apptonomia/scripts/sync-suite-chrome.js. Never edit a copy by hand.

   USAGE (in the page, inside <body>):

     <div data-suite-header data-suite-logo="assets/img/icono.svg" data-suite-byline></div>
     <div class="suite-chrome-activity" data-suite-activity>   (optional, subpages)
       <a class="back-link" href="../">← Volver</a>
       <h1>Activity title</h1>
     </div>
     <span class="stars" data-suite-stars id="stars">⭐ 0</span> (optional)
     <main> ... </main>
     <footer data-suite-footer
             data-suite-base="./"
             data-suite-settings
             data-suite-contact="hello@apptonomia.uk"></footer>

   Both mounts are optional. A header mount that already has children is
   skipped, so a page can keep its own markup while it migrates.

   The activity block ([data-suite-activity]) sits OUTSIDE the mount. The
   header moves it into the centre of the header row, between the brand and
   the controls. The stars counter ([data-suite-stars]) is moved into the
   controls row, left of the settings gear. Both are moved, not copied: the
   app keeps its references and ids.

   ATTRIBUTES
     header:
       data-suite-mark     short non-translatable glyph in the brand tile (optional)
       data-suite-logo     image URL for the brand tile (optional; wins over the glyph)
       data-suite-byline   present: show "Una app de Apptonomia." under the name
       data-suite-portal   link target of the byline (default "https://apptonomia.uk/")
       data-suite-brand    "off": draw only the controls row (the page draws its own brand)
       data-suite-name     the app's name when the page has no locale strings to
                           translate core.chrome.appName (optional)
     footer:
       data-suite-base     relative path from the page to the app root (default "./")
       data-suite-settings present: show a link to <base>config/
       data-suite-contact  e-mail address shown as a mailto: link (optional)

   STRINGS
     core.chrome.appName   the app's name, shown in the header: each app
                           defines it in its own locale files (es and en)
     core.chrome.about     link to <base>about/
     core.chrome.legal     link to <base>legal/
     core.chrome.settings  link to <base>config/ (only with data-suite-settings)
     core.chrome.byline    the words before "Apptonomia" in the byline
   The labels above have built-in es and en defaults below, so an app needs
   no strings for them. An app may still define its own wording for any of
   them in its locale files; an app's value wins over the default.

   LOCALE
     The labels carry data-suite-label, so the app's own translation pass
     does not touch them. They are redrawn when <html lang> or data-lang changes,
     which every app does when the reader picks a language. The header name keeps
     data-i18n, so the app's locale switch re-applies it as before.

   Node-free, dependency-free, ES5 like the rest of the suite. Depends only
   on App.i18n.t (optional: falls back to showing the key) and on the
   #locale-picker mount, which the app's locale-picker.js fills. */

(function () {
  'use strict';

  window.App = window.App || {};

  /* Built-in labels, used when the app has no string for a key. */
  var DEFAULTS = {
    es: {
      'core.chrome.about': 'Sobre la app',
      'core.chrome.legal': 'Protección de datos',
      'core.chrome.settings': 'Ajustes',
      'core.chrome.byline': 'Una app de'
    },
    en: {
      'core.chrome.about': 'About the app',
      'core.chrome.legal': 'Data protection',
      'core.chrome.settings': 'Settings',
      'core.chrome.byline': 'An app by'
    }
  };

  var PORTAL = 'https://apptonomia.uk/';

  function defaultLabel(key) {
    var lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'es';
    var table = DEFAULTS[lang.slice(0, 2) === 'en' ? 'en' : 'es'];
    return table[key] || key;
  }

  function translate(key) {
    var i18n = window.App && window.App.i18n;
    var value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : key;
    return value && value !== key ? value : defaultLabel(key);
  }

  /* Redraws the labels. They carry data-suite-label, not data-i18n, so the
     app's own translation pass never touches them: the labels are drawn here, in
     the language of the page, and redrawn whenever <html lang> or data-lang changes. */
  function refreshLabels() {
    var labels = document.querySelectorAll('[data-suite-label]');
    for (var i = 0; i < labels.length; i++) {
      labels[i].textContent = translate(labels[i].getAttribute('data-suite-label'));
    }
  }

  /* Creates an element with optional class, attributes and translatable text. */
  function make(tag, className, attrs, i18nKey) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      for (var name in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, name)) node.setAttribute(name, attrs[name]);
      }
    }
    if (i18nKey) {
      node.setAttribute('data-i18n', i18nKey);
      node.textContent = translate(i18nKey);
    }
    return node;
  }

  /* "Una app de Apptonomia." — the label is redrawn with the language, the
     portal name is not translated. */
  function byline(portal) {
    var p = make('p', 'suite-chrome-byline');
    p.appendChild(make('span', null, { 'data-suite-label': 'core.chrome.byline' })).textContent = translate('core.chrome.byline');
    p.appendChild(document.createTextNode(' '));
    var link = make('a', null, { href: portal });
    link.textContent = 'Apptonomia';
    p.appendChild(link);
    p.appendChild(document.createTextNode('.'));
    return p;
  }

  /* A header mount draws the brand (unless data-suite-brand="off"), the activity
     block of a subpage (if the page has one), and the controls row: the stars
     counter and the locale picker. */
  function renderHeader(mount) {
    if (mount.getAttribute('data-suite-brand') !== 'off') {
      var brand = make('div', 'suite-chrome-brand');
      var logo = mount.getAttribute('data-suite-logo');
      var glyph = mount.getAttribute('data-suite-mark');
      if (logo) {
        brand.appendChild(make('img', 'suite-chrome-logo', { src: logo, alt: '', width: '44', height: '44' }));
      } else if (glyph) {
        brand.appendChild(make('span', 'suite-chrome-mark', { 'aria-hidden': 'true' })).textContent = glyph;
      }
      var copy = make('div', 'suite-chrome-brand-copy');
      var name = make('p', 'suite-chrome-name', null, 'core.chrome.appName');
      /* A page with no locale strings (an about/ or legal/ page that loads no
         i18n core) has no core.chrome.appName to show, so it names the app itself. */
      var fallbackName = mount.getAttribute('data-suite-name');
      if (fallbackName && translate('core.chrome.appName') === 'core.chrome.appName') name.textContent = fallbackName;
      copy.appendChild(name);
      if (mount.hasAttribute('data-suite-byline')) {
        copy.appendChild(byline(mount.getAttribute('data-suite-portal') || PORTAL));
      }
      brand.appendChild(copy);
      mount.appendChild(brand);
    }

    /* The activity block (back link, icon, title of a subpage) goes in the middle
       of the row. The page keeps the node: it is moved, not copied. */
    var activity = document.querySelector('[data-suite-activity]');
    if (activity) mount.appendChild(activity);

    var controls = make('div', 'suite-chrome-controls');
    /* An app's star counter (data-suite-stars, wherever the app puts it) moves
       into this row, before the settings gear, so the counter and the gear share
       one line on every page. The node is moved, not copied: the app keeps its
       reference and its id, so its own script keeps updating the same element. */
    var stars = document.querySelector('[data-suite-stars]');
    if (stars) controls.appendChild(stars);
    controls.appendChild(make('div', null, { id: 'locale-picker' }));
    mount.appendChild(controls);
  }

  function linkItem(href, labelKey) {
    var item = make('li');
    var link = make('a', null, { href: href, 'data-suite-label': labelKey });
    link.textContent = translate(labelKey);
    item.appendChild(link);
    return item;
  }

  function renderFooter(mount) {
    var base = mount.getAttribute('data-suite-base') || './';
    var contact = mount.getAttribute('data-suite-contact');

    var list = make('ul', 'suite-chrome-links');
    list.appendChild(linkItem(base + 'about/', 'core.chrome.about'));
    list.appendChild(linkItem(base + 'legal/', 'core.chrome.legal'));
    if (mount.hasAttribute('data-suite-settings')) {
      list.appendChild(linkItem(base + 'config/', 'core.chrome.settings'));
    }
    if (contact) {
      var mail = make('li');
      mail.appendChild(make('a', null, { href: 'mailto:' + contact }));
      mail.firstChild.textContent = contact;
      list.appendChild(mail);
    }
    mount.appendChild(list);
  }

  /* Fills every empty [data-suite-header] and [data-suite-footer] mount. */
  function render() {
    var headers = document.querySelectorAll('[data-suite-header]');
    for (var h = 0; h < headers.length; h++) {
      if (headers[h].childNodes.length !== 0) continue;
      if (headers[h].getAttribute('data-suite-brand') !== 'off') headers[h].classList.add('suite-chrome-header');
      renderHeader(headers[h]);
    }
    var footers = document.querySelectorAll('[data-suite-footer]');
    for (var f = 0; f < footers.length; f++) {
      if (footers[f].childNodes.length !== 0) continue;
      footers[f].classList.add('suite-chrome-footer');
      renderFooter(footers[f]);
    }
  }

  window.App.chrome = { render: render };

  /* The script sits at the end of <body>, so the mounts above it already exist and
     the picker is drawn before the deferred locale-picker.js runs. DOMContentLoaded
     covers a script placed in <head>; render() skips mounts that are already filled. */
  render();
  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('load', refreshLabels);

  /* Language changes: every app sets <html lang> or data-lang when the reader picks
     another language, so the footer labels follow without any code in the app. */
  if (window.MutationObserver) {
    new MutationObserver(refreshLabels).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang', 'data-lang']
    });
  }
})();
