/* ==========================================================================
   Teclatlon — Data
   Shape:
   - DATA.numberRow / DATA.rows: keys of the Spanish physical keyboard
     (physical layout, same in every language). Each key: { ch, finger,
     wide?, bump?, label?, decor? }
     finger: first letter = hand (l left, r right) +
     p pinky, r ring, m middle, i index. 'th' = thumb (both).
     bump: the key has a tactile bump (F, J and the numpad 5).
     wide: true = very wide (space), 'media' = wide (Tab, Enter...).
     decor: decorative key (Tab, Shift, Enter, Backspace). Has no "ch":
     it only gives the keyboard its real shape, never a lesson target.
     'label' is an id ('space'|'tab'|'shift'|'enter'|'backspace'): the
     visible text is looked up in strings.js with
     App.i18n.t('keyLabel.' + label).
   - Finger names (hand, name) are NOT here: they are text and live in
     strings.js under 'finger.<id>.hand' / '.name' (see the ids
     lp/lr/lm/li/ri/rm/rr/rp/th used in 'finger').
   - DATA.numpad / DATA.numpadFingers: number pad (right hand).
   - Per-language practice content (instruction text and words):
     DATA.placement, DATA.lessons, DATA.words, DATA.numpadSteps are
     objects { es: [...], en: [...] }. app.js reads them with
     DATA.placement[App.i18n.locale()], etc.
   - DATA.layouts: the selectable visual keyboards (simple / normal /
     extended). Always decorative (pointer-events: none in CSS): the
     real input is the computer's physical keyboard. "extended" adds
     the number pad separately (see DATA.numpad); that is drawn in
     app.js.
   To extend: add a new lesson or word to BOTH languages (es and en)
   in the matching array.
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
      { ch: ' ', finger: 'th', wide: true, label: 'space' }
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
        keys: ['f', 'j'],
        steps: ['f', 'j', 'fj', 'ffjj', 'fjfj'] },
      { id: 'l2', title: 'D y K', intro: 'La D va con el dedo medio izquierdo. La K va con el dedo medio derecho.',
        keys: ['d', 'k'],
        steps: ['d', 'k', 'dk', 'ddkk', 'fdjk'] },
      { id: 'l3', title: 'S y L', intro: 'La S va con el dedo anular izquierdo. La L va con el dedo anular derecho.',
        keys: ['s', 'l'],
        steps: ['s', 'l', 'sl', 'ssll', 'slfj'] },
      { id: 'l4', title: 'A y Ñ', intro: 'La A va con el meñique izquierdo. La Ñ va con el meñique derecho.',
        keys: ['a', 'ñ'],
        steps: ['a', 'ñ', 'añ', 'asdf', 'jklñ'] },
      { id: 'l5', title: 'El espacio', intro: 'El espacio es la tecla larga de abajo. Se pulsa con el pulgar.',
        keys: [' '],
        steps: ['f j', 'a s', 'ja ja', 'fa la'] },
      { id: 'l6', title: 'G y H', intro: 'Estira el dedo índice hacia el centro. Después vuelve a su tecla.',
        keys: ['g', 'h'],
        steps: ['fgf', 'jhj', 'gh', 'gafas', 'hada'] },
      { id: 'l7', title: 'E e I', intro: 'Sube el dedo medio a la fila de arriba. Después vuelve a su tecla.',
        keys: ['e', 'i'],
        steps: ['ded', 'kik', 'ei', 'seda', 'silla'] },
      { id: 'l8', title: 'R y U', intro: 'Sube el dedo índice a la fila de arriba. Después vuelve a su tecla.',
        keys: ['r', 'u'],
        steps: ['frf', 'juj', 'ru', 'risa', 'jugar'] },
      { id: 'l9', title: 'T e Y', intro: 'Estira el dedo índice hacia arriba. Después vuelve a su tecla.',
        keys: ['t', 'y'],
        steps: ['ftf', 'jyj', 'ty', 'tarta', 'yate'] },
      { id: 'l10', title: 'O y P', intro: 'Sube el anular y el meñique de la mano derecha.',
        keys: ['o', 'p'],
        steps: ['lol', 'ñpñ', 'op', 'sopa', 'pelota'] },
      { id: 'l11', title: 'Q y W', intro: 'Sube el meñique y el anular de la mano izquierda.',
        keys: ['q', 'w'],
        steps: ['aqa', 'sws', 'qw', 'queso', 'quiero'] },
      { id: 'l12', title: 'N y M', intro: 'Baja el dedo índice derecho a la fila de abajo. Después vuelve.',
        keys: ['n', 'm'],
        steps: ['jnj', 'jmj', 'nm', 'mano', 'luna'] },
      { id: 'l13', title: 'C, V y B', intro: 'Baja los dedos de la mano izquierda a la fila de abajo. Después vuelve.',
        keys: ['c', 'v', 'b', ',', '.', '-'],
        steps: ['dcd', 'fvf', 'fbf', 'vaca', 'boca'] },
      { id: 'l14', title: 'Z y X', intro: 'Baja el meñique y el anular de la mano izquierda. Después vuelve.',
        keys: ['z', 'x'],
        steps: ['aza', 'sxs', 'zx', 'zumo', 'taxi'] },
      { id: 'l15', title: 'Frases cortas', intro: 'Ya conoces todas las letras. Escribe frases cortas.',
        keys: [],
        steps: ['hola', 'me gusta', 'buenos dias', 'hola amigo'] },
      { id: 'l16', title: 'Mayúsculas', intro: 'Para escribir una mayúscula, mantén pulsada la tecla Mayús con el meñique del lado contrario y pulsa la letra con la otra mano.',
        steps: ['A', 'J', 'Sa', 'Hola', 'Buenos dias'] },
      { id: 'l17', title: 'Teclas especiales', intro: 'Estas teclas no tienen un dedo fijo: usa la mano que te resulte más cómoda. Cambia a la vista de teclado "Con números al lado" para verlas dibujadas.',
        steps: [{ specialKey: 'home' }, { specialKey: 'end' }, { specialKey: 'pageUp' }, { specialKey: 'pageDown' }, { specialKey: 'delete' }] }
    ],
    en: [
      { id: 'l1', title: 'F and J', intro: 'Put your left index finger on F. Put your right index finger on J. Both keys have a bump.',
        keys: ['f', 'j'],
        steps: ['f', 'j', 'fj', 'ffjj', 'fjfj'] },
      { id: 'l2', title: 'D and K', intro: 'D goes with your left middle finger. K goes with your right middle finger.',
        keys: ['d', 'k'],
        steps: ['d', 'k', 'dk', 'ddkk', 'fdjk'] },
      { id: 'l3', title: 'S and L', intro: 'S goes with your left ring finger. L goes with your right ring finger.',
        keys: ['s', 'l'],
        steps: ['s', 'l', 'sl', 'ssll', 'slfj'] },
      { id: 'l4', title: 'A and Ñ', intro: 'A goes with your left little finger. Ñ goes with your right little finger.',
        keys: ['a', 'ñ'],
        steps: ['a', 'ñ', 'añ', 'asdf', 'jklñ'] },
      { id: 'l5', title: 'The space bar', intro: 'The space bar is the long key at the bottom. Press it with your thumb.',
        keys: [' '],
        steps: ['f j', 'a s', 'ja ja', 'fa la'] },
      { id: 'l6', title: 'G and H', intro: 'Stretch your index finger to the middle. Then go back to your key.',
        keys: ['g', 'h'],
        steps: ['fgf', 'jhj', 'gh', 'gag', 'had'] },
      { id: 'l7', title: 'E and I', intro: 'Move your middle finger up a row. Then go back to your key.',
        keys: ['e', 'i'],
        steps: ['ded', 'kik', 'ei', 'seed', 'kite'] },
      { id: 'l8', title: 'R and U', intro: 'Move your index finger up a row. Then go back to your key.',
        keys: ['r', 'u'],
        steps: ['frf', 'juj', 'ru', 'rug', 'jug'] },
      { id: 'l9', title: 'T and Y', intro: 'Stretch your index finger up. Then go back to your key.',
        keys: ['t', 'y'],
        steps: ['ftf', 'jyj', 'ty', 'tidy', 'tray'] },
      { id: 'l10', title: 'O and P', intro: 'Move up the ring and little fingers of your right hand.',
        keys: ['o', 'p'],
        steps: ['lol', 'ñpñ', 'op', 'stop', 'pool'] },
      { id: 'l11', title: 'Q and W', intro: 'Move up the little and ring fingers of your left hand.',
        keys: ['q', 'w'],
        steps: ['aqa', 'sws', 'qw', 'quiet', 'water'] },
      { id: 'l12', title: 'N and M', intro: 'Move your right index finger down a row. Then go back.',
        keys: ['n', 'm'],
        steps: ['jnj', 'jmj', 'nm', 'moon', 'name'] },
      { id: 'l13', title: 'C, V and B', intro: 'Move your left hand fingers down a row. Then go back.',
        keys: ['c', 'v', 'b', ',', '.', '-'],
        steps: ['dcd', 'fvf', 'fbf', 'cave', 'boat'] },
      { id: 'l14', title: 'Z and X', intro: 'Move down the little and ring fingers of your left hand.',
        keys: ['z', 'x'],
        steps: ['aza', 'sxs', 'zx', 'zoo', 'taxi'] },
      { id: 'l15', title: 'Short sentences', intro: 'You know all the letters now. Type short sentences.',
        keys: [],
        steps: ['hi there', 'i like it', 'good morning', 'hi my friend'] },
      { id: 'l16', title: 'Capitals', intro: 'To type a capital letter, hold the Shift key with the pinky on the opposite side and press the letter with your other hand.',
        steps: ['A', 'J', 'Sa', 'Hello', 'Good morning'] },
      { id: 'l17', title: 'Special keys', intro: 'These keys don\'t have a fixed finger: use whichever hand is comfortable. Switch to the "With numbers on the side" keyboard view to see them drawn.',
        steps: [{ specialKey: 'home' }, { specialKey: 'end' }, { specialKey: 'pageUp' }, { specialKey: 'pageDown' }, { specialKey: 'delete' }] }
    ]
  },

  /* Word bank for the "Words" activity. The engine (playWords in
     app.js) does not pick 4 at random like it used to: it makes a
     greedy selection that guarantees every key of the selected layout
     gets pressed at least 5 times across the chosen word set
     (SPEC principle 7: mastery of the full keyboard). That is why the
     bank has to be rich and cover every letter (including q, w, x, y,
     z, j, k, ñ) and the punctuation symbols that appear on the
     keyboard (, . -). Sentences with commas/periods/dashes are
     needed because single words barely use them. Any extension of the
     bank must keep coverage of every letter and of the three symbols.

     Bank constraints:
     - No accents or diacritics: every word is typed with real
       physical keys on the computer keyboard. "adiós" becomes "adios"
       because the ´ + a key is not a single key but a composition,
       and it would confuse the per-key press count.
     - Every word/sentence must be made up only of characters on the
       alphanumeric keyboard: letters a-z, ñ, space, comma, period,
       dash. The algorithm in playWords filters out candidates whose
       `seq` contains keys outside the selected layout (e.g. a
       sentence with "1" does not enter the set if the active layout
       is "simple").
     - Ñ counts as one more key on the Spanish keyboard and must be
       exercised just like the others.
     - The bank contains words grouped by topic and, at the end,
       blocks dedicated to low-frequency letters (q,w,x,y,z,j,k,ñ) and
       to the symbols (, . -) to guarantee the greedy algorithm has
       enough material to reach the minimum of 5 presses per key
       without going over the cap. */
  words: {
    es: [
      // Saludos, animales, naturaleza
      'hola', 'adios', 'casa', 'gato', 'perro', 'pajaro', 'pez',
      'sol', 'luna', 'estrella', 'agua', 'fuego', 'tierra', 'aire',
      'arana', 'avispa', 'abeja', 'jabali', 'jirafa',
      // Comida
      'pan', 'queso', 'leche', 'arroz', 'sopa', 'fruta',
      'tortilla', 'aceite', 'ajo', 'jamon',
      // Objetos del día a día
      'mesa', 'silla', 'puerta', 'ventana', 'cama', 'libro', 'lapiz',
      'cuaderno', 'regla', 'mochila', 'mochila', 'bolso',
      'zapato', 'camisa', 'pantalon', 'sombrero',
      // Cuerpo
      'mano', 'pie', 'cabeza', 'boca', 'ojo', 'nariz', 'oreja',
      // Naturaleza y lugares
      'flor', 'arbol', 'bosque', 'rio', 'mar', 'montana',
      'parque', 'jardin', 'pueblo',
      // Transporte y juguetes
      'pelota', 'coche', 'tren', 'avion', 'barco',
      'quiosco', 'yoyo',
      // Personas y relaciones
      'amigo', 'familia', 'abuelo', 'abuela',
      'hermano', 'primo', 'prima',
      // Colores
      'verde', 'azul', 'rojo', 'blanco', 'negro', 'rosa', 'amarillo',
      'naranja', 'marron',
      // Bloque Q
      'queso', 'quinto', 'quitar', 'quepo', 'aqui', 'mapa', 'bosque',
      'porque', 'aunque', 'quien', 'queda', 'quedo', 'paquete',
      // Bloque W
      'water', 'wifi', 'web', 'whisky',
      // Bloque X
      'xilofono', 'xenon', 'examen', 'exito', 'boxeo', 'oxido',
      // Bloque Y
      'yate', 'yogur', 'yerno', 'yuca', 'playa', 'mayo', 'muy',
      // Bloque Z
      'zoo', 'zumo', 'zona', 'lazo', 'pizza', 'noche',
      'zorro', 'zurdo', 'paz', 'luz', 'voz', 'arco', 'brazo',
      // Bloque J
      'juego', 'fiesta', 'baile', 'jabon', 'jirafa', 'joven',
      'viaje', 'mejilla', 'reloj', 'pajaro',
      // Bloque K
      'kilo', 'kiosko', 'kiwi', 'kayak', 'koala',
      // Bloque Ñ (con la tecla ñ explícita; cada palabra contiene al
      // menos una ñ para que el algoritmo pueda cubrirla)
      'niño', 'niña', 'mañana', 'montaña', 'campaña', 'araña',
      'dueño', 'enseñanza', 'español', 'senos', 'piña', 'caña',
      'leña', 'paño', 'sueño', 'otoño', 'diseño', 'baño',
      'niños', 'niñas', 'años', 'daño', 'extraño', 'pequeño',
      // Frases con símbolos de puntuación
      'si, claro', 'no, gracias', 'bien, vale', 'hola, amigo',
      'buenos, dias', 'voy, vengo', 'si, si', 'no, no',
      'a, b, c', 'e, o, u', 'el, la, lo',
      'punto final.', 'ok.', 'si.', 'fin.', 'punto.', 'listo.',
      'uno-dos', 'dos-tres', 'a-b-c', 'x-y-z', 'uno y dos',
      'punto y coma', 'punto y aparte', 'guion medio'
    ],
    en: [
      // Greetings, animals, nature
      'hello', 'goodbye', 'house', 'cat', 'dog', 'bird', 'fish',
      'sun', 'moon', 'star', 'water', 'fire', 'earth', 'air',
      'spider', 'wasp', 'bee', 'fox', 'frog',
      // Food
      'bread', 'cheese', 'milk', 'rice', 'soup', 'fruit',
      'egg', 'butter', 'honey', 'juice',
      // Everyday objects
      'table', 'chair', 'door', 'window', 'bed', 'book', 'pen',
      'notebook', 'ruler', 'bag', 'backpack', 'watch',
      'shoe', 'shirt', 'pants', 'hat',
      // Body
      'hand', 'foot', 'head', 'mouth', 'eye', 'nose', 'ear',
      // Nature and places
      'flower', 'tree', 'forest', 'river', 'sea', 'mountain',
      'park', 'garden', 'town',
      // Transport and toys
      'ball', 'car', 'train', 'plane', 'boat',
      'kite', 'yo-yo',
      // People and relations
      'friend', 'family', 'boy', 'girl', 'grandpa', 'grandma',
      'brother', 'cousin',
      // Colors
      'green', 'blue', 'red', 'white', 'black', 'pink', 'yellow',
      'orange', 'brown',
      // Low-frequency letters (q,w,x,y,z,j,k)
      // Block Q
      'queen', 'quick', 'quiet', 'quiz', 'square', 'equal',
      'question', 'request', 'square',
      // Block W
      'water', 'winter', 'window', 'whale', 'wheat', 'wheel',
      'whisper', 'what', 'welcome', 'walk', 'work',
      // Block X
      'xylophone', 'x-ray', 'box', 'fox', 'six', 'next', 'text',
      // Block Y
      'yellow', 'yes', 'you', 'young', 'yogurt', 'yacht', 'yesterday',
      'play', 'may', 'by',
      // Block Z
      'zoo', 'zero', 'zebra', 'zip', 'pizza', 'buzz', 'jazz', 'frozen',
      // Block J
      'jump', 'jar', 'jelly', 'jewel', 'jungle', 'jog', 'joy', 'join',
      'adjust', 'enjoy',
      // Block K
      'kite', 'kitchen', 'king', 'key', 'kid', 'keep', 'knee',
      // Block V (boost)
      'van', 'voice', 'vase', 'very', 'vine', 'view', 'vest',
      'video', 'visit', 'vivid', 'river', 'over', 'seven',
      'have', 'love', 'above', 'leave', 'save', 'give',
      // Sentences with punctuation
      'yes, please', 'no, thanks', 'ok, fine', 'hi, friend',
      'well, yes', 'no, no', 'oh, really',
      'the end.', 'ok.', 'done.', 'ready.', 'all good.', 'see you.',
      'one-two', 'two-three', 'a-b-c', 'x-y-z', 'one and two',
      'comma here', 'period end', 'dash-like', 'a-b-c-d-e'
    ]
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
  },

  /* "Real texts" mode (templates): full, real-world writing tasks (an
     email, a letter...) instead of single words or short drill
     sentences -- the transfer-to-real-life step the rest of the app
     builds up to. Unlike DATA.lessons, these are NOT gated behind a
     linear unlock chain: they're independent practice texts a player
     can pick in any order (see renderTemplates() in app.js), so
     completing one doesn't unlock another.
     Shape: { id, title, lines: [...] }. 'lines' is the text split
     into short lines/sentences -- each becomes one step of the
     sequence engine (playTemplate() in app.js), same mechanism as a
     lesson step's plain-string 'seq'. Keep lines to characters the
     physical layout models (lowercase letters, ñ, the punctuation in
     DATA.rows: ',' '.' '-', uppercase letters via Shift -- see lesson
     "Capitals" -- and Spanish accented vowels á/é/í/ó/ú, which are
     correct orthography and expected in real Spanish writing) so
     every character has a real key and a finger to guide it.
     expectedBaseChar() in app.js strips the accent before looking up
     the finger/on-screen key, since there's no separate 'é' key --
     just 'e' composed with the dead accent key, the same idea as a
     capital resolving to its base letter. Still avoid '¡', '¿', '!'
     and '?': unlike accents, those have no physical key at all in
     DATA.rows and would silently swallow the keystroke.
     TO EXTEND: add a new { id, title, lines } entry to BOTH the 'es'
     and 'en' arrays below (see doc/en/technical.md §2.3 "Extensible
     templates"). 'id' must be unique and stable (used as the badge
     key: 'template_' + id in app.js#playTemplate). */
  templates: {
    es: [
      { id: 'email', title: 'Correo a una amiga', lines: [
        'Hola Marta,',
        'Espero que estes bien.',
        'Hoy aprendí a escribir con el teclado.',
        'Un abrazo.'
      ] },
      { id: 'letter', title: 'Carta a la familia', lines: [
        'Querida familia,',
        'Os escribo esta carta a mano.',
        'Estoy aprendiendo a escribir rápido - poco a poco.',
        'Os quiero mucho.'
      ] },
      { id: 'message', title: 'Mensaje a un amigo', lines: [
        'Hola Pablo,',
        'Quedamos mañana a las cinco.',
        'Te espero en la plaza del pueblo.',
        'Hasta luego.'
      ] },
      { id: 'invitation', title: 'Invitación de cumpleaños', lines: [
        'Querida Lucia,',
        'El sábado es mi cumple.',
        'Te invito a merendar a casa.',
        'Espero que vengas.'
      ] },
      { id: 'note', title: 'Nota en la nevera', lines: [
        'Hola mamá,',
        'Salgo a dar un paseo.',
        'Vuelvo antes de la cena.',
        'Un beso.'
      ] },
      { id: 'thanks', title: 'Carta de agradecimiento', lines: [
        'Hola Ana,',
        'Gracias por tu regalo.',
        'Me ha encantado el libro.',
        'Eres muy amable.'
      ] },
      { id: 'congrats', title: 'Mensaje de felicitación', lines: [
        'Hola Luis,',
        'Felicidades por tu nuevo trabajo.',
        'Te lo mereces mucho.',
        'Un abrazo grande.'
      ] },
      { id: 'apology', title: 'Carta de disculpa', lines: [
        'Querido Pedro,',
        'Perdona por el retraso.',
        'No volverá a pasar.',
        'Un saludo cordial.'
      ] },
      { id: 'teacher', title: 'Correo al profesor', lines: [
        'Estimado profesor,',
        'No podré ir a clase mañana.',
        'Tengo cita en el médico.',
        'Gracias por su ayuda.'
      ] },
      { id: 'neighbor', title: 'Nota al vecino', lines: [
        'Hola señor García,',
        'Su gato está en mi jardín.',
        'No se preocupe, está bien.',
        'Un saludo.'
      ] },
      { id: 'doctor', title: 'Mensaje al médico', lines: [
        'Estimado doctor,',
        'Confirmo la cita del jueves.',
        'Llegaré a las cuatro.',
        'Muchas gracias.'
      ] },
      { id: 'library', title: 'Correo a la biblioteca', lines: [
        'Hola,',
        'Quiero devolver un libro.',
        'Lo llevaré el viernes por la tarde.',
        'Gracias.'
      ] },
      { id: 'recipe', title: 'Receta de cocina', lines: [
        'Tarta de manzana.',
        'Mezclar harina, huevos y azúcar.',
        'Añadir las manzanas troceadas.',
        'Hornear durante una hora.'
      ] },
      { id: 'groceries', title: 'Lista de la compra', lines: [
        'Lunes - lista de la compra.',
        'Pan, leche y huevos.',
        'Manzanas, peras y naranjas.',
        'No olvidar el aceite.'
      ] },
      { id: 'diary', title: 'Entrada de diario', lines: [
        'Hoy fue un día bonito.',
        'Paseé por el parque con mi perro.',
        'Hice los deberes de matemáticas.',
        'Me sentí muy feliz.'
      ] },
      { id: 'story', title: 'Cuento corto', lines: [
        'Había una vez un gato azul.',
        'Vivía en un pequeño pueblo.',
        'Le gustaba dormir al sol.',
        'Y correr por el jardín.'
      ] },
      { id: 'postcard', title: 'Postal de vacaciones', lines: [
        'Hola desde la playa.',
        'El mar es muy bonito.',
        'Hace sol todo el día.',
        'Os envío un abrazo.'
      ] },
      { id: 'weekendPlan', title: 'Plan para el fin de semana', lines: [
        'Sábado por la mañana:',
        'Ir al mercado a comprar fruta.',
        'Sábado por la tarde:',
        'Pasear por el centro.'
      ] },
      { id: 'gift', title: 'Nota para un regalo', lines: [
        'Querido abuelo,',
        'Te envío este regalo por tu cumple.',
        'Es un jersey de lana.',
        'Espero que te guste.'
      ] },
      { id: 'farewell', title: 'Mensaje de despedida', lines: [
        'Hola a todos,',
        'Me voy de viaje una semana.',
        'Vuelvo el domingo próximo.',
        'Nos vemos pronto.'
      ] }
    ],
    en: [
      { id: 'email', title: 'Email to a friend', lines: [
        'Hi Sam,',
        'I hope you are well.',
        'Today I learned to type on the keyboard.',
        'Take care.'
      ] },
      { id: 'letter', title: 'Letter to family', lines: [
        'Dear family,',
        'I am writing this letter by hand.',
        'I am learning to type fast - step by step.',
        'I love you all.'
      ] },
      { id: 'message', title: 'Message to a friend', lines: [
        'Hi Tom,',
        'See you tomorrow at five.',
        'I will wait for you at the park.',
        'See you later.'
      ] },
      { id: 'invitation', title: 'Birthday invitation', lines: [
        'Dear Lucy,',
        'Saturday is my birthday.',
        'Please come to my house for cake.',
        'I hope you can come.'
      ] },
      { id: 'note', title: 'Note on the fridge', lines: [
        'Hi mom,',
        'I am going for a walk.',
        'I will be back before dinner.',
        'Love you.'
      ] },
      { id: 'thanks', title: 'Thank-you letter', lines: [
        'Hi Anna,',
        'Thank you for your gift.',
        'I really like the book.',
        'You are very kind.'
      ] },
      { id: 'congrats', title: 'Congratulations note', lines: [
        'Hi Lou,',
        'Congrats on your new job.',
        'You deserve it a lot.',
        'Big hug.'
      ] },
      { id: 'apology', title: 'Apology letter', lines: [
        'Dear Pat,',
        'Sorry for the delay.',
        'It will not happen again.',
        'Best regards.'
      ] },
      { id: 'teacher', title: 'Email to the teacher', lines: [
        'Dear teacher,',
        'I cannot come to class tomorrow.',
        'I have a doctor appointment.',
        'Thank you for your help.'
      ] },
      { id: 'neighbor', title: 'Note to the neighbor', lines: [
        'Hi Mr. Hall,',
        'Your cat is in my garden.',
        'Do not worry, it is fine.',
        'Best regards.'
      ] },
      { id: 'doctor', title: 'Message to the doctor', lines: [
        'Dear doctor,',
        'I confirm the visit on Thursday.',
        'I will arrive at four.',
        'Thank you very much.'
      ] },
      { id: 'library', title: 'Email to the library', lines: [
        'Hello,',
        'I want to return a book.',
        'I will bring it on Friday afternoon.',
        'Thank you.'
      ] },
      { id: 'recipe', title: 'Cooking recipe', lines: [
        'Apple pie.',
        'Mix flour, eggs and sugar.',
        'Add the chopped apples.',
        'Bake for one hour.'
      ] },
      { id: 'groceries', title: 'Shopping list', lines: [
        'Monday - shopping list.',
        'Bread, milk and eggs.',
        'Apples, pears and oranges.',
        'Do not forget the oil.'
      ] },
      { id: 'diary', title: 'Diary entry', lines: [
        'Today was a nice day.',
        'I walked in the park with my dog.',
        'I did my math homework.',
        'I felt very happy.'
      ] },
      { id: 'story', title: 'Short story', lines: [
        'Once upon a time there was a blue cat.',
        'It lived in a small town.',
        'It liked to nap in the sun.',
        'And run in the garden.'
      ] },
      { id: 'postcard', title: 'Holiday postcard', lines: [
        'Hi from the beach.',
        'The sea is very pretty.',
        'It is sunny every day.',
        'Sending you a big hug.'
      ] },
      { id: 'weekendPlan', title: 'Weekend plan', lines: [
        'Saturday morning:',
        'Go to the market to buy fruit.',
        'Saturday afternoon:',
        'Walk around the city center.'
      ] },
      { id: 'gift', title: 'Note for a gift', lines: [
        'Dear grandpa,',
        'I send you this gift for your birthday.',
        'It is a wool sweater.',
        'I hope you like it.'
      ] },
      { id: 'farewell', title: 'Farewell message', lines: [
        'Hi everyone,',
        'I am going on a trip for a week.',
        'I will be back next Sunday.',
        'See you soon.'
      ] }
    ]
  }
};

