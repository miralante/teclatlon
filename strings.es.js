/* ============================================================
   Teclatlon — Texts (ES)
   Language-specific file. Loaded conditionally from index.html
   depending on App.i18n.locale().
   ============================================================ */
(function () {
  'use strict';

  App.i18n.register({
    "title": "⌨️ Teclatlon",
    "nameScreenText": "¡Hola! ¿Cómo te llamas? Escribe tu nombre con el teclado.",
    "listenNameExtra": " Cuando termines, toca el botón Listo.",
    "nameInputAria": "Escribe tu nombre",
    "btnSaveName": "✅ Listo",
    "btnSkipName": "Ahora no",
    "keyboardViewAria": "Vista del teclado",
    "btnSimple": "🔤 Solo letras",
    "btnNormal": "⌨️ Letras y números",
    "btnExtended": "🔢 Con números al lado",
    "btnSimpleDetail": "Solo se ven las letras. Es lo más sencillo.",
    "btnNormalDetail": "Se ven las letras y los números, como un teclado normal.",
    "btnExtendedDetail": "Se ve todo el teclado y, además, los números a la derecha.",
    "btnColorsHands": "🎨 Colores: manos",
    "btnColorsFingers": "🎨 Colores: dedos",
    "legendFingers": "Cada dedo tiene un color.",
    "legendHands": "Azul: mano izquierda. Verde: mano derecha.",
    "btnClearProgress": "🗑️ Borrar mi progreso",
    "confirmClear": "¿Seguro? Toca otra vez para borrar.",
    "clearedNotice": "Todo borrado. Empiezas de nuevo.",
    "greetingHello": "¡Hola!",
    "greetingWithName": "¡Hola, {name}!",
    "chooseGame": "Elige un juego.",
    "modePlacementName": "Coloca los dedos",
    "modePlacementDetail": "Cada dedo tiene su tecla.",
    "modeLessonsName": "Paso a paso",
    "modeLessonsDetail": "Aprende las letras en orden.",
    "modeWordsName": "Palabras",
    "modeWordsDetail": "Escribe palabras y tu nombre.",
    "modeAllKeysName": "Todas las teclas",
    "modeAllKeysDetail": "Enciende todas las teclas.",
    "modeNumbersName": "Números",
    "modeNumbersDetail": "Usa el teclado de números.",
    "modeFreeName": "Escribe libre",
    "modeFreeDetail": "Escribe y escucha tu texto.",
    "modeTemplatesName": "Textos reales",
    "modeTemplatesDetail": "Practica con un correo o una carta.",
    "btnMyName": "✏️ Mi nombre",
    "btnMenu": "← Menú",
    "lessonsInstruction": "Termina una lección para abrir la siguiente.",
    "lessonLockedAria": "Lección {n} cerrada. Termina la anterior.",
    "templatesInstruction": "Elige un texto para practicar.",
    "templateInstruction": "Escribe la siguiente línea.",
    "gameTitleDefault": "Juego",
    "listenTextAria": "Escuchar mi texto",
    "clearTextAria": "Borrar el texto",
    "freeAreaAria": "Escribe aquí lo que quieras",
    "freeAreaPlaceholder": "Escribe aquí...",
    "nothingWrittenYet": "Todavía no has escrito nada.",
    "wellDone": "¡Muy bien!",
    "wellDoneWithName": "¡Muy bien, {name}!",
    "typeYourName": "Escribe tu nombre.",
    "typeTheWord": "Escribe la palabra.",
    "allKeysTitle": "Todas las teclas",
    "allKeysInstruction": "Pulsa todas las teclas de tu teclado. Cada tecla se enciende en la pantalla.",
    "challengeNextKey": "Pulsa la tecla {key} con el dedo {finger} de la mano {hand}.",
    "challengeNextKeyThumb": "Pulsa la tecla {key} con el pulgar.",
    "doneOfTotal": "{done} de {total}",
    "typeAria": "Escribe: {seq}",
    "pressKeyAria": "Pulsa: {key}",
    "thumbText": "Pulgar. La tecla de espacio.",
    "handFingerText": "Mano {hand}. Dedo {finger}.",
    "shiftText": "También mantén pulsada Mayús con el meñique de la mano {hand}.",
    "findKey": "Busca la tecla en tu teclado.",
    "lessonTitle": "Lección: {title}",
    "lessonReview": "Repaso: pulsa todas las teclas que has aprendido hasta ahora, en el orden del teclado.",
    "leftLabel": "Izquierda",
    "rightLabel": "Derecha",
    "finger": {"lp":{"hand":"izquierda","name":"meñique"},"lr":{"hand":"izquierda","name":"anular"},"lm":{"hand":"izquierda","name":"medio"},"li":{"hand":"izquierda","name":"índice"},"ri":{"hand":"derecha","name":"índice"},"rm":{"hand":"derecha","name":"medio"},"rr":{"hand":"derecha","name":"anular"},"rp":{"hand":"derecha","name":"meñique"},"th":{"hand":"las dos","name":"pulgar"}},
    "keyLabel": {"space":"espacio","tab":"Tab","shift":"Mayús","enter":"Intro","backspace":"Borrar","home":"Inicio","end":"Fin","pageUp":"Re Pág","pageDown":"Av Pág","delete":"Supr"},
    "transferMessage": "Esto te ayuda a escribir mensajes reales a la familia en el ordenador.",
    "languageLabel": "🌐 Idioma",
    "languageLabelAria": "Elegir idioma",
    "focusModeLabel": "🧘 Sin distracciones",
    "focusModeLabelAria": "Activar o desactivar el modo sin distracciones",
    "focusModeLabelOn": "✅ Sin distracciones: activado",
    "focusModeLabelOff": "⬜ Sin distracciones: desactivado",
    "textSizeA": "A−",
    "textSizeAria": "Tamaño del texto",
    "textSizeAdjustAria": "Aumentar o reducir el tamaño del texto",
    "themeLabel": "🌗 Tema",
    "themeLabelAria": "Cambiar el tema claro, oscuro o alto contraste",
    "themeLabelAuto": "Tema: automático",
    "themeLabelLight": "Tema: claro",
    "themeLabelDark": "Tema: oscuro",
    "themeLabelContrast": "Tema: alto contraste",

    /* Métricas: el producto no ha cerrado los detalles pero el botón
       se queda visible (y apagado por defecto) para que la persona
       usuaria lo encuentre y entienda que existe. La implementación
       actual muestra precisión (%) y teclas por minuto en vivo. */
    "metricsLabel": "📊 Métricas",
    "metricsLabelAria": "Activar o desactivar las métricas de precisión y velocidad",
    "metricsLabelOn": "✅ Métricas: encendidas",
    "metricsLabelOff": "⬜ Métricas: apagadas",

    /* Sonido espacial: el tono de acierto suena por el lado (izquierda
       o derecha) de la tecla pulsada, para reforzar la posición de la
       mano sin depender de la vista. */
    "spatialSoundLabel": "🎧 Sonido espacial",
    "spatialSoundLabelAria": "Activar o desactivar el sonido espacial",
    "spatialSoundLabelOn": "✅ Sonido espacial: encendido",
    "spatialSoundLabelOff": "⬜ Sonido espacial: apagado",

    "accuracy": "Precisión: {n}%",
    "accuracyShort": "Prec. {n}%",
    "keysPerMinute": "PPM: {n}",
    "keysPerMinuteShort": "{n} PPM",
    "keysLabel": "Teclas: {n}",
    "timeShort": "{n}s",

    "openSettingsAria": "Abrir ajustes",
    "closeSettingsAria": "Cerrar ajustes",
    "settingsHeader": "Ajustes",
    "settingsPanel": "Ajustes de accesibilidad y juego",
    "settingsHelp": "Estos ajustes se guardan en este dispositivo.",
    "computerOnly": "Solo en el ordenador",
    "computerOnlyWhy": "Teclatlon es para practicar mecanografía con el teclado del ordenador.",
    "computerOnlyReason": "Necesitamos el teclado físico para escribir a máquina. El teclado que ves dibujado en pantalla no se puede pulsar. En un móvil o tablet no hay teclas de verdad para practicar.",
    "computerOnlySuggestion": "Abre esta página desde un portátil o un PC. Si tu móvil tiene un teclado físico, conéctalo por Bluetooth o USB.",

    /* --- /legal and /about -------------------------------------------
       The legal/about/team text moved out of this root dictionary in
       2026-09 when Teclatlon de-merged its SPA. Each of those pages is
       now a real PWA route with its own strings.<locale>.js pair
       (legal/strings.es.js, about/strings.es.js, team/strings.es.js).
       Anything that still needs /legal or /about copy reads it from
       those files, not from here. */
    }, 'es');
})();
