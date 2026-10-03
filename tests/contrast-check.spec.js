/* Medición real de contraste de texto por tema.
   ui-smoke.js valida sintaxis/enlaces pero NO aserta nada de layout ni
   color, así que un token pisado por un color hardcodeado pasa todas las
   validaciones. Este test mide lo que el ojo ve: color computed contra
   el fondo efectivo, para cada tema. */
const { test, expect } = require('playwright/test');

const THEMES = ['light', 'dark', 'contrast'];

/* Corre dentro de la página: recorre el texto visible de la pantalla
   que haya abierta y devuelve una fila por cada fragmento de texto con
   color propio. Se exporta como función (no como arrow en línea) porque
   la miden varias pantallas: si cada una se midiera con su propia copia,
   medir sólo el menú dejaría sin comprobar lo que sólo se ve dentro de
   un modo, que es donde antes se colaron los colores ilegibles. */
function measure() {
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((n) => parseFloat(n));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (fg, bg) => {
    const a = lum(fg);
    const b = lum(bg);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  };
  // Fondo efectivo: sube por los ancestros hasta algo opaco.
  const bgOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.9) return c;
      node = node.parentElement;
    }
    const body = parse(getComputedStyle(document.body).backgroundColor);
    const html = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (body && body.a > 0.9) return body;
    return html && html.a > 0.9 ? html : { r: 255, g: 255, b: 255, a: 1 };
  };

  const sel = 'h1,h2,h3,h4,p,li,label,button,a,span.name,span.detail,span.picto,td,th,legend,summary';
  const rows = [];
  const seen = new Set();

  // El aviso "solo en ordenador" vive en un overlay oculto por
  // defecto; se fuerza visible para medirlo, porque su CSS tenía
  // colores fijos que en oscuro quedaban ilegibles.
  const mb = document.getElementById('mobileBlock');
  if (mb) {
    mb.hidden = false;
    mb.removeAttribute('hidden');
  }

  document.querySelectorAll(sel).forEach((el) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    // Solo texto propio, no contenedores que heredan de hijos.
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim())
      .join(' ');
    if (!own) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    if (parseFloat(cs.opacity) < 0.5) return;

    const fg = parse(cs.color);
    if (!fg || fg.a < 0.5) return;
    const bg = bgOf(el);
    const px = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = px >= 24 || (px >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const r2 = ratio(fg, bg);
    const key = el.tagName + '.' + el.className + '|' + own.slice(0, 20);
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || ''),
      /* True for anything inside the dictation panel, matched by DOM
         ancestry and not by class name: the step list items carry no
         class, so a class filter would quietly drop the very text the
         panel exists to show. */
      inPanel: !!el.closest('#dictationPanel'),
      text: own.slice(0, 42),
      fg: cs.color,
      bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      px,
      weight,
      ratio: Math.round(r2 * 100) / 100,
      need,
      low: r2 < need,
    });
  });
  return rows;
}