/* Decorative key: gives the keyboard its real shape but cannot be
   pressed in an exercise (no "ch"). 'label' is an id: the visible
   text is looked up in strings.js with App.i18n.t('keyLabel.' + label). */
function decorativeKey(finger, wide, label) {
  return { ch: null, finger: finger, wide: wide, decor: true, label: label };
}

/* Same shape as a decorative key, but with a real 'ch' -- the internal
   id normalizeKey() (app.js) maps the physical key to -- so it CAN be
   a lesson target. Used only by the "less frequent keys" lesson
   (Home/End/PageUp/PageDown/Delete: see DATA.lessons "Special keys").
   'special: true' keeps these out of the "all keys" challenge, which
   is only about the core alphanumeric layout. No fixed finger
   convention exists for them (varies too much by keyboard/user), so
   'finger' here is purely cosmetic -- which side of the on-screen
   keyboard they're tinted, not a practice target. */
function specialKeyDef(id) {
  return { ch: id, finger: 'rp', decor: true, special: true, label: id, wide: 'media' };
}

DATA.layouts = {
  /* Letters only, plus both Shift keys: the classic touch-typing
     method needs Shift visible for the capitals lesson (see
     DATA.lessons "Capitals"), even in this stripped-down view. No
     Tab/Enter/Backspace here on purpose -- those aren't practiced
     yet. */
  simple: [
    DATA.rows[0],
    DATA.rows[1],
    [decorativeKey('lp', 'media', 'shift')].concat(DATA.rows[2]).concat([decorativeKey('rp', 'media', 'shift')]),
    DATA.rows[3]
  ],

  /* Full computer keyboard: numbers on top and function keys around
     it (Tab, Shift, Enter, Backspace), like a real one. */
  normal: [
    DATA.numberRow.concat([decorativeKey('rp', 'media', 'backspace')]),
    [decorativeKey('lp', 'media', 'tab')].concat(DATA.rows[0]),
    [decorativeKey('lp', 'media', 'shift')].concat(DATA.rows[1]).concat([decorativeKey('rp', 'media', 'enter')]),
    [decorativeKey('lp', 'media', 'shift')].concat(DATA.rows[2]).concat([decorativeKey('rp', 'media', 'shift')]),
    DATA.rows[3]
  ]
};

