/* suite-chrome.js — shared header and footer of every suite app.
   ONE definition for the whole suite. Canonical source:
   apptonomia/scripts/suite/suite-chrome.js. Copied byte for byte to
   assets/js/suite-chrome.js (or js/suite-chrome.js in the scaffold) by
   apptonomia/scripts/sync-suite-chrome.js. Never edit a copy by hand.

   USAGE (in the page, inside <body>):

     <header data-suite-header data-suite-mark="A"></header>
     <main> ... </main>
     <footer data-suite-footer
             data-suite-base="./"
             data-suite-portal="https://apptonomia.uk/"
             data-suite-settings
             data-suite-contact="hello@apptonomia.uk"></footer>

   Both mounts are optional. A mount that already has children is skipped,
   so a page can keep its own markup while it migrates.

   ATTRIBUTES
     header:
       data-suite-mark     short non-translatable glyph in the brand tile (optional)
       data-suite-brand    "off": draw only the locale picker, no app name (the page title names the app)
     footer:
       data-suite-base     relative path from the page to the app root (default "./")
       data-suite-portal   absolute URL of the suite portal (default "https://apptonomia.uk/")
       data-suite-settings present: show a link to <base>config/
       data-suite-contact  e-mail address shown as a mailto: link (optional)

   STRINGS (every app puts them in its own strings.<locale>.js, es and en):
     core.chrome.appName   name of the app, shown in the header
     core.chrome.portal    "back to the portal" link
     core.chrome.about     link to <base>about/
     core.chrome.legal     link to <base>legal/
     core.chrome.settings  link to <base>config/ (only with data-suite-settings)

   LOCALE
     Labels are written with data-i18n, so the app's own locale switch
     re-applies them without any code here. The app must re-apply every
     [data-i18n] node when the language changes.

   Node-free, dependency-free, ES5 like the rest of the suite. Depends only
   on App.i18n.t (optional: falls back to showing the key) and on the
   #locale-picker mount, which the app's locale-picker.js fills. */

(function () {
  'use strict';

  window.App = window.App || {};

  function translate(key) {
    var i18n = window.App && window.App.i18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(key) : key;
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

  /* A header mount draws the brand (unless data-suite-brand="off") and the
     locale picker. Pages whose own title already names the app switch the
     brand off, so the picker can take the place of the old control block. */
  function renderHeader(mount) {
    if (mount.getAttribute('data-suite-brand') !== 'off') {
      var brand = make('div', 'suite-chrome-brand');
      var glyph = mount.getAttribute('data-suite-mark');
      if (glyph) {
        brand.appendChild(make('span', 'suite-chrome-mark', { 'aria-hidden': 'true' })).textContent = glyph;
      }
      brand.appendChild(make('p', 'suite-chrome-name', null, 'core.chrome.appName'));
      mount.appendChild(brand);
    }

    var controls = make('div', 'suite-chrome-controls');
    controls.appendChild(make('div', null, { id: 'locale-picker' }));
    mount.appendChild(controls);
  }

  function linkItem(href, i18nKey) {
    var item = make('li');
    item.appendChild(make('a', null, { href: href }, i18nKey));
    return item;
  }

  function renderFooter(mount) {
    var base = mount.getAttribute('data-suite-base') || './';
    var portal = mount.getAttribute('data-suite-portal') || 'https://apptonomia.uk/';
    var contact = mount.getAttribute('data-suite-contact');

    var list = make('ul', 'suite-chrome-links');
    list.appendChild(linkItem(portal, 'core.chrome.portal'));
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
})();