test.describe('contraste de texto por tema', () => {
  for (const theme of THEMES) {
    test(`tema ${theme}`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      // Force el tema antes de que la app pueda sobrescribirlo.
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      // Avanza a la pantalla de menú: tiene mucho más texto visible que
      // la pantalla del nombre, así el muestreo es representativo.
      await page.evaluate(() => {
        const skip = document.querySelector('#btnSkipName');
        if (skip) skip.click();
      });
      await page.waitForTimeout(600);

      const report = await page.evaluate(measure);

      console.log(`\n=== tema ${theme}: ${report.length} textos comprobados ===`);
      const low = report.filter((r) => r.low);
      if (low.length) {
        console.log(`BAJO CONTRASTE (${low.length}):`);
        low.forEach((r) => console.log(
          `  ${r.tag}.${r.cls} "${r.text}" → ratio ${r.ratio} (min ${r.need}) ${r.px}px/${r.weight} fg=${r.fg} bg=${r.bg}`
        ));
      } else {
        console.log('OK: ningún texto bajo contraste');
      }
      const worst = report.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 5);
      console.log('peores:', worst.map((r) => `${r.tag}.${r.cls}=${r.ratio}`).join(' '));

      expect(consoleErrors, `errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
      expect(low.map((r) => `${r.tag}.${r.cls} ${r.ratio}<${r.need}`)).toEqual([]);
    });
  }
});

/* El dictado sólo existe dentro de su modo, así que midiendo sólo el
   menú —que es todo lo que hacía esta spec— su panel quedaba sin
   comprobar en ningún tema, y su letra en pantalla pinta el texto sobre
   el tinte de acento. Es exactamente el tipo de texto que hay que
   medir y no suponer. Cada test fuerza la condición de "sin voces",
   que es la única en la que la letra llega a verse. */
test.describe('contraste de la pantalla de dictado', () => {
  for (const theme of THEMES) {
    test(`tema ${theme}`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      /* The on-screen letter only exists on a machine with no voice, so
         the condition is forced instead of trusted: this browser may or
         may not have voices installed, and the test has to measure the
         same screen every time. */
      await page.addInitScript(() => { window.speechSynthesis.getVoices = () => []; });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.evaluate(() => {
        const skip = document.querySelector('#btnSkipName');
        if (skip) skip.click();
      });
      await page.waitForTimeout(400);
      await page.locator('[data-mode="dictation"]').click();
      await expect(page.locator('#dictationPanel')).toBeVisible();
      /* El panel aparece antes de que el navegador decida si tiene
         voces; sin ellas la letra se muestra tras un sondeo corto. */
      await expect(page.locator('#dictationFallback')).toBeVisible();
      await page.waitForTimeout(300);

      const report = await page.evaluate(measure);
      const mine = report.filter((r) => r.inPanel);
      /* 4 steps + title + note + letter + replay button. Counting them
         keeps the check honest: a filter that quietly matches nothing
         would report a green screen it never looked at. */
      expect(mine.length, 'el panel de dictado debe tener todo su texto medido').toBe(8);

      console.log(`\n=== dictado, tema ${theme}: ${mine.length} textos ===`);
      mine.forEach((r) => console.log(
        `  ${r.cls} "${r.text}" → ${r.ratio} (min ${r.need}) ${r.px}px/${r.weight} fg=${r.fg} bg=${r.bg}`
      ));

      expect(consoleErrors, `errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
      expect(mine.filter((r) => r.low).map((r) => `${r.cls} ${r.ratio}<${r.need}`)).toEqual([]);
    });
  }
});

/* La escala de texto debe moverse entera, no solo --text-base: si el
   texto de apoyo se queda por debajo del normal, la jerarquía se
   invierte en "huge" y el texto pequeño queda por debajo de 16px. */
test.describe('escala de tamaño del texto', () => {
  const STEPS = ['small', 'normal', 'large', 'huge'];

  test('la base crece de forma monótona', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const sizes = {};
    for (const step of STEPS) {
      sizes[step] = await page.evaluate((s) => {
        if (s === 'normal') document.documentElement.removeAttribute('data-text-size');
        else document.documentElement.setAttribute('data-text-size', s);
        return getComputedStyle(document.documentElement).getPropertyValue('--text-base').trim();
      }, step);
    }
    console.log('  --text-base por paso:', JSON.stringify(sizes));
    const num = (v) => parseFloat(v);
    expect(num(sizes.small)).toBeLessThan(num(sizes.normal));
    expect(num(sizes.normal)).toBeLessThan(num(sizes.large));
    expect(num(sizes.large)).toBeLessThan(num(sizes.huge));
  });

  test('ningún tamaño de texto baja de 12px en el paso más grande', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Los tokens derivados usan calc(), que getPropertyValue devuelve
    // sin resolver: hay que medirlos sobre un elemento real.
    const tokens = await page.evaluate(() => {
      document.documentElement.setAttribute('data-text-size', 'huge');
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;font-size:var(--text-small)';
      document.body.appendChild(probe);
      const read = (v) => parseFloat(getComputedStyle(probe).fontSize);
      const small = read('var(--text-small)');
      probe.style.fontSize = 'var(--text-base)';
      const base = read('var(--text-base)');
      probe.style.fontSize = 'var(--text-large)';
      const large = read('var(--text-large)');
      probe.style.fontSize = 'var(--text-title)';
      const title = read('var(--text-title)');
      probe.remove();
      return { '--text-small': small, '--text-base': base, '--text-large': large, '--text-title': title };
    });
    console.log('  tokens en huge:', JSON.stringify(tokens));
    // Jerarquía: apoyo < normal < grande < titular, siempre en ese orden.
    expect(tokens['--text-small'], 'small < base').toBeLessThan(tokens['--text-base']);
    expect(tokens['--text-base'], 'base < large').toBeLessThan(tokens['--text-large']);
    expect(tokens['--text-large'], 'large < title').toBeLessThan(tokens['--text-title']);
    // Y nada por debajo del mínimo legible, en ningún paso.
    const bad = Object.entries(tokens).filter(([, v]) => !v || v < 12);
    expect(bad.map(([t, v]) => `${t}=${v}px < 12px`)).toEqual([]);
  });
});