/* Extended: the normal keyboard, with an extra row on top for the
   less frequent keys (Home/End/Page Up/Page Down/Delete — see the
   "Special keys" lesson), and the number pad (DATA.numpad) shown
   separately so the three can be practiced together. */
DATA.layouts.extended = [
  ['home', 'end', 'pageUp', 'pageDown', 'delete'].map(specialKeyDef)
].concat(DATA.layouts.normal);
/* -------- Avatars (inline SVGs, no external assets) --------
   8 simple avatars in 2 hair colors × 2 expressions × 2 skin tones.
   String id + unified viewBox (0 0 64 64). */
DATA.avatars = [
  { id: 'a1', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#FFD9B5"/>' +
    '<circle cx="32" cy="28" r="16" fill="#FFE3C2"/>' +
    '<path d="M16 26 Q32 8 48 26 Q48 18 32 14 Q16 18 16 26 Z" fill="#3D2B1F"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M27 40 Q32 44 37 40" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a2', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#F2C49B"/>' +
    '<circle cx="32" cy="28" r="16" fill="#FBD0A8"/>' +
    '<path d="M14 30 Q14 14 32 12 Q50 14 50 30 Q50 24 32 22 Q14 24 14 30 Z" fill="#8B4513"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M27 40 Q32 43 37 40" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a3', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#D89860"/>' +
    '<circle cx="32" cy="28" r="16" fill="#E8AE7A"/>' +
    '<path d="M16 30 Q16 8 32 6 Q48 8 48 30 L46 24 Q32 16 18 24 Z" fill="#1A1A2E"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M26 41 Q32 38 38 41" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a4', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#FFD9B5"/>' +
    '<circle cx="32" cy="28" r="16" fill="#FFE3C2"/>' +
    '<path d="M18 14 Q32 4 46 14 Q44 22 32 18 Q20 22 18 14 Z" fill="#DAA520"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M27 40 Q32 47 37 40" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a5', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#F2C49B"/>' +
    '<circle cx="32" cy="28" r="16" fill="#FBD0A8"/>' +
    '<path d="M14 32 Q14 16 32 14 Q50 16 50 32 L48 28 Q32 18 16 28 Z" fill="#C0392B"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M26 41 Q32 45 38 41" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a6', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#D89860"/>' +
    '<circle cx="32" cy="28" r="16" fill="#E8AE7A"/>' +
    '<path d="M16 30 Q32 12 48 30 Q48 22 32 18 Q16 22 16 30 Z" fill="#FFB300"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M27 40 Q32 44 37 40" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a7', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#FFD9B5"/>' +
    '<circle cx="32" cy="28" r="16" fill="#FFE3C2"/>' +
    '<path d="M14 28 Q14 12 32 10 Q50 12 50 28 Q40 22 32 22 Q24 22 14 28 Z" fill="#6B3FA0"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M26 41 Q32 38 38 41" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' },
  { id: 'a8', svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="30" fill="#F2C49B"/>' +
    '<circle cx="32" cy="28" r="16" fill="#FBD0A8"/>' +
    '<path d="M18 14 Q32 6 46 14 L48 22 Q32 18 18 22 Z" fill="#1B6CA8"/>' +
    '<circle cx="26" cy="30" r="2" fill="#1A1A2E"/><circle cx="38" cy="30" r="2" fill="#1A1A2E"/>' +
    '<path d="M27 40 Q32 47 37 40" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' }
];

/* -------- Badges --------
   id: internal key saved in state.completed (set).
   key: i18n key for the visible name.
   description: i18n key for the description (optional, currently
   unused).
   condition: function (state) => bool. Evaluated every time a reward
   is granted. If it returns true and the badge wasn't already
   unlocked, it unlocks. */
DATA.badges = [
  { id: 'first', key: 'badgeFirst', condition: function (s) { return Object.keys(s.completed).length >= 1; } },
  { id: 'placement', key: 'badgePlacement', condition: function (s) { return !!s.completed.placement; } },
  { id: 'words', key: 'badgeWords', condition: function (s) { return !!s.completed.words; } },
  { id: 'numbers', key: 'badgeNumbers', condition: function (s) { return !!s.completed.numbers; } },
  { id: 'allKeys', key: 'badgeAllKeys', condition: function (s) { return !!s.completed.allKeys; } },
  { id: 'free', key: 'badgeFree', condition: function (s) { return (s.freeWritingCount || 0) >= 1; } },
  { id: 'accuracy', key: 'badgeAccuracy', condition: function (s) { return s.bestAccuracy != null && s.bestAccuracy >= 90; } }
];
