/* ==========================================================================
   Teclatlon — Datos
   Formato:
   - DATA.numberRow / DATA.rows: teclas del teclado español (estructura física,
     igual en todos los idiomas). Cada tecla: { ch, finger, wide?, bump?, label?, decor? }
     finger: primera letra = mano (l izquierda, r derecha) +
     p meñique, r anular, m medio, i índice. 'th' = pulgar (los dos).
     bump: la tecla tiene marca táctil (F, J y el 5 del numérico).
     wide: true = muy ancha (espacio), 'media' = ancha (Tab, Intro...).
     decor: tecla decorativa (Tab, Mayús, Intro, Borrar). No tiene "ch":
     solo da forma real al teclado, nunca es objetivo de un ejercicio.
     'label' es un id ('espacio'|'tab'|'mayus'|'intro'|'borrar'): el texto
     visible se busca en strings.js con App.i18n.t('teclaLabel.' + label).
   - Los nombres de los dedos (mano, nombre) NO están aquí: son texto y
     viven en strings.js bajo 'dedo.<id>.mano' / '.nombre' (ver DATA con
     los ids lp/lr/lm/li/ri/rm/rr/rp/th usados en 'finger').
   - DATA.numpad / DATA.numpadFingers: teclado numérico (mano derecha).
   - Contenido de práctica por idioma (textos de instrucción y palabras):
     DATA.placement, DATA.lessons, DATA.words, DATA.numpadSteps son
     objetos { es: [...], en: [...] }. app.js los usa con
     DATA.placement[App.i18n.locale()], etc.
   - DATA.layouts: los teclados visuales que se pueden elegir
     (simplificado / normal / extendido). Son SIEMPRE decorativos
     (pointer-events: none en CSS): la entrada real es el teclado físico
     del ordenador. "extendido" añade el teclado numérico aparte (ver
     DATA.numpad); eso se dibuja en app.js.
   Para ampliar: añadir una lección o palabra nueva a AMBOS idiomas
   (es y en) en el array correspondiente.
   ========================================================================== */

