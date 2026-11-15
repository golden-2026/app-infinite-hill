// "what i live by" (owner-approved 2026-11-15, mockups/what-i-live-by.html). Data only.
// films: for "my own religion", 2-3 lessons from each story film's OWN script, one tradition per film (never mixed),
//   each [english, spanish, source]. now: the film's own closing "modern life" line, used by the offline guide.
//   Every line restates what that film already says; nothing new is claimed for any tradition.
// paths: for a faith path, 2-3 lines from each story's own teaching (lessons/<id>.json), each with its verse or source.
// questions: Justin's optional big questions. Neutral, no right answer; an answer is the user's own, never a faith's teaching.
// Lowercase like the app. Everything the user picks stays on the phone (the app's state, S.live / S.spoke).
(function () {
  var films = {
    "buddhism/1": { now: ["when someone comes at you, their words are theirs. what you do next is yours.", "cuando alguien te ataca, sus palabras son suyas. lo que hagas después es tuyo."], l: [
      ["their insult stays with them.", "su insulto se queda con ellos.", "Samyutta Nikaya 7.2"],
      ["the intention inside it is what counts.", "lo que cuenta es la intención que lleva adentro.", "Anguttara Nikaya 6.63"],
      ["i am the owner of my actions.", "soy dueño de mis acciones.", "Anguttara Nikaya 5.57"]] },
    "buddhism/2": { now: ["bow to what can wake up in anyone. even the kid who's rude to you.", "inclínate ante lo que puede despertar en cualquiera. hasta el chico que es grosero contigo."], l: [
      ["never look down on anyone.", "nunca mires a nadie por encima del hombro.", "Lotus Sutra, ch. 20"],
      ["anyone can wake up.", "cualquiera puede despertar.", "Lotus Sutra, ch. 20"],
      ["bow to what wakes you up.", "inclínate ante lo que te despierta.", "the three jewels"]] },
    "buddhism/3": { now: ["your phone buzzes all day. remember your bowl.", "tu teléfono vibra todo el día. acuérdate de tu cuenco."], l: [
      ["the bowl is mindfulness.", "el cuenco es la atención plena.", "Samyutta Nikaya 47.20"],
      ["don't look away, step after step.", "no apartes la mirada, paso a paso.", "Samyutta Nikaya 47.20"],
      ["remember to notice.", "acuérdate de notar.", "sati"]] },
    "buddhism/4": { now: ["hard week? it's not just you. it's not the end.", "¿semana difícil? no eres solo tú. no es el final."], l: [
      ["there is an ache. it's not just you.", "hay un dolor. no eres solo tú.", "Samyutta Nikaya 56.11"],
      ["it has a cause: wanting things other than they are.", "tiene una causa: querer que las cosas sean distintas.", "Samyutta Nikaya 56.11"],
      ["it can end. there's a path.", "puede terminar. hay un camino.", "Samyutta Nikaya 56.11"]] },
    "buddhism/7": { now: ["who you were last year isn't who you are now. but it lit you.", "quien fuiste el año pasado no es quien eres hoy. pero te encendió."], l: [
      ["one flame lights the next.", "una llama enciende la siguiente.", "the Questions of King Milinda"],
      ["neither the same, nor someone else.", "ni el mismo, ni otro.", "the Questions of King Milinda"],
      ["each moment is lit from the last.", "cada momento se enciende del anterior.", "the Questions of King Milinda"]] },
    "christianity/1": { now: ["when the tray comes down the row, it's carrying more than bread.", "cuando la bandeja pasa por la fila, lleva más que pan."], l: [
      ["a meal is a memory.", "una comida es un recuerdo.", "Luke 22:19"],
      ["pass the bread, even to the one who'll let you down.", "pasa el pan, incluso a quien te va a fallar.", "Luke 22:21"],
      ["one loaf, many people.", "un pan, mucha gente.", "1 Corinthians 10:17"]] },
    "christianity/3": { now: ["nobody gives birth to themselves. it's a gift. and you're never too old to start again.", "nadie se da a luz a sí mismo. es un regalo. y nunca eres demasiado viejo para empezar de nuevo."], l: [
      ["never too old to start again.", "nunca eres demasiado viejo para empezar de nuevo.", "John 3:4"],
      ["bring your questions, even at night.", "trae tus preguntas, aunque sea de noche.", "John 3:2"],
      ["like the wind: you hear it, you can't see it.", "como el viento: lo oyes, no lo ves.", "John 3:8"]] },
    "christianity/5": { now: ["your story counts too. even a quiet one.", "tu historia también cuenta. aunque sea una callada."], l: [
      ["your story is a witness.", "tu historia es un testimonio.", "John 4:39"],
      ["just say what happened to you.", "solo cuenta lo que te pasó.", "John 4:29"],
      ["he talked with the one everyone avoided.", "él habló con la que todos evitaban.", "John 4:9"]] },
    "christianity/6": { now: ["in your corner, on the day you're scared to speak.", "de tu lado, el día que te da miedo hablar."], l: [
      ["closer than your own breath.", "más cerca que tu propio aliento.", "Acts 2:2"],
      ["the scared one stood up and spoke.", "el que tenía miedo se levantó y habló.", "Acts 2:14"],
      ["the spirit grows love, joy, peace.", "el espíritu hace crecer amor, alegría, paz.", "Galatians 5:22"]] },
    "catholic/3": { now: ["the thing that's huge at two a.m.? said out loud, it gets smaller.", "¿eso que a las dos de la mañana es enorme? dicho en voz alta, se hace más pequeño."], l: [
      ["the father runs to you.", "el padre corre hacia ti.", "Luke 15:20"],
      ["say it out loud. it gets smaller.", "dilo en voz alta. se hace más pequeño.", "John 20:22-23"],
      ["you hear it out loud: you're forgiven.", "lo oyes en voz alta: estás perdonado.", "John 20:23"]] },
    "catholic/5": { now: ["a saint isn't someone who never fell. it's someone who kept getting up.", "un santo no es alguien que nunca cayó. es alguien que siguió levantándose."], l: [
      ["a saint is someone who kept getting up.", "un santo es alguien que siguió levantándose.", "Matthew 26:75"],
      ["even peter fell. he wept, and came back.", "hasta pedro cayó. lloró, y volvió.", "Matthew 26:69-75"],
      ["ask a friend in heaven: pray for me.", "pídele a un amigo en el cielo: reza por mí.", "the communion of saints"]] },
    "judaism/1": { now: ["touch it on the way out: a reminder of who you are.", "tócala al salir: un recordatorio de quién eres."], l: [
      ["take the words with you.", "lleva las palabras contigo.", "Deuteronomy 6:9"],
      ["the one who guards us is on the inside.", "quien nos cuida está adentro.", "Talmud, Avodah Zarah 11a"],
      ["a reminder of who you are.", "un recordatorio de quién eres.", "the mezuzah"]] },
    "judaism/3": { now: ["when the group chat piles on someone, be the mensch.", "cuando el chat del grupo se le echa encima a alguien, sé el mensch."], l: [
      ["what's hateful to you, don't do to anyone.", "lo que odias, no se lo hagas a nadie.", "Talmud, Shabbat 31a"],
      ["the rest is explanation. go and learn it.", "lo demás es explicación. ve y apréndelo.", "Talmud, Shabbat 31a"],
      ["be a mensch.", "sé un mensch.", "Mishnah Avot 2:5"]] },
    "judaism/5": { now: ["on your best day, you can still remember who isn't there.", "en tu mejor día, todavía puedes recordar a quien no está."], l: [
      ["even in joy, remember.", "aun en la alegría, recuerda.", "Talmud, Berakhot 31a"],
      ["remember what's still broken.", "recuerda lo que sigue roto.", "the glass at a jewish wedding"],
      ["on your best day, remember who isn't there.", "en tu mejor día, recuerda a quien no está.", "Talmud, Berakhot 31a"]] },
    "islam/1": { now: ["before a meal, a drive, an exam: bismillah. so you never start alone.", "antes de comer, de manejar, de un examen: bismillah. así nunca empiezas solo."], l: [
      ["you never start alone.", "nunca empiezas solo.", "bismillah"],
      ["begin in god's name, not your own.", "empieza en el nombre de dios, no en el tuyo.", "Qur'an 27:30"],
      ["the beneficent, the merciful.", "el compasivo, el misericordioso.", "Qur'an 27:30"]] },
    "islam/4": { now: ["plan it fully. then hold it open.", "planéalo bien. luego déjalo abierto."], l: [
      ["mashallah for what's already here.", "mashallah por lo que ya está aquí.", "Qur'an 18:39"],
      ["inshallah for tomorrow.", "inshallah para mañana.", "Qur'an 18:23-24"],
      ["plan it fully. then hold it open.", "planéalo bien. luego déjalo abierto.", "Qur'an, surah 18"]] },
    "islam/5": { now: ["questions are part of it. ask, so your heart can rest.", "las preguntas son parte de esto. pregunta, para que tu corazón descanse."], l: [
      ["ask, so the heart can rest.", "pregunta, para que el corazón descanse.", "Qur'an 2:260"],
      ["he asked, and he wasn't scolded. he was shown.", "preguntó, y no lo regañaron. se lo mostraron.", "Qur'an 2:260"],
      ["faith can grow. questions are part of it.", "la fe puede crecer. las preguntas son parte de ella.", "Sahih Muslim 132"]] },
    "sikhism/1": { now: ["good news? waheguru. hard news? waheguru. it points past the feeling, to what's bigger.", "¿buenas noticias? waheguru. ¿malas noticias? waheguru. apunta más allá del sentimiento, a algo más grande."], l: [
      ["when words run out, wow.", "cuando se acaban las palabras, wow.", "Guru Granth Sahib"],
      ["god is beyond counting, beyond describing.", "dios está más allá de contar, más allá de describir.", "Guru Granth Sahib"],
      ["good news or hard news: waheguru.", "buenas o malas noticias: waheguru.", "waheguru"]] },
    "sikhism/2": { now: ["at school, where you sit says who you are. in the langar row, it can't.", "en la escuela, dónde te sientas dice quién eres. en la fila del langar, no."], l: [
      ["in this row, nobody sits higher.", "en esta fila, nadie se sienta más alto.", "langar"],
      ["first the meal, then the meeting.", "primero la comida, luego la reunión.", "Goindwal, Guru Amar Das"],
      ["open to anyone, of any faith or none.", "abierto a todos, de cualquier fe o de ninguna.", "langar"]] },
    "sikhism/5": { now: ["the good of all. not just us. even the person you're not speaking to.", "el bien de todos. no solo el nuestro. hasta la persona con la que no te hablas."], l: [
      ["for everyone, not just us.", "para todos, no solo para nosotros.", "the Ardas"],
      ["the same light in every face.", "la misma luz en cada rostro.", "Bhai Ghanaiya"],
      ["water for the other side too.", "agua también para el otro lado.", "Bhai Ghanaiya"]] },
    "hinduism/2": { now: ["name the big thing first. then ask for the small things.", "nombra primero lo grande. luego pide las cosas pequeñas."], l: [
      ["one sound, before words.", "un sonido, antes de las palabras.", "Katha Upanishad"],
      ["ask for the one thing that doesn't end.", "pide lo único que no se acaba.", "Katha Upanishad"],
      ["name the big thing first.", "nombra primero lo grande.", "om"]] },
    "hinduism/4": { now: ["a bow isn't about which side you're on. it's to what's sacred in a person.", "una reverencia no es de qué lado estás. es a lo sagrado en una persona."], l: [
      ["the light in me sees the light in you.", "la luz en mí ve la luz en ti.", "namaste"],
      ["a bow isn't about sides.", "una reverencia no es de bandos.", "the Mahabharata"],
      ["bow to what's sacred in a person.", "inclínate ante lo sagrado en una persona.", "the Mahabharata"]] },
    "spiritual/1": { now: ["one question always has an answer. not why. what now?", "una pregunta siempre tiene respuesta. no por qué. ¿y ahora qué?"], l: [
      ["not why, but what now.", "no por qué, sino ¿y ahora qué?", "Huainanzi, ch. 18"],
      ["good luck or bad? who knows.", "¿buena o mala suerte? quién sabe.", "Huainanzi, ch. 18"],
      ["the turns of luck can't be fully known.", "los giros de la suerte no se pueden saber del todo.", "Huainanzi, ch. 18"]] },
    "spiritual/6": { now: ["when someone bugs you more than they should, ask: is any of this mine?", "cuando alguien te molesta más de la cuenta, pregúntate: ¿algo de esto es mío?"], l: [
      ["what bugs me may be mine.", "lo que me molesta puede ser mío.", "Matthew 7:3"],
      ["fix your own plank first.", "saca primero tu propia viga.", "Matthew 7:5"],
      ["clear eyes, then help.", "ojos claros, y luego ayudas.", "Matthew 7:5"]] }
  };

  var paths = {
    "light": { src: "Genesis 1", l: [["a blank page is where creation starts.", "una página en blanco es donde empieza la creación.", "Genesis 1:1-3"], ["the dark gets a place and a name.", "la oscuridad recibe un lugar y un nombre.", "Genesis 1:4-5"], ["everyone is made in god's image.", "todos estamos hechos a imagen de dios.", "Genesis 1:27"]] },
    "lost-son": { src: "Luke 15", l: [["the father runs down the road.", "el padre corre por el camino.", "Luke 15:20"], ["he never let him finish the speech.", "nunca lo dejó terminar el discurso.", "Luke 15:21-22"], ["lost, then found.", "perdido, y luego encontrado.", "Luke 15:24"]] },
    "ruth": { src: "the book of Ruth", l: [["where you go, i will go.", "a donde tú vayas, iré yo.", "Ruth 1:16"], ["you can say it out loud: it's bitter.", "puedes decirlo en voz alta: es amargo.", "Ruth 1:20"], ["leave extra, on purpose.", "deja de más, a propósito.", "Ruth 2:16"]] },
    "isl-ibrahim": { src: "the hadith", l: [["tears can be mercy.", "las lágrimas pueden ser misericordia.", "Bukhari 1303"], ["grieve, and still hold on to god.", "llora, y aun así aférrate a dios.", "sabr"], ["beautiful patience.", "paciencia hermosa.", "Qur'an 12:83"]] },
    "ganesha-first": { src: "a traditional story", l: [["know what your world is.", "sabe cuál es tu mundo.", "a traditional story"], ["before the big plans, remember what matters most.", "antes de los grandes planes, recuerda lo que más importa.", "a traditional story"], ["begin with ganesha.", "empieza con ganesha.", "a traditional story"]] },
    "tusk": { src: "a traditional story", l: [["use what you have.", "usa lo que tienes.", "a traditional story"], ["keep going, and know why.", "sigue adelante, y sabe por qué.", "a traditional story"], ["never write a line you don't understand.", "nunca escribas una línea que no entiendas.", "the Mahabharata"]] },
    "valmiki": { src: "the Ramayana tradition", l: [["who you were isn't who you have to be.", "quien fuiste no es quien tienes que ser.", "as tradition tells it"], ["people do change.", "la gente sí cambia.", "as tradition tells it"], ["a robber became the poet of the Ramayana.", "un ladrón se volvió el poeta del Ramayana.", "as tradition tells it"]] },
    "no-effort": { src: "Bhagavad Gita 6", l: [["no effort is ever lost.", "ningún esfuerzo se pierde.", "Gita 6.40"], ["starting again isn't starting from zero.", "volver a empezar no es empezar de cero.", "Gita 6.44"], ["the mind is restless, like the wind.", "la mente es inquieta, como el viento.", "Gita 6.34"]] },
    "universe": { src: "the Puranas", l: [["even the universe starts over.", "hasta el universo vuelve a empezar.", "the Puranas"], ["an ending can be the quiet before something new.", "un final puede ser la calma antes de algo nuevo.", "the Puranas"], ["feel the ending, then let the lotus open.", "siente el final, y deja que el loto se abra.", "the Puranas"]] },
    "first-letters": { src: "Vidyarambham", l: [["being a beginner is sacred.", "ser principiante es sagrado.", "Vidyarambham"], ["you're allowed to start small and clumsy.", "puedes empezar pequeño y torpe.", "Vidyarambham"], ["the first wobbly letter gets a festival.", "la primera letra chueca tiene su fiesta.", "Vidyarambham"]] },
    "milk": { src: "griha pravesh", l: [["a new home begins with a spill.", "un hogar nuevo empieza con un derrame.", "griha pravesh"], ["hope for what will overflow.", "espera lo que va a desbordarse.", "griha pravesh"], ["a fresh start isn't only what you leave behind.", "un nuevo comienzo no es solo lo que dejas atrás.", "griha pravesh"]] },
    "ganesha-head": { src: "the Shiva Purana", l: [["a broken thing can become something new.", "algo roto puede volverse algo nuevo.", "the Shiva Purana"], ["the face nobody planned became the most loved.", "el rostro que nadie planeó se volvió el más querido.", "the Shiva Purana"], ["remember ganesha before any new beginning.", "recuerda a ganesha antes de cada comienzo.", "the Shiva Purana"]] },
    "rama": { src: "the Ramayana", l: [["meet good news and bad news the same way.", "recibe igual las buenas y las malas noticias.", "Gita 2.38"], ["his face didn't change.", "su rostro no cambió.", "the Ramayana"], ["keep walking the right path.", "sigue por el camino correcto.", "the Ramayana"]] },
    "ganga": { src: "the Ramayana", l: [["your effort may be part of a longer story.", "tu esfuerzo puede ser parte de una historia más larga.", "the Ramayana"], ["three generations tried. one kept going.", "tres generaciones lo intentaron. uno siguió.", "the Ramayana"], ["the river came down because someone kept going.", "el río bajó porque alguien siguió.", "the Ramayana"]] },
    "vibhishana": { src: "the Ramayana", l: [["whoever comes for shelter is protected.", "quien llega buscando refugio queda protegido.", "Ramayana, Yuddha Kanda 18"], ["say what's right, even when it costs you.", "di lo correcto, aunque te cueste.", "the Ramayana"], ["the door is open to anyone who turns.", "la puerta está abierta para quien se vuelva.", "the Ramayana"]] },
    "gajendra": { src: "the Bhagavata Purana", l: [["even the strongest needs help.", "hasta el más fuerte necesita ayuda.", "Bhagavata 8.2"], ["stop fighting alone. call out.", "deja de pelear solo. pide ayuda.", "Bhagavata 8.3"], ["ask for the deepest help, not the nearest.", "pide la ayuda más profunda, no la más cercana.", "Bhagavata 8.3.25"]] },
    "ahalya": { src: "the Ramayana", l: [["no one is too stuck to stand up again.", "nadie está tan atorado como para no volver a levantarse.", "the Ramayana"], ["grace can reach anyone.", "la gracia puede llegar a cualquiera.", "the Ramayana"], ["years of stuck can end in one moment.", "años atorado pueden terminar en un momento.", "the Ramayana"]] },
    "markandeya": { src: "the Puranas", l: [["fate isn't always the final word.", "el destino no siempre tiene la última palabra.", "the Puranas"], ["hold on with your whole heart.", "aférrate con todo el corazón.", "the Puranas"], ["an ending everyone thought was fixed can change.", "un final que todos creían fijo puede cambiar.", "the Puranas"]] },
    "squirrel": { src: "a folk story", l: [["god sees the love, not the size.", "dios ve el amor, no el tamaño.", "a folk story"], ["a tiny effort, given whole-hearted, counts.", "un esfuerzo pequeñito, dado de corazón, cuenta.", "a folk story"], ["the smallest helper gets a place too.", "el ayudante más pequeño también tiene su lugar.", "a folk story"]] },
    "krishna-morning": { src: "the Bhagavata Purana", l: [["give the first minutes to stillness.", "dale los primeros minutos a la calma.", "the Bhagavata Purana"], ["the hour before sunrise.", "la hora antes del amanecer.", "brahma muhurta"], ["even with a kingdom waiting.", "aun con un reino esperando.", "the Bhagavata Purana"]] },
    "parvati": { src: "the Shiva Purana", l: [["win it every day, not in one big day.", "gánalo cada día, no en un solo gran día.", "the Shiva Purana"], ["steady practice changes the one who does it.", "la práctica constante cambia a quien la hace.", "tapas"], ["season after season.", "temporada tras temporada.", "the Shiva Purana"]] },
    "restless-mind": { src: "Bhagavad Gita 6", l: [["you're right, it's hard.", "tienes razón, es difícil.", "Gita 6.35"], ["practice, and letting go.", "práctica, y soltar.", "Gita 6.35"], ["come back, again and again.", "vuelve, una y otra vez.", "Gita 6.26"]] },
    "arjuna-dark": { src: "the Mahabharata", l: [["notice something small, then practice.", "nota algo pequeño, y luego practica.", "the Mahabharata"], ["great by repetition.", "grande por la repetición.", "the Mahabharata"], ["practice until it's part of you.", "practica hasta que sea parte de ti.", "the Mahabharata"]] },
    "narada": { src: "the Puranas", l: [["two words, taken everywhere.", "dos palabras, llevadas a todas partes.", "the Puranas"], ["said again and again, it fills the heart.", "dicho una y otra vez, llena el corazón.", "japa"], ["no retreat needed.", "no hace falta un retiro.", "the Puranas"]] },
    "annapurna": { src: "a legend of Varanasi", l: [["food is a gift, never just fuel.", "la comida es un regalo, nunca solo combustible.", "a legend of Varanasi"], ["pause before eating. give thanks.", "haz una pausa antes de comer. da gracias.", "a legend of Varanasi"], ["even a god stood with an empty bowl.", "hasta un dios estuvo con el cuenco vacío.", "a legend of Varanasi"]] },
    "new-clothes": { src: "Bhagavad Gita 2", l: [["only the clothes get old.", "solo la ropa envejece.", "Gita 2.22"], ["the one wearing them stays whole.", "quien la lleva sigue entero.", "Gita 2.20"], ["the true self can't be cut or burned.", "el verdadero ser no se puede cortar ni quemar.", "Gita 2.23"]] },
    "homecoming": { src: "the Ramayana", l: [["there's always a way back.", "siempre hay un camino de regreso.", "the Ramayana"], ["light wins over darkness.", "la luz gana sobre la oscuridad.", "Diwali"], ["however long you've been gone, a lamp is waiting.", "no importa cuánto tiempo te fuiste, una lámpara te espera.", "the Ramayana"]] },
    "holika": { src: "the Puranas", l: [["goodness outlasts cruelty.", "la bondad dura más que la crueldad.", "the Puranas"], ["devotion was enough.", "la devoción bastó.", "the Puranas"], ["throw old grudges in the fire.", "echa los viejos rencores al fuego.", "Holi"]] },
    "ugadi": { src: "Ugadi", l: [["the whole year in one spoon.", "todo el año en una cucharada.", "Ugadi"], ["meet joy and sorrow alike.", "recibe igual la alegría y la tristeza.", "Ugadi"], ["taste all six. the bitter too.", "prueba los seis sabores. lo amargo también.", "Ugadi"]] },
    "visarjan": { src: "Ganesh Chaturthi", l: [["welcome with love, release with love.", "recibe con amor, suelta con amor.", "Ganesh Chaturthi"], ["trust the return.", "confía en el regreso.", "Ganesh Chaturthi"], ["dance all the way to the water.", "baila todo el camino hasta el agua.", "Ganesh Chaturthi"]] },
    "durga": { src: "the Devi Mahatmya", l: [["don't stop when it changes shape.", "no te detengas cuando cambie de forma.", "Devi Mahatmya 3"], ["she didn't win on day one.", "no ganó el primer día.", "the Devi Mahatmya"], ["the mother who protects.", "la madre que protege.", "the Devi Mahatmya"]] },
    "kumbh": { src: "the Kumbh Mela", l: [["a fresh start is something you step into.", "un nuevo comienzo es algo a lo que entras.", "the Kumbh Mela"], ["walk into the river.", "entra al río.", "the Kumbh Mela"], ["millions, renewed together.", "millones, renovados juntos.", "the Kumbh Mela"]] },

    // ── every faith path's first week, stories 2-7 (2026-11-15), from each story's own lessons/<id>.json ──
    // olive (Christianity)
    "abram": { src: "Genesis 12", l: [["faith is the next step, not the whole road.", "la fe es el siguiente paso, no todo el camino.", "Genesis 12:4"], ["no map. just a promise.", "sin mapa. solo una promesa.", "Genesis 12:2"], ["in you all the families of the earth are blessed.", "en ti serán benditas todas las familias de la tierra.", "Genesis 12:3"]] },
    "nets": { src: "Luke 5", l: [["because you say so.", "porque tú lo dices.", "Luke 5:5"], ["one more try you didn't feel like making.", "un intento más que no tenías ganas de hacer.", "Luke 5:4-6"], ["you'll catch people, to live.", "pescarás personas, para que vivan.", "Luke 5:10"]] },
    "born-again": { src: "John 3", l: [["bring your question, even at night.", "trae tu pregunta, aunque sea de noche.", "John 3:2"], ["born from above: a gift you receive.", "nacer de lo alto: un regalo que recibes.", "John 3:3"], ["the spirit is known by what it changes.", "el espíritu se conoce por lo que cambia.", "John 3:8"]] },
    "zacchaeus": { src: "Luke 19", l: [["he called him down by name.", "lo llamó por su nombre para que bajara.", "Luke 19:5"], ["the welcome comes first. the change follows.", "primero la bienvenida. el cambio viene después.", "Luke 19:5-8"], ["he still belonged.", "todavía era parte.", "Luke 19:9"]] },
    "rest": { src: "Genesis 2", l: [["the first thing called holy was a day of rest.", "lo primero llamado santo fue un día de descanso.", "Genesis 2:3"], ["rest is a gift, not a reward for being done.", "el descanso es un regalo, no un premio por terminar.", "Genesis 2:2-3"], ["start with rest.", "empieza con el descanso.", "Genesis 2:3"]] },
    // angelus (Catholicism)
    "cat-bread": { src: "Luke 24", l: [["stay with us.", "quédate con nosotros.", "Luke 24:29"], ["known in the breaking of the bread.", "lo reconocieron al partir el pan.", "Luke 24:35"], ["at every mass, he stays.", "en cada misa, él se queda.", "the real presence"]] },
    "cat-ars": { src: "John 20 · Saint John Vianney", l: [["whose sins you forgive, they are forgiven.", "a quienes perdonen los pecados, les quedan perdonados.", "John 20:23"], ["forgiveness is a gift, not earned.", "el perdón es un regalo, no se gana.", "the sacrament of confession"], ["you can start with: it's been a long time.", "puedes empezar con: hace mucho tiempo.", "Saint John Vianney"]] },
    "cat-beads": { src: "the desert monks · the rosary", l: [["heart over count.", "el corazón antes que la cuenta.", "Palladius, the Lausiac History"], ["the beads hold the count. the scenes are the prayer.", "las cuentas llevan la cuenta. las escenas son la oración.", "the rosary"], ["look at the face of christ, with mary.", "mira el rostro de cristo, con maría.", "John Paul II, Rosarium Virginis Mariae"]] },
    "cat-cana": { src: "John 2", l: [["the best came last.", "lo mejor llegó al final.", "John 2:10"], ["mary noticed, and went to her son.", "maría se dio cuenta, y fue con su hijo.", "John 2:3"], ["one family, living and dead, praying for each other.", "una familia, vivos y difuntos, rezando unos por otros.", "the communion of saints"]] },
    "cat-ashes": { src: "Lent", l: [["less, on purpose, so there's room.", "menos, a propósito, para que haya lugar.", "Lent"], ["you won't be here forever. what will you do with the time?", "no estarás aquí para siempre. ¿qué harás con el tiempo?", "Ash Wednesday"], ["forty days, to keep him company in the desert.", "cuarenta días, para acompañarlo en el desierto.", "Matthew 4:2"]] },
    "cat-cloak": { src: "Mark 5", l: [["just the edge of his cloak.", "solo el borde de su manto.", "Mark 5:27-28"], ["he called her daughter.", "la llamó hija.", "Mark 5:34"], ["small signs that point you to god.", "pequeñas señales que te llevan a dios.", "sacramentals"]] },
    // pomegranate (Judaism)
    "jew-angels": { src: "Talmud, Shabbat 119b", l: [["light it first.", "enciéndela primero.", "the Shabbat candles"], ["the shabbat light is for peace in the home.", "la luz de shabat es para la paz en el hogar.", "shalom bayit"], ["a peaceful home makes even the other angel say amen.", "un hogar en paz hace que hasta el otro ángel diga amén.", "Talmud, Shabbat 119b"]] },
    "jew-worse": { src: "a Yiddish folk tale", l: [["it could always be worse.", "siempre podría ser peor.", "a Yiddish folk tale"], ["look again at what you already have.", "mira otra vez lo que ya tienes.", "a Yiddish folk tale"], ["where no one is acting human, try to be.", "donde nadie actúa como persona, trata de serlo.", "Mishnah Avot 2:5"]] },
    "jew-dough": { src: "Exodus 12", l: [["no time to rise.", "sin tiempo para que leude.", "Exodus 12:34"], ["see yourself as if you left egypt too.", "mírate como si tú también hubieras salido de egipto.", "Mishnah Pesachim 10:5"], ["ask. then listen.", "pregunta. luego escucha.", "the seder"]] },
    "jew-glass": { src: "Talmud, Berakhot 31a", l: [["even in joy, remember.", "aun en la alegría, recuerda.", "Talmud, Berakhot 31a"], ["crunch, then cheer.", "el crujido, y luego la fiesta.", "the jewish wedding"], ["if i forget you, jerusalem.", "si me olvido de ti, jerusalén.", "Psalm 137:5"]] },
    "jew-judith": { src: "Jewish history, 1922", l: [["from that age, the mitzvot are yours.", "desde esa edad, las mitzvot son tuyas.", "bat mitzvah"], ["no thunder sounded, no lightning struck.", "no sonó ningún trueno, no cayó ningún rayo.", "Judith Kaplan, 1922"], ["she went first.", "ella fue primero.", "Judith Kaplan, 1922"]] },
    "jew-hillel": { src: "Talmud, Eruvin 13b", l: [["these and these are the words of the living god.", "estas y estas son palabras del dios vivo.", "Talmud, Eruvin 13b"], ["say theirs first.", "di primero lo del otro.", "Talmud, Eruvin 13b"], ["argue for the sake of heaven.", "discute por amor al cielo.", "Mishnah Avot 5:17"]] },
    // datepalm (Islam)
    "isl-fatiha": { src: "al-Fatiha", l: [["you alone we worship, you alone we ask for help.", "solo a ti adoramos, solo a ti pedimos ayuda.", "Qur'an 1:5"], ["show us the straight path.", "guíanos por el camino recto.", "Qur'an 1:6"], ["god answers as you pray.", "dios responde mientras rezas.", "Sahih Muslim 395"]] },
    "isl-wudu": { src: "the hadith · Qur'an 5:6", l: [["wash, then pray. every time.", "lávate, luego reza. cada vez.", "Sahih al-Bukhari 1149"], ["the deeds god loves most are the steady ones, even if small.", "las obras que dios más ama son las constantes, aunque sean pequeñas.", "Sahih al-Bukhari 6464"], ["no one is shut out of prayer.", "nadie queda fuera de la oración.", "Qur'an 5:6"]] },
    "isl-inshallah": { src: "the Qur'an, surah 18", l: [["mashallah: name the gift.", "mashallah: nombra el regalo.", "Qur'an 18:39"], ["inshallah: hold tomorrow with an open hand.", "inshallah: sostén el mañana con la mano abierta.", "Qur'an 18:23-24"], ["plan for real. the future isn't yours to promise.", "planea en serio. el futuro no es tuyo para prometerlo.", "Qur'an 18:23-24"]] },
    "isl-doubt": { src: "the story of Ibrahim", l: [["ask, so the heart can rest.", "pregunta, para que el corazón descanse.", "Qur'an 2:260"], ["i don't love things that set.", "no amo lo que se oculta.", "Qur'an 6:76"], ["the friend of god was also the one who asked.", "el amigo de dios fue también el que preguntó.", "Qur'an 4:125"]] },
    "isl-ramadan": { src: "Qur'an 2:183-185", l: [["god wants ease for you, not hardship.", "dios quiere para ti facilidad, no dificultad.", "Qur'an 2:185"], ["the fast is for taqwa, awareness of god.", "el ayuno es para la taqwa, la conciencia de dios.", "Qur'an 2:183"], ["the hunger is a tool, not the point.", "el hambre es una herramienta, no el objetivo.", "Qur'an 2:183"]] },
    "isl-eid": { src: "the two Eids", l: [["two better days.", "dos días mejores.", "Sunan Abi Dawud 1134"], ["nobody misses the feast.", "nadie se queda sin fiesta.", "zakat al-fitr"], ["the joy isn't a break from faith.", "la alegría no es un descanso de la fe.", "Eid al-Fitr and Eid al-Adha"]] },
    // lotus (Buddhism)
    "bud-bow": { src: "the Lotus Sutra", l: [["never look down on anyone.", "nunca mires a nadie por encima del hombro.", "Lotus Sutra, ch. 20"], ["anyone can wake up.", "cualquiera puede despertar.", "Lotus Sutra, ch. 20"], ["bow to the possibility of waking up.", "inclínate ante la posibilidad de despertar.", "the three jewels"]] },
    "bud-oil": { src: "Samyutta Nikaya 47.20", l: [["carry it full.", "llévalo lleno.", "Samyutta Nikaya 47.20"], ["mindfulness is noticing the slip, and coming back.", "la atención plena es notar el descuido, y volver.", "sati"], ["come and see.", "ven y ve.", "ehipassiko"]] },
    "bud-deer-park": { src: "Samyutta Nikaya 56.11", l: [["this is hard, for everyone.", "esto es difícil, para todos.", "Samyutta Nikaya 56.11"], ["the cause is craving.", "la causa es el deseo.", "Samyutta Nikaya 56.11"], ["it can end.", "puede terminar.", "Samyutta Nikaya 56.11"]] },
    "bud-alms": { src: "the Buddha's life story", l: [["giving comes first.", "dar va primero.", "dana"], ["the giver practices an open hand.", "quien da practica la mano abierta.", "dana"], ["get up. live the path well.", "levántate. vive bien el camino.", "Dhammapada 168"]] },
    "bud-vesak": { src: "Vesak", l: [["not a god. a person who woke up.", "no un dios. una persona que despertó.", "Anguttara Nikaya 4.36"], ["one full moon holds his whole story.", "una luna llena guarda toda su historia.", "Vesak"], ["remember him as he asked: awake.", "recuérdalo como pidió: despierto.", "Anguttara Nikaya 4.36"]] },
    "bud-lamp": { src: "the Questions of King Milinda", l: [["one flame lights the next.", "una llama enciende la siguiente.", "the Questions of King Milinda"], ["neither the same, nor someone else.", "ni el mismo, ni otro.", "the Questions of King Milinda"], ["a kind life is good either way.", "una vida bondadosa es buena de cualquier modo.", "Anguttara Nikaya 3.65"]] },
    // nectar (Sikhism)
    "sik-bargain": { src: "a sakhi of Guru Nanak", l: [["the true bargain: hungry people, fed.", "el verdadero negocio: gente con hambre, alimentada.", "Sacha Sauda"], ["the food is free, the floor is shared.", "la comida es gratis, el piso es de todos.", "langar"], ["nobody sits higher.", "nadie se sienta más alto.", "langar"]] },
    "sik-crown": { src: "a sakhi of Guru Gobind Singh", l: [["a crown you tie yourself.", "una corona que tú mismo te atas.", "the dastaar"], ["gold didn't hold him.", "el oro no lo ataba.", "Gurdwara Kangan Ghat, Patna"], ["the kara reminds the hand to do only good.", "el kara le recuerda a la mano hacer solo el bien.", "the kara"]] },
    "sik-five": { src: "Vaisakhi, 1699", l: [["five stood up, and drank from one bowl.", "cinco se pusieron de pie, y bebieron de un mismo cuenco.", "Vaisakhi, 1699"], ["names in place of caste.", "nombres en lugar de casta.", "Singh and Kaur"], ["the guru became the disciple.", "el guru se volvió discípulo.", "Vaisakhi, 1699"]] },
    "sik-water": { src: "a sakhi of Bhai Ghanaiya", l: [["water for both sides.", "agua para los dos lados.", "Bhai Ghanaiya"], ["the guru's light in every face.", "la luz del guru en cada rostro.", "Bhai Ghanaiya"], ["the good of all. not just us.", "el bien de todos. no solo el nuestro.", "the Ardas, sarbat da bhala"]] },
    "sik-river": { src: "a sakhi of Guru Nanak", l: [["look underneath the labels.", "mira debajo de las etiquetas.", "the Janamsakhis"], ["sikh means learner.", "sij significa aprendiz.", "shishya"], ["a heart that is actually present.", "un corazón que de verdad está presente.", "the Janamsakhis"]] },
    "sik-khanda": { src: "a sakhi of Guru Hargobind", l: [["hold them both: the world and the spirit.", "sostén los dos: el mundo y el espíritu.", "miri and piri"], ["inside, a hermit. outside, a prince.", "por dentro, un ermitaño. por fuera, un príncipe.", "Guru Hargobind"], ["a sword for protecting, never for attacking.", "una espada para proteger, nunca para atacar.", "the kirpan"]] }
  };

  // [long question (asked), short line (kept on the page)], each in [english, spanish]
  var questions = [
    [["do you think things happen for a reason?", "¿crees que las cosas pasan por algo?"], ["do things happen for a reason?", "¿las cosas pasan por algo?"]],
    [["do you think there's something bigger than us?", "¿crees que hay algo más grande que nosotros?"], ["is there something bigger than us?", "¿hay algo más grande que nosotros?"]],
    [["do you think people can really change?", "¿crees que la gente de verdad puede cambiar?"], ["can people really change?", "¿la gente de verdad puede cambiar?"]],
    [["do you think everyone deserves a second chance?", "¿crees que todos merecen una segunda oportunidad?"], ["does everyone deserve a second chance?", "¿todos merecen una segunda oportunidad?"]],
    [["do you think some part of us goes on after we die?", "¿crees que una parte de nosotros sigue después de morir?"], ["does some part of us go on?", "¿una parte de nosotros sigue?"]],
    [["do you think forgiving someone helps you too?", "¿crees que perdonar a alguien también te ayuda a ti?"], ["does forgiving help the one who forgives?", "¿perdonar ayuda al que perdona?"]],
    [["do you think quiet time, or prayer, changes anything?", "¿crees que un rato de silencio, o de oración, cambia algo?"], ["does quiet time, or prayer, change anything?", "¿el silencio, o la oración, cambia algo?"]],
    [["do you think we owe something to strangers?", "¿crees que les debemos algo a los desconocidos?"], ["do we owe something to strangers?", "¿les debemos algo a los desconocidos?"]],
    [["do you think doubt can be part of faith?", "¿crees que la duda puede ser parte de la fe?"], ["can doubt be part of faith?", "¿la duda puede ser parte de la fe?"]],
    [["do you think gratitude changes how a day goes?", "¿crees que agradecer cambia cómo va el día?"], ["does gratitude change a day?", "¿agradecer cambia un día?"]]
  ];

  window.IH_LIVEBY = { films: films, paths: paths, questions: questions };
})();
