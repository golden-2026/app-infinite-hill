// Spanish for the lesson screens (2026-11-11, owner-approved): lesson.html, trip.html, my-religion.html, guide-memory.html.
// Load after lib/ih-es.js and before lib/ih-four.js. Same voice as ih-es.js: warm, tú, lowercase like the English, the
// mascot says "yo". Only the frame lives here. Lesson stories, questions and answers (episodes/c/data, lessons/*.json, the
// films) and each trip's own teaching (places/trips*.js) have no Spanish yet; those screens mark them translate="no".
// Scripture keeps standard Spanish names (Lucas, Marcos, Génesis, Levítico).
(function () {
  var E = window.IH_ES; if (!E) return;
  var D = [
    // ── lesson.html ──
    ["Infinite Hill · Lesson", "Infinite Hill · Lección"], ["week 1", "semana 1"], ["this week", "esta semana"], ["where it all starts", "donde todo empieza"],
    ["today", "hoy"], ["guide", "guía"], ["together", "juntos"], ["you", "tú"], ["close", "cerrar"], ["next", "siguiente"],
    ["the infinite hill mascot", "la mascota de infinite hill"], ["the mascot celebrating", "la mascota celebrando"],
    ["▶ tap to watch · sound on", "▶ toca para ver · con sonido"], ["got it. let's play →", "entendido. ¡a jugar! →"], ["tap for next", "toca para seguir"],
    ["your line for today", "tu frase de hoy"], ["how people live it", "cómo lo vive la gente"], ["where does this show up for you this week?", "¿dónde aparece esto en tu semana?"],
    ["at home", "en casa"], ["at work or school", "en el trabajo o la escuela"], ["with family", "con la familia"], ["with a friend", "con un amigo"], ["a hard moment", "un momento difícil"], ["something else", "otra cosa"],
    ["one minute. your choice how.", "un minuto. tú eliges cómo."], ["where this comes from", "de dónde viene esto"], ["done. finish today", "listo. terminar el día"],
    ["today counts", "hoy cuenta"], ["day streak", "días de racha"], ["games", "juegos"], ["today's word", "palabra de hoy"], ["your word", "tu palabra"], ["back to my path", "volver a mi camino"],

    // ── trip.html ──
    ["Guided Trip", "Viaje guiado"], ["Back to the hill", "Volver a la colina"], ["the place in 3D", "el lugar en 3D"], ["the story", "la historia"],
    ["your guide is taking you", "tu guía te lleva"], ["📱 look around", "📱 mirar alrededor"], ["‹ drag to look around ›", "‹ arrastra para mirar alrededor ›"],
    ["Next", "Siguiente"], ["I'm done", "Ya terminé"], ["quick check", "repaso rápido"], ["you were there", "estuviste ahí"], ["New story card · first visit", "Carta de historia nueva · primera visita"],
    ["Stay a minute: sit here quietly", "Quédate un minuto: siéntate aquí en calma"], ["Open your map: more places to wander", "Abre tu mapa: más lugares por recorrer"],
    ["Head home to the hill", "Vuelve a casa, a la colina"], ["One day, go for real with your circle", "Algún día, ve de verdad con tu círculo"],
    // the lines every trip shares (each trip's own teaching stays as written)
    ["before today's class, can i ask you something? what's been on your mind lately?", "antes de la clase de hoy, ¿te puedo preguntar algo? ¿qué has traído en la mente últimamente?"],
    ["just curious", "solo curiosidad"],

    // ── my-religion.html ──
    ["My Own Religion", "Mi propia religión"], ["back", "atrás"],
    ["hey. no wrong answers here. what's going on?", "hola. aquí no hay respuestas equivocadas. ¿qué está pasando?"],
    ["pick one. i'll find you a story for it.", "elige una. yo te encuentro una historia para eso."],
    ["anxious", "con ansiedad"], ["angry at someone", "enojo con alguien"], ["grieving", "en duelo"], ["lost on purpose", "sin rumbo, a propósito"], ["a relationship", "una relación"],
    ["okay. let's slow it all down, together.", "va. bajemos el ritmo, juntos."], ["fair. somebody got under your skin. i've got one for that.", "se vale. alguien te sacó de quicio. tengo una para eso."],
    ["i'm so sorry. i'll pick gently. take your time.", "lo siento mucho. voy a elegir con cuidado. tómate tu tiempo."], ["honest place to be. you're welcome here exactly as you are.", "es un lugar honesto para estar. aquí cabes tal como eres."],
    ["those are the big ones. i've got you.", "esas son de las grandes. aquí estoy contigo."], ["love that. curious is the best way in.", "me encanta. la curiosidad es la mejor manera de entrar."],
    ["find my story", "encuentra mi historia"],
    ["you said angry. this one's for you.", "dijiste enojo. esta es para ti."], ["▶ short film", "▶ corto"], ["your first story", "tu primera historia"],
    ["he came to pick a fight. what the Buddha does next is the opposite of what most of us would.", "llegó buscando pleito. lo que hace el Buda después es justo lo contrario de lo que haría casi cualquiera."],
    ["from the Samyutta Nikaya · then 2 quick questions", "del Samyutta Nikaya · luego 2 preguntas rápidas"], ["watch it", "verla"], ["show me a different one", "muéstrame otra"],
    ["tap for sound", "toca para el sonido"], ["sound on", "con sonido"], ["instant karma? · captions on", "¿karma instantáneo? · subtítulos en inglés"], ["questions →", "preguntas →"],
    ["quick one", "una rápida"], ["true", "verdadero"], ["false", "falso"], ["nailed it.", "¡la clavaste!"], ["not quite.", "casi."], ["that's the line.", "esa es la frase."], ["close.", "casi."],
    ["the word means action. the Buddha said intention is what he calls karma: a seed, not a referee.", "la palabra significa acción. el Buda dijo que la intención es lo que él llama karma: una semilla, no un árbitro."],
    ["of my luck", "de mi suerte"], ["I am the owner", "soy dueño"], ["of the universe", "del universo"], ["of my actions", "de mis acciones"],
    ["I am the owner of my actions, heir to my actions: a reflection chanted in many temples and monasteries. not a weight. a handle you can hold.", "soy dueño de mis acciones, heredero de mis acciones: una reflexión que se canta en muchos templos y monasterios. no es una carga. es algo firme de donde agarrarte."],
    ["the keep", "para guardar"], ["keep this one?", "¿te quedas con esta?"],
    ["belief", "creencia"], ["i hold it true", "la tengo por cierta"], ["practice", "práctica"], ["i'll do it", "la voy a hacer"], ["saying", "frase"], ["i'll say it to myself", "me la voy a decir"],
    ["not for me (that's fine)", "no es para mí (está bien)"], ["this one came out of your film. keep it as whatever it is to you.", "esta salió de tu película. guárdala como lo que sea para ti."],
    ["or press and hold the card, then flick it into a slot", "o mantén presionada la carta y lánzala a un espacio"],
    ["kept.", "guardada."], ["buddhism · Anguttara Nikaya", "budismo · Anguttara Nikaya"], ["see my own religion", "ver mi propia religión"],
    ["week 3 · built by you", "semana 3 · hecha por ti"], ["every piece taught the way its own tradition teaches it, with the source right there.", "cada pieza se enseña como la enseña su propia tradición, con la fuente ahí mismo."],
    ["pieces kept", "piezas guardadas"], ["traditions", "tradiciones"], ["stories", "historias"], ["beliefs", "creencias"], ["practices", "prácticas"], ["sayings", "frases"], ["holy days & places", "días santos y lugares"],
    ["i am the owner of my actions.", "soy dueño de mis acciones."], ["Anguttara Nikaya 5.57", "Anguttara Nikaya 5.57"],
    ["the intention is the seed.", "la intención es la semilla."], ["the Upanishads", "los Upanishads"],
    ["what you would not want, don't do.", "lo que no quieras para ti, no se lo hagas a otros."], ["the Analects of Confucius", "las Analectas de Confucio"],
    ["stop, one day a week.", "detente un día a la semana."], ["\"some tastes only come from stopping\" · the Talmud", "“algunos sabores solo llegan cuando te detienes” · el Talmud"],
    ["say thank you, out loud.", "da las gracias en voz alta."], ["the one who came back · Luke's Gospel", "el que regresó · Evangelio de Lucas"],
    ["spinning out? hand on the ground.", "¿se te va la cabeza? mano en el suelo."], ["the Buddha's life story", "la vida del Buda"],
    ["while you can, be good.", "mientras puedas, sé bueno."], ["Marcus Aurelius, Meditations", "Marco Aurelio, Meditaciones"],
    ["who knows? then, what now.", "¿quién sabe? y luego, ¿ahora qué?"], ["who knows? then, what now", "¿quién sabe? y luego, ¿ahora qué?"], ["the farmer's horse · the Huainanzi", "el caballo del granjero · el Huainanzi"],
    ["FRI", "VIE"], ["friday sunset to saturday night · next one in 3 days", "del atardecer del viernes a la noche del sábado · el próximo en 3 días"],
    ["where the hand touched the earth", "donde la mano tocó la tierra"], ["share my own religion", "compartir mi propia religión"],
    ["buddhism", "budismo"], ["hinduism", "hinduismo"], ["confucianism", "confucianismo"], ["judaism", "judaísmo"], ["christianity", "cristianismo"], ["stoicism", "estoicismo"], ["chinese classics", "clásicos chinos"],
    ["your story preview", "vista previa de tu historia"], ["your story · now", "tu historia · ahora"], ["my own religion:", "mi propia religión:"], ["send message", "enviar mensaje"],
    ["pick your 3 · tap to swap", "elige tus 3 · toca para cambiar"], ["share to story", "compartir en tu historia"], ["save image", "guardar imagen"],
    ["hinduism · the Upanishads", "hinduismo · los Upanishads"], ["christianity · Luke's Gospel", "cristianismo · Evangelio de Lucas"], ["some tastes only come from stopping.", "algunos sabores solo llegan cuando te detienes."],
    ["judaism · the Talmud", "judaísmo · el Talmud"], ["stoicism · Marcus Aurelius", "estoicismo · Marco Aurelio"], ["confucianism · the Analects", "confucianismo · las Analectas"], ["the Huainanzi", "el Huainanzi"],
    ["shared ground", "terreno común"], ["a few people near you share 3 of your beliefs.", "algunas personas cerca de ti comparten 3 de tus creencias."],
    ["no names, no faces, no profiles. just the overlap.", "sin nombres, sin caras, sin perfiles. solo lo que tienen en común."],
    ["an idea · real life", "una idea · vida real"], ["one table, one question.", "una mesa, una pregunta."],
    ["a supper for people who share your pieces. phones in a basket, one big question on the table, a verified host. a public place, always.", "una cena para gente que comparte tus piezas. los teléfonos en una canasta, una gran pregunta en la mesa y un anfitrión verificado. siempre en un lugar público."],
    ["18+ only", "solo +18"], ["verified hosts", "anfitriones verificados"], ["public venues", "lugares públicos"], ["no rankings", "sin rankings"],
    ["tell me when one's near me", "avísame cuando haya una cerca"], ["opt in", "activar"],
    ["off by default. you choose what anyone sees, and you can switch it off any time.", "apagado de inicio. tú eliges lo que ve cada quien, y puedes apagarlo cuando quieras."],
    ["one question · three answers", "una pregunta · tres respuestas"], ["60-second film", "película de 60 segundos"],
    ["Father, forgive them, for they don't know what they are doing.", "Padre, perdónalos, porque no saben lo que hacen."], ["Luke 23:34 · said from the cross, about people who weren't sorry", "Lucas 23:34 · dicho desde la cruz, sobre gente que no se arrepentía"],
    ["hatred does not cease by hatred at any time: hatred ceases by love.", "el odio nunca cesa con el odio: el odio cesa con el amor."], ["Dhammapada, verse 5 · it calls this an old rule", "Dhammapada, verso 5 · lo llama una ley antigua"],
    ["you shall not take vengeance, nor bear any grudge.", "no te vengarás, ni guardarás rencor."], ["Leviticus 19:18 · the same verse as \"love your neighbor\"", "Levítico 19:18 · el mismo versículo de “ama a tu prójimo”"],
    ["three traditions, three different roads. not the same answer. worth hearing all three.", "tres tradiciones, tres caminos distintos. no es la misma respuesta. vale la pena oír las tres."],
    ["watch · 60 sec", "ver · 60 s"],

    // ── guide-memory.html (the phone is written in both languages in the page; only the frame is here) ──
    ["Guide Memory", "Lo que tu guía recuerda"]
  ];
  D.forEach(function (p) {
    var k = E.key(p[0]); E.dict[k] = p[1];
    // the share card's swap chips show a line without its last period
    if (/\.$/.test(k) && /\.$/.test(p[1]) && E.dict[k.slice(0, -1)] == null) E.dict[k.slice(0, -1)] = p[1].slice(0, -1);
  });
  E.pats.unshift([/^later: plan a real trip to (.+) with people from your circle\.$/, "después: planea un viaje de verdad a $1 con gente de tu círculo."]);

  // ── source citations: standard Spanish names for scripture and the common works (the reference numbers stay) ──
  var WORK = { "The Bible": "La Biblia", "The Qur'an": "El Corán", "Qur'an": "Corán", "The Quran": "El Corán", "Tanakh": "Tanaj", "The Holy Scriptures": "Las Sagradas Escrituras",
    "Babylonian Talmud": "Talmud de Babilonia", "Jerusalem Talmud": "Talmud de Jerusalén", "Catechism of the Catholic Church": "Catecismo de la Iglesia Católica", "Mishnah": "Mishná", "Torah": "Torá",
    "Marcus Aurelius, Meditations": "Marco Aurelio, Meditaciones", "Sikh tradition": "tradición sij", "The Dhammapada": "El Dhammapada", "Seneca, Moral Letters to Lucilius": "Séneca, Cartas morales a Lucilio",
    "Confessions": "Confesiones", "Roman Missal": "Misal Romano", "Pali Canon": "Canon Pali", "Rashi's commentary on the Torah": "Comentario de Rashi a la Torá", "Yoga Sutras of Patanjali": "Yoga Sutras de Patanjali" };
  var BOOK = { "Genesis": "Génesis", "Exodus": "Éxodo", "Leviticus": "Levítico", "Numbers": "Números", "Deuteronomy": "Deuteronomio", "Joshua": "Josué", "Judges": "Jueces", "Ruth": "Rut",
    "Samuel": "Samuel", "Kings": "Reyes", "Chronicles": "Crónicas", "Ezra": "Esdras", "Nehemiah": "Nehemías", "Esther": "Ester", "Job": "Job", "Psalms": "Salmos", "Psalm": "Salmo",
    "Proverbs": "Proverbios", "Ecclesiastes": "Eclesiastés", "Song of Songs": "Cantar de los Cantares", "Song of Solomon": "Cantar de los Cantares", "Isaiah": "Isaías", "Jeremiah": "Jeremías",
    "Lamentations": "Lamentaciones", "Ezekiel": "Ezequiel", "Daniel": "Daniel", "Hosea": "Oseas", "Joel": "Joel", "Amos": "Amós", "Obadiah": "Abdías", "Jonah": "Jonás", "Micah": "Miqueas",
    "Nahum": "Nahúm", "Habakkuk": "Habacuc", "Zephaniah": "Sofonías", "Haggai": "Hageo", "Zechariah": "Zacarías", "Malachi": "Malaquías", "Matthew": "Mateo", "Mark": "Marcos", "Luke": "Lucas",
    "John": "Juan", "Acts": "Hechos", "Romans": "Romanos", "Corinthians": "Corintios", "Galatians": "Gálatas", "Ephesians": "Efesios", "Philippians": "Filipenses", "Colossians": "Colosenses",
    "Thessalonians": "Tesalonicenses", "Timothy": "Timoteo", "Titus": "Tito", "Philemon": "Filemón", "Hebrews": "Hebreos", "James": "Santiago", "Peter": "Pedro", "Jude": "Judas",
    "Revelation": "Apocalipsis", "Tobit": "Tobías", "Judith": "Judit", "Wisdom": "Sabiduría", "Sirach": "Eclesiástico", "Maccabees": "Macabeos", "Baruch": "Baruc", "Qur'an": "Corán", "Quran": "Corán" };
  var BOOKS = new RegExp("\\b(" + Object.keys(BOOK).sort(function (a, b) { return b.length - a.length; }).join("|").replace(/'/g, "'") + ")(?=\\s+\\d)", "g");
  E.cite = function (s) {
    s = String(s == null ? "" : s); var k = s.replace(/\s*\((paraphrased|adapted)\)\s*$/, "");
    var out = WORK[k] != null ? WORK[k] + s.slice(k.length) : s;
    return out.replace(BOOKS, function (m) { return BOOK[m]; }).replace(/\(paraphrased\)/g, "(paráfrasis)").replace(/\(adapted\)/g, "(adaptado)");
  };
})();
