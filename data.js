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
        steps: ['hola', 'me gusta', 'buenos dias', 'hola amigo'] },
      { id: 'l16', title: 'Mayúsculas', intro: 'Para escribir una mayúscula, mantén pulsada la tecla Mayús con el meñique del lado contrario y pulsa la letra con la otra mano.',
        steps: ['A', 'J', 'Sa', 'Hola', 'Buenos dias'] },
      { id: 'l17', title: 'Teclas especiales', intro: 'Estas teclas no tienen un dedo fijo: usa la mano que te resulte más cómoda. Cambia a la vista de teclado "Con números al lado" para verlas dibujadas.',
        steps: [{ especial: 'inicio' }, { especial: 'fin' }, { especial: 'pagArriba' }, { especial: 'pagAbajo' }, { especial: 'suprimir' }] }
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
        steps: ['hi there', 'i like it', 'good morning', 'hi my friend'] },
      { id: 'l16', title: 'Capitals', intro: 'To type a capital letter, hold the Shift key with the pinky on the opposite side and press the letter with your other hand.',
        steps: ['A', 'J', 'Sa', 'Hello', 'Good morning'] },
      { id: 'l17', title: 'Special keys', intro: 'These keys don\'t have a fixed finger: use whichever hand is comfortable. Switch to the "With numbers on the side" keyboard view to see them drawn.',
        steps: [{ especial: 'inicio' }, { especial: 'fin' }, { especial: 'pagArriba' }, { especial: 'pagAbajo' }, { especial: 'suprimir' }] }
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
  },

  /* "Real texts" mode ("Textos reales"/plantillas): full, real-world
     writing tasks (an email, a letter...) instead of single words or
     short drill sentences -- the transfer-to-real-life step the rest
     of the app builds up to. Unlike DATA.lessons, these are NOT
     gated behind a linear unlock chain: they're independent practice
     texts a player can pick in any order (see pintarPlantillas() in
     app.js), so completing one doesn't unlock another.
     Shape: { id, title, lines: [...] }. 'lines' is the text split
     into short lines/sentences -- each becomes one step of the
     sequence engine (jugarPlantilla() in app.js), same mechanism as
     a lesson step's plain-string 'seq'. Keep lines to characters the
     physical layout models (lowercase letters, ñ, the punctuation in
     DATA.rows: ',' '.' '-', and uppercase letters via Shift -- see
     lesson "Mayúsculas"/"Capitals") so every character has a real
     key and a finger to guide it. Avoid '¡', '¿', '!', '?' and
     accented vowels: those keys aren't modeled in DATA.rows, so they
     would silently swallow the keystroke.
     TO EXTEND: add a new { id, title, lines } entry to BOTH the 'es'
     and 'en' arrays below (see doc/en/technical.md §2.3 "Extensible
     templates"). 'id' must be unique and stable (used as the badge
     key: 'plantilla_' + id in app.js#jugarPlantilla). */
  templates: {
    es: [
      { id: 'correo', title: 'Correo a una amiga', lines: [
        'Hola Marta,',
        'Espero que estes bien.',
        'Hoy aprendi a escribir con el teclado.',
        'Un abrazo.'
      ] },
      { id: 'carta', title: 'Carta a la familia', lines: [
        'Querida familia,',
        'Os escribo esta carta a mano.',
        'Estoy aprendiendo a escribir rapido - poco a poco.',
        'Os quiero mucho.'
      ] },
      { id: 'mensaje', title: 'Mensaje a un amigo', lines: [
        'Hola Pablo,',
        'Quedamos manana a las cinco.',
        'Te espero en la plaza del pueblo.',
        'Hasta luego.'
      ] },
      { id: 'invitacion', title: 'Invitacion de cumpleanos', lines: [
        'Querida Lucia,',
        'El sabado es mi cumple.',
        'Te invito a merendar a casa.',
        'Espero que vengas.'
      ] },
      { id: 'nota', title: 'Nota en la nevera', lines: [
        'Hola mama,',
        'Salgo a dar un paseo.',
        'Vuelvo antes de la cena.',
        'Un beso.'
      ] },
      { id: 'agradecimiento', title: 'Carta de agradecimiento', lines: [
        'Hola Ana,',
        'Gracias por tu regalo.',
        'Me ha encantado el libro.',
        'Eres muy amable.'
      ] },
      { id: 'felicidades', title: 'Mensaje de felicitacion', lines: [
        'Hola Luis,',
        'Felicidades por tu nuevo trabajo.',
        'Te lo mereces mucho.',
        'Un abrazo grande.'
      ] },
      { id: 'disculpa', title: 'Carta de disculpa', lines: [
        'Querido Pedro,',
        'Perdona por el retraso.',
        'No volvera a pasar.',
        'Un saludo cordial.'
      ] },
      { id: 'profesor', title: 'Correo al profesor', lines: [
        'Estimado profesor,',
        'No podre ir a clase manana.',
        'Tengo cita en el medico.',
        'Gracias por su ayuda.'
      ] },
      { id: 'vecino', title: 'Nota al vecino', lines: [
        'Hola senor Garcia,',
        'Su gato esta en mi jardin.',
        'No se preocupe, esta bien.',
        'Un saludo.'
      ] },
      { id: 'medico', title: 'Mensaje al medico', lines: [
        'Estimado doctor,',
        'Confirmo la cita del jueves.',
        'Llegare a las cuatro.',
        'Muchas gracias.'
      ] },
      { id: 'biblioteca', title: 'Correo a la biblioteca', lines: [
        'Hola,',
        'Quiero devolver un libro.',
        'Lo llevare el viernes por la tarde.',
        'Gracias.'
      ] },
      { id: 'receta', title: 'Receta de cocina', lines: [
        'Tarta de manzana.',
        'Mezclar harina, huevos y azucar.',
        'Anadir las manzanas troceadas.',
        'Hornear durante una hora.'
      ] },
      { id: 'lista', title: 'Lista de la compra', lines: [
        'Lunes - lista de la compra.',
        'Pan, leche y huevos.',
        'Manzanas, peras y naranjas.',
        'No olvidar el aceite.'
      ] },
      { id: 'diario', title: 'Entrada de diario', lines: [
        'Hoy fue un dia bonito.',
        'Pasee por el parque con mi perro.',
        'Hice los deberes de matematicas.',
        'Me senti muy feliz.'
      ] },
      { id: 'cuento', title: 'Cuento corto', lines: [
        'Habia una vez un gato azul.',
        'Vivía en un pequeno pueblo.',
        'Le gustaba dormir al sol.',
        'Y correr por el jardin.'
      ] },
      { id: 'postal', title: 'Postal de vacaciones', lines: [
        'Hola desde la playa.',
        'El mar es muy bonito.',
        'Hace sol todo el dia.',
        'Os envio un abrazo.'
      ] },
      { id: 'plan', title: 'Plan para el fin de semana', lines: [
        'Sabado por la manana:',
        'Ir al mercado a comprar fruta.',
        'Sabado por la tarde:',
        'Pasear por el centro.'
      ] },
      { id: 'regalo', title: 'Nota para un regalo', lines: [
        'Querido abuelo,',
        'Te envio este regalo por tu cumple.',
        'Es un jersey de lana.',
        'Espero que te guste.'
      ] },
      { id: 'despedida', title: 'Mensaje de despedida', lines: [
        'Hola a todos,',
        'Me voy de viaje una semana.',
        'Vuelvo el domingo proximo.',
        'Nos vemos pronto.'
      ] }
    ],
    en: [
      { id: 'correo', title: 'Email to a friend', lines: [
        'Hi Sam,',
        'I hope you are well.',
        'Today I learned to type on the keyboard.',
        'Take care.'
      ] },
      { id: 'carta', title: 'Letter to family', lines: [
        'Dear family,',
        'I am writing this letter by hand.',
        'I am learning to type fast - step by step.',
        'I love you all.'
      ] },
      { id: 'mensaje', title: 'Message to a friend', lines: [
        'Hi Tom,',
        'See you tomorrow at five.',
        'I will wait for you at the park.',
        'See you later.'
      ] },
      { id: 'invitacion', title: 'Birthday invitation', lines: [
        'Dear Lucy,',
        'Saturday is my birthday.',
        'Please come to my house for cake.',
        'I hope you can come.'
      ] },
      { id: 'nota', title: 'Note on the fridge', lines: [
        'Hi mom,',
        'I am going for a walk.',
        'I will be back before dinner.',
        'Love you.'
      ] },
      { id: 'agradecimiento', title: 'Thank-you letter', lines: [
        'Hi Anna,',
        'Thank you for your gift.',
        'I really like the book.',
        'You are very kind.'
      ] },
      { id: 'felicidades', title: 'Congratulations note', lines: [
        'Hi Lou,',
        'Congrats on your new job.',
        'You deserve it a lot.',
        'Big hug.'
      ] },
      { id: 'disculpa', title: 'Apology letter', lines: [
        'Dear Pat,',
        'Sorry for the delay.',
        'It will not happen again.',
        'Best regards.'
      ] },
      { id: 'profesor', title: 'Email to the teacher', lines: [
        'Dear teacher,',
        'I cannot come to class tomorrow.',
        'I have a doctor appointment.',
        'Thank you for your help.'
      ] },
      { id: 'vecino', title: 'Note to the neighbor', lines: [
        'Hi Mr. Hall,',
        'Your cat is in my garden.',
        'Do not worry, it is fine.',
        'Best regards.'
      ] },
      { id: 'medico', title: 'Message to the doctor', lines: [
        'Dear doctor,',
        'I confirm the visit on Thursday.',
        'I will arrive at four.',
        'Thank you very much.'
      ] },
      { id: 'biblioteca', title: 'Email to the library', lines: [
        'Hello,',
        'I want to return a book.',
        'I will bring it on Friday afternoon.',
        'Thank you.'
      ] },
      { id: 'receta', title: 'Cooking recipe', lines: [
        'Apple pie.',
        'Mix flour, eggs and sugar.',
        'Add the chopped apples.',
        'Bake for one hour.'
      ] },
      { id: 'lista', title: 'Shopping list', lines: [
        'Monday - shopping list.',
        'Bread, milk and eggs.',
        'Apples, pears and oranges.',
        'Do not forget the oil.'
      ] },
      { id: 'diario', title: 'Diary entry', lines: [
        'Today was a nice day.',
        'I walked in the park with my dog.',
        'I did my math homework.',
        'I felt very happy.'
      ] },
      { id: 'cuento', title: 'Short story', lines: [
        'Once upon a time there was a blue cat.',
        'It lived in a small town.',
        'It liked to nap in the sun.',
        'And run in the garden.'
      ] },
      { id: 'postal', title: 'Holiday postcard', lines: [
        'Hi from the beach.',
        'The sea is very pretty.',
        'It is sunny every day.',
        'Sending you a big hug.'
      ] },
      { id: 'plan', title: 'Weekend plan', lines: [
        'Saturday morning:',
        'Go to the market to buy fruit.',
        'Saturday afternoon:',
        'Walk around the city center.'
      ] },
      { id: 'regalo', title: 'Note for a gift', lines: [
        'Dear grandpa,',
        'I send you this gift for your birthday.',
        'It is a wool sweater.',
        'I hope you like it.'
      ] },
      { id: 'despedida', title: 'Farewell message', lines: [
        'Hi everyone,',
        'I am going on a trip for a week.',
        'I will be back next Sunday.',
        'See you soon.'
      ] }
    ]
  }
};

