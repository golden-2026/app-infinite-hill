// Spanish for content/journeys.ts: door hooks, "my own path", and each door's whole climb (samples, "by here you'll
// be able to…" promises, summits, year names). Same shapes and order as the English there; content/journeys.ts picks
// the language when a screen reads it. Import-free.
//
// DRAFT: like the English, NOT KEEPER-REVIEWED, and the Spanish is a first draft too. Every line must be checked by
// that tradition's Keeper (and a native speaker) before public release (docs/CONTENT_RELEASE.md).
// Promises finish the sentence "aquí ya podrás…" (an infinitive, as the English finishes "you'll be able to…").

export type PlanEs = {
  camps: [string[], string][];
  years?: [string[], string][];
  summit: { know: string; practice: string; able: string };
};

export const DOOR_HOOK_ES: Record<string, string> = {
  HINDUISM: "dioses, epopeyas, la Gita: una travesía de cinco años",
  CHRISTIANITY: "parábolas, la vida de Jesús, un evangelio completo",
  CATHOLIC: "la misa, los santos, el rosario, los Salmos",
  JUDAISM: "el Génesis, Shabbat, un año de porciones de la Torá",
  ISLAM: "las historias de los profetas, el salat, las suras cortas",
  BUDDHISM: "la vida del Buda, la respiración, el Dhammapada",
  SIKHISM: "los diez Gurús, seva y kirtan, el Japji Sahib",
  SPIRITUAL: "los estoicos, Rumi, historias zen: lo mejor de cada puerta",
};

export const OWN_PATH_ES = {
  title: "mi propio camino",
  line: "un camino hecho a tu medida",
  promise: "las mejores ideas de la casa, elegidas para ti: la quietud de una tradición, una historia de otra, una frase para llevar contigo de una tercera. sin inscribirte a nada.",
};

/** Hinduism's years two to five (the only door with hand-written year names). */
export const YEAR_NAMES_ES = ["las cordilleras", "las grandes epopeyas", "dioses y escuelas", "la lengua y el mundo"];