const DATA = {

  numberRow: [
    { ch: '1', finger: 'lp' }, { ch: '2', finger: 'lr' },
    { ch: '3', finger: 'lm' }, { ch: '4', finger: 'li' },
    { ch: '5', finger: 'li' }, { ch: '6', finger: 'ri' },
    { ch: '7', finger: 'ri' }, { ch: '8', finger: 'rm' },
    { ch: '9', finger: 'rr' }, { ch: '0', finger: 'rp' }
  ],

  rows: [
    [
      { ch: 'q', finger: 'lp' }, { ch: 'w', finger: 'lr' },
      { ch: 'e', finger: 'lm' }, { ch: 'r', finger: 'li' },
      { ch: 't', finger: 'li' }, { ch: 'y', finger: 'ri' },
      { ch: 'u', finger: 'ri' }, { ch: 'i', finger: 'rm' },
      { ch: 'o', finger: 'rr' }, { ch: 'p', finger: 'rp' }
    ],
    [
      { ch: 'a', finger: 'lp' }, { ch: 's', finger: 'lr' },
      { ch: 'd', finger: 'lm' }, { ch: 'f', finger: 'li', bump: true },
      { ch: 'g', finger: 'li' }, { ch: 'h', finger: 'ri' },
      { ch: 'j', finger: 'ri', bump: true }, { ch: 'k', finger: 'rm' },
      { ch: 'l', finger: 'rr' }, { ch: 'ñ', finger: 'rp' }
    ],
    [
      { ch: 'z', finger: 'lp' }, { ch: 'x', finger: 'lr' },
      { ch: 'c', finger: 'lm' }, { ch: 'v', finger: 'li' },
      { ch: 'b', finger: 'li' }, { ch: 'n', finger: 'ri' },
      { ch: 'm', finger: 'ri' }, { ch: ',', finger: 'rm' },
      { ch: '.', finger: 'rr' }, { ch: '-', finger: 'rp' }
    ],
    [
      { ch: ' ', finger: 'th', wide: true, label: 'espacio' }
    ]
  ],

  numpad: [
    [{ ch: '7', finger: 'ri' }, { ch: '8', finger: 'rm' }, { ch: '9', finger: 'rr' }],
    [{ ch: '4', finger: 'ri' }, { ch: '5', finger: 'rm', bump: true }, { ch: '6', finger: 'rr' }],
    [{ ch: '1', finger: 'ri' }, { ch: '2', finger: 'rm' }, { ch: '3', finger: 'rr' }],
    [{ ch: '0', finger: 'th', wide: true }, { ch: '.', finger: 'rr' }]
  ],

  numpadFingers: {
    '7': 'ri', '8': 'rm', '9': 'rr',
    '4': 'ri', '5': 'rm', '6': 'rr',
    '1': 'ri', '2': 'rm', '3': 'rr',
    '0': 'th', '.': 'rr'
  },

  placement: {
    es: [
      { text: 'Mira la tecla F. Tiene una marca. Se nota al tocarla. Pon encima el dedo índice izquierdo. Púlsala.', seq: 'f' },
      { text: 'Mira la tecla J. También tiene una marca. Pon encima el dedo índice derecho. Púlsala.', seq: 'j' },
      { text: 'Pon la mano izquierda en las teclas A, S, D y F. Un dedo en cada tecla. Púlsalas en orden.', seq: 'asdf' },
      { text: 'Pon la mano derecha en las teclas J, K, L y Ñ. Un dedo en cada tecla. Púlsalas en orden.', seq: 'jklñ' },
      { text: 'Los pulgares van en la tecla larga de abajo. Es el espacio. Púlsalo.', seq: ' ' },
      { text: '¡Muy bien! Ahora todo seguido. Pulsa las teclas en orden.', seq: 'asdf jklñ' }
    ],
    en: [
      { text: 'Look at the F key. It has a bump. You can feel it. Put your left index finger on it. Press it.', seq: 'f' },
      { text: 'Look at the J key. It also has a bump. Put your right index finger on it. Press it.', seq: 'j' },
      { text: 'Put your left hand on the A, S, D and F keys. One finger on each key. Press them in order.', seq: 'asdf' },
      { text: 'Put your right hand on the J, K, L and Ñ keys. One finger on each key. Press them in order.', seq: 'jklñ' },
      { text: 'Your thumbs go on the long key at the bottom. It is the space bar. Press it.', seq: ' ' },
      { text: 'Well done! Now all together. Press the keys in order.', seq: 'asdf jklñ' }
    ]
  },

  lessons: {
    es: [
      { id: 'l1', title: 'F y J', intro: 'Pon el índice izquierdo en la F. Pon el índice derecho en la J. Las dos teclas tienen una marca.',
        steps: ['f', 'j', 'fj', 'ffjj', 'fjfj'] },
      { id: 'l2', title: 'D y K', intro: 'La D va con el dedo medio izquierdo. La K va con el dedo medio derecho.',
        steps: ['d', 'k', 'dk', 'ddkk', 'fdjk'] },
      { id: 'l3', title: 'S y L', intro: 'La S va con el dedo anular izquierdo. La L va con el dedo anular derecho.',
        steps: ['s', 'l', 'sl', 'ssll', 'slfj'] },
      { id: 'l4', title: 'A y Ñ', intro: 'La A va con el meñique izquierdo. La Ñ va con el meñique derecho.',
        steps: ['a', 'ñ', 'añ', 'asdf', 'jklñ'] },
      { id: 'l5', title: 'El espacio', intro: 'El espacio es la tecla larga de abajo. Se pulsa con el pulgar.',
        steps: ['f j', 'a s', 'ja ja', 'fa la'] },
      { id: 'l6', title: 'G y H', intro: 'Estira el dedo índice hacia el centro. Después vuelve a su tecla.',
        steps: ['fgf', 'jhj', 'gh', 'gafas', 'hada'] },
      { id: 'l7', title: 'E e I', intro: 'Sube el dedo medio a la fila de arriba. Después vuelve a su tecla.',
        steps: ['ded', 'kik', 'ei', 'seda', 'silla'] },
      { id: 'l8', title: 'R y U', intro: 'Sube el dedo índice a la fila de arriba. Después vuelve a su tecla.',
        steps: ['frf', 'juj', 'ru', 'risa', 'jugar'] },
      { id: 'l9', title: 'T e Y', intro: 'Estira el dedo índice hacia arriba. Después vuelve a su tecla.',
        steps: ['ftf', 'jyj', 'ty', 'tarta', 'yate'] },
      { id: 'l10', title: 'O y P', intro: 'Sube el anular y el meñique de la mano derecha.',
        steps: ['lol', 'ñpñ', 'op', 'sopa', 'pelota'] },
      { id: 'l11', title: 'Q y W', intro: 'Sube el meñique y el anular de la mano izquierda.',
        steps: ['aqa', 'sws', 'qw', 'queso', 'quiero'] },
      { id: 'l12', title: 'N y M', intro: 'Baja el dedo índice derecho a la fila de abajo. Después vuelve.',
        steps: ['jnj', 'jmj', 'nm', 'mano', 'luna'] },
      { id: 'l13', title: 'C, V y B', intro: 'Baja los dedos de la mano izquierda a la fila de abajo. Después vuelve.',
        steps: ['dcd', 'fvf', 'fbf', 'vaca', 'boca'] },
      { id: 'l14', title: 'Z y X', intro: 'Baja el meñique y el anular de la mano izquierda. Después vuelve.',
        steps: ['aza', 'sxs', 'zx', 'zumo', 'taxi'] },
      { id: 'l15', title: 'Frases cortas', intro: 'Ya conoces todas las letras. Escribe frases cortas.',
        steps: ['hola', 'me gusta', 'buenos dias', 'hola amigo'] }
    ],
    en: [
      { id: 'l1', title: 'F and J', intro: 'Put your left index finger on F. Put your right index finger on J. Both keys have a bump.',
        steps: ['f', 'j', 'fj', 'ffjj', 'fjfj'] },
      { id: 'l2', title: 'D and K', intro: 'D goes with your left middle finger. K goes with your right middle finger.',
        steps: ['d', 'k', 'dk', 'ddkk', 'fdjk'] },
      { id: 'l3', title: 'S and L', intro: 'S goes with your left ring finger. L goes with your right ring finger.',
        steps: ['s', 'l', 'sl', 'ssll', 'slfj'] },
      { id: 'l4', title: 'A and Ñ', intro: 'A goes with your left little finger. Ñ goes with your right little finger.',
        steps: ['a', 'ñ', 'añ', 'asdf', 'jklñ'] },
      { id: 'l5', title: 'The space bar', intro: 'The space bar is the long key at the bottom. Press it with your thumb.',
        steps: ['f j', 'a s', 'ja ja', 'fa la'] },
      { id: 'l6', title: 'G and H', intro: 'Stretch your index finger to the middle. Then go back to your key.',
        steps: ['fgf', 'jhj', 'gh', 'gag', 'had'] },
      { id: 'l7', title: 'E and I', intro: 'Move your middle finger up a row. Then go back to your key.',
        steps: ['ded', 'kik', 'ei', 'seed', 'kite'] },
      { id: 'l8', title: 'R and U', intro: 'Move your index finger up a row. Then go back to your key.',
        steps: ['frf', 'juj', 'ru', 'rug', 'jug'] },
      { id: 'l9', title: 'T and Y', intro: 'Stretch your index finger up. Then go back to your key.',
        steps: ['ftf', 'jyj', 'ty', 'tidy', 'tray'] },
      { id: 'l10', title: 'O and P', intro: 'Move up the ring and little fingers of your right hand.',
        steps: ['lol', 'ñpñ', 'op', 'stop', 'pool'] },
      { id: 'l11', title: 'Q and W', intro: 'Move up the little and ring fingers of your left hand.',
        steps: ['aqa', 'sws', 'qw', 'quiet', 'water'] },
      { id: 'l12', title: 'N and M', intro: 'Move your right index finger down a row. Then go back.',
        steps: ['jnj', 'jmj', 'nm', 'moon', 'name'] },
      { id: 'l13', title: 'C, V and B', intro: 'Move your left hand fingers down a row. Then go back.',
        steps: ['dcd', 'fvf', 'fbf', 'cave', 'boat'] },
      { id: 'l14', title: 'Z and X', intro: 'Move down the little and ring fingers of your left hand.',
        steps: ['aza', 'sxs', 'zx', 'zoo', 'taxi'] },
      { id: 'l15', title: 'Short sentences', intro: 'You know all the letters now. Type short sentences.',
        steps: ['hi there', 'i like it', 'good morning', 'hi my friend'] }
    ]
  },

  words: {
    es: ['hola', 'casa', 'gato', 'perro', 'sol', 'luna', 'agua', 'pan',
      'mesa', 'silla', 'mano', 'flor', 'boca', 'queso', 'pelota',
      'amigo', 'verde', 'azul', 'leche', 'libro'],
    en: ['hello', 'house', 'cat', 'dog', 'sun', 'moon', 'water', 'bread',
      'table', 'chair', 'hand', 'flower', 'mouth', 'cheese', 'ball',
      'friend', 'green', 'blue', 'milk', 'book']
  },

  numpadSteps: {
    es: [
      { text: 'Mira el número 5. Tiene una marca. Pon encima el dedo medio de la mano derecha. Púlsalo.', seq: '5' },
      { text: 'El 4 va con el dedo índice. Pulsa 4, 5, 4. Vuelve siempre al centro.', seq: '454' },
      { text: 'El 6 va con el dedo anular. Pulsa 6, 5, 6. Vuelve siempre al centro.', seq: '656' },
      { text: 'Sube el dedo medio al 8. Después vuelve al 5.', seq: '585' },
      { text: 'Baja el dedo medio al 2. Después vuelve al 5.', seq: '525' },
      { text: 'Escribe los números de la fila del centro.', seq: '456' },
      { text: 'Ahora la fila de arriba.', seq: '789' },
      { text: 'Ahora la fila de abajo.', seq: '123' },
      { text: 'El 0 es la tecla larga. Púlsala con el pulgar.', seq: '0' },
      { text: '¡Muy bien! Escribe estos números.', seq: '159' },
      { text: 'Y estos también.', seq: '753' },
      { text: 'Los últimos.', seq: '2580' },
      { text: 'Hay un punto al lado del 0. Se usa para el dinero, como 2.50 euros. Púlsalo.', seq: '.' },
      { text: 'Escribe este precio.', seq: '2.50' },
      { text: 'Y este otro.', seq: '10.75' },
      { text: 'Escribe tu código postal, número a número. Aquí tienes uno de ejemplo.', seq: '28001' },
      { text: '¡El último! Escribe este número de teléfono.', seq: '600123456' }
    ],
    en: [
      { text: 'Look at the number 5. It has a bump. Put your right middle finger on it. Press it.', seq: '5' },
      { text: '4 goes with your index finger. Press 4, 5, 4. Always go back to the middle.', seq: '454' },
      { text: '6 goes with your ring finger. Press 6, 5, 6. Always go back to the middle.', seq: '656' },
      { text: 'Move your middle finger up to 8. Then go back to 5.', seq: '585' },
      { text: 'Move your middle finger down to 2. Then go back to 5.', seq: '525' },
      { text: 'Type the numbers in the middle row.', seq: '456' },
      { text: 'Now the top row.', seq: '789' },
      { text: 'Now the bottom row.', seq: '123' },
      { text: '0 is the long key. Press it with your thumb.', seq: '0' },
      { text: 'Well done! Type these numbers.', seq: '159' },
      { text: 'And these too.', seq: '753' },
      { text: 'The last ones.', seq: '2580' },
      { text: 'There is a dot next to 0. It is used for money, like 2.50 euros. Press it.', seq: '.' },
      { text: 'Type this price.', seq: '2.50' },
      { text: 'And this other one.', seq: '10.75' },
      { text: 'Type your postal code, number by number. Here is an example.', seq: '28001' },
      { text: 'The last one! Type this phone number.', seq: '600123456' }
    ]
  }
};