/* Tecla decorativa: da forma real al teclado pero no se puede pulsar
   en un ejercicio (no tiene "ch"). 'label' es un id: el texto visible
   se busca en strings.js con App.i18n.t('teclaLabel.' + label). */
function teclaDecorativa(finger, wide, label) {
  return { ch: null, finger: finger, wide: wide, decor: true, label: label };
}

/* Same shape as a decorative key, but with a real 'ch' -- the internal
   id normalizarTecla() (app.js) maps the physical key to -- so it CAN
   be a lesson target. Used only by the "less frequent keys" lesson
   (Home/End/PageUp/PageDown/Delete: see DATA.lessons "Teclas
   especiales"/"Special keys"). 'special: true' keeps these out of the
   "all keys" challenge, which is only about the core alphanumeric
   layout. No fixed finger convention exists for them (varies too much
   by keyboard/user), so 'finger' here is purely cosmetic -- which side
   of the on-screen keyboard they're tinted, not a practice target. */
function teclaEspecial(id) {
  return { ch: id, finger: 'rp', decor: true, special: true, label: id, wide: 'media' };
}

DATA.layouts = {
  /* Letters only, plus both Shift keys: the classic touch-typing
     method needs Shift visible for the capitals lesson (see
     DATA.lessons "Mayúsculas"/"Capitals"), even in this stripped-down
     view. No Tab/Enter/Backspace here on purpose -- those aren't
     practiced yet. */
  simplificado: [
    DATA.rows[0],
    DATA.rows[1],
    [teclaDecorativa('lp', 'media', 'mayus')].concat(DATA.rows[2]).concat([teclaDecorativa('rp', 'media', 'mayus')]),
    DATA.rows[3]
  ],

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

/* Extendido: el teclado normal, con una fila extra arriba para las
   teclas menos frecuentes (Inicio/Fin/Re Pág/Av Pág/Supr — ver la
   lección "Teclas especiales"/"Special keys"), y aparte se ve el
   teclado numérico (DATA.numpad) para practicar los tres juntos. */
DATA.layouts.extendido = [
  ['inicio', 'fin', 'pagArriba', 'pagAbajo', 'suprimir'].map(teclaEspecial)
].concat(DATA.layouts.normal);
/* -------- Avatares (SVGs inline, sin recursos externos) --------
   8 avatares simples en 2 colores de pelo × 2 expresiones × 2 tonos
   de piel. Identificador string + viewBox unificado (0 0 64 64).  */
DATA.avatares = [
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

/* -------- Insignias (badges) --------
   id: clave interna que se guarda en state.insignias (set).
   clave: clave i18n para el nombre visible.
   descripcion: clave i18n para la descripción (opcional).
   condicion: función (state) => bool. Se evalúa cada vez que se
   concede una recompensa. Si devuelve true y la insignia no estaba,
   se desbloquea. */
DATA.insignias = [
  { id: 'primera', clave: 'insigniaPrimera', condicion: function (s) { return Object.keys(s.completado).length >= 1; } },
  { id: 'posicion', clave: 'insigniaPosicion', condicion: function (s) { return !!s.completado.posicion; } },
  { id: 'palabras', clave: 'insigniaPalabras', condicion: function (s) { return !!s.completado.palabras; } },
  { id: 'numeros', clave: 'insigniaNumeros', condicion: function (s) { return !!s.completado.numeros; } },
  { id: 'todas', clave: 'insigniaTodas', condicion: function (s) { return !!s.completado.todas; } },
  { id: 'libre', clave: 'insigniaLibre', condicion: function (s) { return (s.vecesLibre || 0) >= 1; } },
  { id: 'racha5', clave: 'insigniaRacha5', condicion: function (s) { return (s.rachaMejor || 0) >= 5; } },
  { id: 'racha10', clave: 'insigniaRacha10', condicion: function (s) { return (s.rachaMejor || 0) >= 10; } },
  { id: 'precision', clave: 'insigniaPrecision', condicion: function (s) { return s.precisionMejor != null && s.precisionMejor >= 90; } }
];