export const PLANS_ES: Record<string, PlanEs> = {
  HINDUISM: {
    camps: [
      [["namaste", "om", "dharma", "karma"], "conocer palabras que quizá escuchaste toda tu vida, y lo que hay debajo de cada una"],
      [["el colmillo roto de Ganesha", "el salto de Hanuman", "el Ramayana como serie", "los suspensos del Mahabharata"], "contar el Ramayana de principio a fin, y por qué Ganesha tiene cabeza de elefante"],
      [["la respiración", "elegir un mantra", "un altar en casa con cinco objetos", "el arti al atardecer"], "sentarte con tu respiración cinco minutos, y saber qué pasa en el arti y por qué"],
      [["la desesperación de Arjuna", "el yoga de la acción", "la visión", "los 18 capítulos"], "leer un verso de la Gita y saber qué plantea: la habrás leído completa"],
      [["los Upanishads", "los tres caminos", "Advaita y Dvaita, sin jerarquías", "el comienzo de los Yoga Sutras"], "explicar los tres caminos (acción, devoción, conocimiento) y la pregunta que los Upanishads no dejan de hacer"],
    ],
    years: [
      [["los Upanishads principales", "los Yoga Sutras", "el Ramayana de Valmiki, libro por libro"], "leer con atención un Upanishad completo, y el Ramayana tal como lo contó Valmiki"],
      [["el Mahabharata como serie", "la infancia de Krishna", "los poetas santos del bhakti", "los maestros modernos"], "seguir la larga discusión del Mahabharata sobre el deber, y conocer por su nombre a los poetas santos"],
      [["la Devi", "Shiva", "las seis escuelas de pensamiento", "los Vedas mismos"], "distinguir las seis escuelas, y saber qué lugar ocupan los Vedas en todo esto"],
      [["el devanagari", "los Puranas", "el hinduismo en el mundo", "los grandes dichos"], "leer en voz alta el devanagari, y tener los cuatro grandes dichos en tus propias palabras"],
    ],
    summit: {
      know: "las epopeyas, la Gita, los Upanishads principales, las seis escuelas",
      practice: "respiración, mantra, un rato diario en quietud, las fiestas a medida que llegan",
      able: "leer un verso y explicárselo a alguien, y convivir con las preguntas que la tradición todavía discute",
    },
  },
  CHRISTIANITY: {
    camps: [
      [["amén", "la gracia", "el Padre Nuestro", "el buen samaritano"], "rezar el Padre Nuestro y saber qué pide cada línea"],
      [["las parábolas", "la tormenta", "la multiplicación de los panes", "la última semana"], "contar la vida de Jesús de Belén a la Pascua, y unas cuantas parábolas de memoria"],
      [["formas de oración", "el año litúrgico", "el sábado como práctica", "la Escritura como hábito"], "mantener una breve oración diaria, y saber por qué el año de la iglesia avanza como avanza"],
      [["el Evangelio de Marcos"], "haber leído un evangelio completo: Marcos, de principio a fin"],
      [["el Sermón del Monte", "los místicos", "las denominaciones, sin jerarquías"], "explicar lo que pide el Sermón del Monte, y cómo lo leen las distintas iglesias"],
    ],
    summit: {
      know: "la vida de Jesús, las parábolas, un evangelio completo, el año litúrgico",
      practice: "una oración diaria, el descanso del sábado, la Escritura como hábito",
      able: "leer un pasaje y decir qué significaba entonces y qué saca de él la gente hoy",
    },
  },
  CATHOLIC: {
    camps: [
      [["la gracia", "la señal de la cruz", "la misa, escena por escena", "el rosario"], "seguir la misa de principio a fin y saber para qué es cada parte"],
      [["las historias de Jesús", "María", "los santos"], "contar las historias detrás de los santos y de María"],
      [["la misa", "el rosario", "los sacramentos", "el año litúrgico"], "rezar una decena del rosario, y saber qué marca cada uno de los siete sacramentos"],
      [["los Salmos", "un evangelio"], "rezar un Salmo, y saber por qué los Salmos se rezan desde hace miles de años"],
      [["san Juan de la Cruz", "Thomas Merton", "temas del catecismo"], "conocer la forma de orar de los místicos, y de dónde vienen los grandes temas del catecismo"],
    ],
    summit: {
      know: "la misa, los sacramentos, los santos, los Salmos",
      practice: "el rosario, el año de la Iglesia, una oración en silencio que sea tuya",
      able: "entrar a cualquier misa y saber qué está pasando, y por qué",
    },
  },
  JUDAISM: {
    camps: [
      [["shalom", "el Shema", "Shabbat", "tzedakah"], "decir el Shema y saber por qué está en el corazón de la oración diaria"],
      [["el Génesis como la serie original", "hacia el Éxodo"], "contar el Génesis como una saga familiar, de Abraham a José, y cómo empieza el Éxodo"],
      [["Shabbat como práctica", "bendiciones a lo largo del día", "las fiestas a medida que llegan", "el estudio como oración"], "encender las velas y decir las bendiciones, y saber qué recuerda cada fiesta"],
      [["la porción semanal de la Torá", "una parashá por semana"], "leer la porción de la Torá de la semana junto con judíos de todo el mundo"],
      [["Pirkei Avot", "una probadita del Talmud", "historias jasídicas", "los Salmos como oración"], "seguir un poco una discusión del Talmud, y llevar contigo un dicho de los sabios"],
    ],
    summit: {
      know: "el Génesis y el Éxodo, la porción semanal, las fiestas, los sabios",
      practice: "Shabbat, bendiciones a lo largo del día, el estudio como oración",
      able: "sentarte con un texto y discutir con él, como lo hacían los sabios",
    },
  },
  ISLAM: {
    camps: [
      [["salaam", "bismillah", "al-Fatiha", "los cinco pilares"], "conocer al-Fatiha línea por línea, y cuáles son los cinco pilares"],
      [["Ibrahim y los ídolos", "Yusuf completo", "Yunus en la ballena", "la primera revelación"], "contar las historias de los profetas, de Adán a la Hégira"],
      [["el salat, paso a paso", "dhikr", "du'a", "el Ramadán y los dos Eid"], "saber cómo se reza el salat y por qué, y qué le pide el Ramadán a la gente"],
      [["juz' 'amma", "las suras cortas", "primero el sonido del árabe, después el significado"], "conocer las suras cortas que aprende todo niño musulmán, por su sonido y por su significado"],
      [["los 99 nombres", "la seerah, continuación", "Rumi y el camino sufí", "la estructura del Corán"], "saber cómo está organizado el Corán, y algunos de los 99 nombres de memoria"],
    ],
    summit: {
      know: "las historias de los profetas, la seerah, las suras cortas, los 99 nombres",
      practice: "el salat, el dhikr, la du'a con tus propias palabras, el Ramadán cuando llega",
      able: "escuchar la recitación de una sura y saber qué dice",
    },
  },
  BUDDHISM: {
    camps: [
      [["metta", "la respiración", "las cuatro nobles verdades", "el camino medio"], "explicar con sencillez las cuatro nobles verdades, y desearle el bien a alguien a propósito"],
      [["el palacio", "los cuatro encuentros", "el árbol bodhi", "la semilla de mostaza de Kisa Gotami"], "contar la vida del Buda, del palacio al primer sermón"],
      [["metta completo", "meditación en la respiración", "meditación caminando", "los preceptos"], "sentarte cinco minutos, caminar despacio a propósito, y conocer los cinco preceptos"],
      [["el Dhammapada", "26 capítulos"], "haber leído el Dhammapada completo, y llevar contigo uno de sus versos"],
      [["el Sutra del Corazón", "los koans", "los caminos theravada y tibetano", "el Satipatthana Sutta"], "distinguir las grandes escuelas, y leer el Sutra del Corazón sabiendo lo que dice"],
    ],
    summit: {
      know: "la vida del Buda, las cuatro verdades, el Dhammapada, las escuelas",
      practice: "respiración, metta, meditación caminando, los preceptos",
      able: "sentarte con un sentimiento difícil y ver cómo cambia",
    },
  },
  SIKHISM: {
    camps: [
      [["seva", "Ik Onkar", "el Mool Mantar", "langar"], "conocer el Mool Mantar línea por línea, y los tres pilares de una vida sij"],
      [["los viajes de Nanak", "los diez Gurús", "Vaisakhi de 1699", "los sakhis"], "contar la historia de los diez Gurús, del Guru Nanak al Guru Gobind Singh"],
      [["la seva en la práctica", "kirtan", "simran con la respiración", "la visita al gurdwara"], "saber qué pasa en un gurdwara y por qué, y mantener el simran con la respiración"],
      [["Japji Sahib", "verso por verso", "primero el sonido del gurmukhi"], "haber recorrido todo el Japji Sahib, verso por verso"],
      [["los temas del Guru Granth Sahib", "Kabir y Farid en el Granth", "la historia sij", "la diáspora"], "conocer los grandes temas del Granth, y la historia, incluidas las partes difíciles"],
    ],
    summit: {
      know: "los diez Gurús, el Japji Sahib, los grandes temas del Granth, la historia sij",
      practice: "seva, simran, kirtan, un lugar en el langar",
      able: "entrar a un gurdwara en cualquier parte y sentirte en casa",
    },
  },
  SPIRITUAL: {
    camps: [
      [["respirar", "notar", "la regla de oro", "la gratitud"], "detenerte, respirar y notar, en cualquier lugar, en menos de un minuto"],
      [["Marco Aurelio, sin ganas de levantarse", "historias zen", "cuentos jasídicos", "Nasrudín"], "llevar contigo historias de muchas tradiciones, cada una contada con su fuente"],
      [["el repaso de la noche", "caminar", "el escaneo corporal", "un sábado digital"], "mantener una pequeña práctica diaria que sea tuya: un rato en quietud, una caminata, un repaso por la noche"],
      [["Rumi", "las Meditaciones de Marco Aurelio"], "haber leído a Rumi y a Marco Aurelio lado a lado, y llevar contigo una línea de cada uno"],
      [["una semana en cada una de las siete puertas", "los estoicos", "la ciencia"], "saber qué guarda cada una de las siete puertas, y qué dice la ciencia sobre la práctica"],
    ],
    summit: {
      know: "las mejores historias e ideas de cada puerta, cada una con su fuente",
      practice: "un rato diario en quietud, el repaso de la noche, bondad a propósito",
      able: "enfrentar un día difícil con algo firme, tomado de las personas más sabias que han existido",
    },
  },
};