/* Tecla decorativa: da forma real al teclado pero no se puede pulsar
   en un ejercicio (no tiene "ch"). 'label' es un id: el texto visible
   se busca en strings.js con App.i18n.t('teclaLabel.' + label). */
function teclaDecorativa(finger, wide, label) {
  return { ch: null, finger: finger, wide: wide, decor: true, label: label };
}

DATA.layouts = {
  /* Letters only: the classic touch-typing method. */
  simplificado: [DATA.rows[0], DATA.rows[1], DATA.rows[2], DATA.rows[3]],

  /* Full computer keyboard: numbers on top and function keys
     around it (Tab, Shift, Enter, Backspace), like a real one. */
  normal: [
    DATA.numberRow.concat([teclaDecorativa('rp', 'media', 'borrar')]),
    [teclaDecorativa('lp', 'media', 'tab')].concat(DATA.rows[0]),
    [teclaDecorativa('lp', 'media', 'mayus')].concat(DATA.rows[1]).concat([teclaDecorativa('rp', 'media', 'intro')]),
    [teclaDecorativa('lp', 'media', 'mayus')].concat(DATA.rows[2]).concat([teclaDecorativa('rp', 'media', 'mayus')]),
    DATA.rows[3]
  ]
};

/* Extendido: el mismo teclado normal, y aparte se ve el teclado
   numérico (DATA.numpad) para practicar los dos juntos. */
DATA.layouts.extendido = DATA.layouts.normal;