export const YEAR_PROMISES_ES: Record<string, string[]> = {
  CHRISTIANITY: [
    "leer en orden los grandes libros de la Biblia, del Génesis a los Evangelios, y saber dónde está cada historia",
    "contar la larga historia de la iglesia, desde Israel y los primeros creyentes hasta los cristianos de todo el mundo hoy",
    "entender cómo oran los distintos cristianos, cómo deciden qué está bien y cómo enfrentan las preguntas más difíciles",
    "leer un Evangelio, los Hechos y las cartas en sus propias palabras, y vivir lo que encontraste",
  ],
  CATHOLIC: [
    "seguir la Biblia del Génesis al Apocalipsis, y escuchar las lecturas del año de la Iglesia",
    "contar la historia de la Iglesia, desde los Padres y los concilios hasta los santos de cada siglo",
    "orientarte en el Catecismo, santo Tomás de Aquino, las grandes órdenes y la doctrina social de la Iglesia",
    "leer por tu cuenta los clásicos espirituales, y practicar las obras de misericordia en una vida común y corriente",
  ],
  JUDAISM: [
    "conocer la Torá completa y recorrer el libro de oraciones, servicio por servicio, a lo largo del año judío",
    "contar la historia de un pueblo, desde los profetas y los escritos hasta la historia después de la Biblia",
    "entender cómo piensa y vive el judaísmo: el Talmud, Maimónides, el pensamiento jasídico, los movimientos y el ciclo de la vida",
    "leer las fuentes por tu cuenta (un tratado, Pirkei Avot, el midrash) y vivir una semana judía con sentido",
  ],
  ISLAM: [
    "recorrer el Corán sura por sura, y saber de qué trata cada parte",
    "contar la vida del Profeta ﷺ, su familia y sus compañeros, de La Meca a Medina",
    "entender a fondo los cinco pilares, cómo se evalúan los hadices y las escuelas de jurisprudencia, lado a lado",
    "llevar contigo los cuarenta hadices y los noventa y nueve nombres, y leer pasajes completos del Corán",
  ],
  BUDDHISM: [
    "conocer las cuatro nobles verdades y el óctuple sendero en palabras del propio Buda, discurso por discurso",
    "contar la vida del Buda, sus discípulos, y cómo la enseñanza viajó por Asia y por el mundo",
    "entender las escuelas, del Abhidhamma al zen, la Tierra Pura y el Tíbet, lado a lado y sin jerarquías",
    "leer las fuentes por tu cuenta, un poco de pali y a Shantideva, y mantener una práctica en la vida laica",
  ],
  SIKHISM: [
    "conocer las banis diarias, del Jaap Sahib al Kirtan Sohila, y el Ardas línea por línea",
    "contar la larga historia del Panth, desde los primeros narradores y los Bhagats hasta los sijs de hoy",
    "entender los ragas, las enseñanzas de los Gurús, la Khalsa y el Rehat Maryada",
    "leer el Guru Granth Sahib por tu cuenta, en orden, y vivirlo día a día",
  ],
  SPIRITUAL: [
    "leer completos a los estoicos (Epicteto, Séneca y Marco Aurelio) y usarlos en un día difícil",
    "llevar la sabiduría de cada tradición a las grandes preguntas: el sufrimiento, la muerte, el amor, el trabajo, el perdón y el asombro",
    "conocer a los pensadores y las escuelas, del Tao Te Ching y Montaigne a Thoreau y la ciencia de la práctica",
    "leer las fuentes por tu cuenta, caminar con los poetas y construir una práctica propia",
  ],
};

/** The trail's own words (eyebrows and fallbacks) that journeys.ts writes itself. */
export const TRAIL_ES = {
  campEyebrow: "campamento {n} · {len} días",
  yearEyebrow: "año {n} · 365 días",
  yearsPlanned: "años 2–5",
  ranges: "las cordilleras",
  summitEyebrow: "día {day} · la cima de la subida de cinco años",
  walkThrough: "recorrer {parts}",
  andMore: " · y más",
};
