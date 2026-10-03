// Spanish for the onboarding questions and the cross-tradition "bridges" (content/intake.ts). Import-free: intake.ts
// is loaded by the unit tests straight from Node. The English stays in content/intake.ts, untouched; these overlay it
// by question id and choice id (ids and stored values never change).
//
// DRAFT: like the English, NOT KEEPER-REVIEWED, and the Spanish is a first draft too. Every gloss must be checked by
// that tradition's Keeper (and a native speaker) before release (docs/CONTENT_RELEASE.md).

export type QuestionEs = { ask: string; note?: string; c: Record<string, string> };

/** The religions, as answers ("which one?"): nouns, so the Spanish needs no gendered adjective. */
const RAISED_ES: Record<string, string> = {
  CHRISTIANITY: "cristianismo", CATHOLIC: "catolicismo", JUDAISM: "judaísmo", ISLAM: "islam", HINDUISM: "hinduismo",
  BUDDHISM: "budismo", SIKHISM: "sijismo", mixed: "una mezcla", other: "otra", none: "sin religión",
};

/** Keyed "<area>.<question id>": you.* (first step), belief.* (a tradition door), intake.* ("my own path"). */
export const QUESTIONS_ES: Record<string, QuestionEs> = {
  "you.stance": {
    ask: "primero, un poco sobre ti. ¿cómo estás con la religión ahora mismo?",
    note: "es privado: se queda en tu teléfono. solo cambia lo que te mostramos primero. todas las puertas siguen abiertas.",
    c: {
      practice: "practico una fe",
      unsure: "crecí en una, pero ya no sé si creo",
      left: "crecí en una y la dejé",
      partner: "estoy aprendiendo la fe de mi pareja o de mi familia",
      curious: "sin religión, solo por curiosidad",
      many: "explorando más de una",
      spiritual: "espiritualidad sí, religión no",
    },
  },
  "you.heardFrom": {
    ask: "una cosa rápida: ¿cómo supiste de nosotros?",
    note: "un toque, o sáltala. solo nos ayuda a saber cómo llega la gente a la colina.",
    c: {
      tiktok: "TikTok",
      instagram: "Instagram",
      youtube: "YouTube",
      friend: "por amistades o familia",
      community: "una iglesia, templo, mezquita o grupo de la comunidad",
      school: "una escuela o grupo juvenil",
      celebrity: "una celebridad o figura pública",
      search: "una búsqueda o la tienda de apps",
      podcast: "un podcast o un artículo",
      other: "otra cosa",
    },
  },
  raised: { ask: "", c: RAISED_ES },
  "belief.why": {
    ask: "¿qué te trae al {door}?",
    note: "elige lo más cercano. define con qué empezamos.",
    c: {
      own: "quiero conocer mejor mi propia religión",
      roots: "reconectar con la forma en que crecí",
      god: "me pregunto si creo en Dios",
      partner: "es la fe de mi pareja o de mi familia",
      wedding: "nos vamos a casar, y nuestras familias rezan distinto",
      kids: "para enseñarles a mis hijos",
      baby: "acabamos de tener un bebé",
      calm: "un hábito diario más tranquilo",
      belonging: "quiero gente cerca que me entienda",
      forgiveness: "necesito perdonar a alguien, o que me perdonen",
      gratitude: "estoy agradecido y no sé a quién darle las gracias",
      grief: "murió alguien a quien quiero",
      diagnosis: "una noticia de salud que da miedo, mía o de alguien cercano",
      hard: "estoy pasando por algo difícil",
      curious: "solo curiosidad",
      sent: "mis papás me dijeron que viniera",
    },
  },
  "belief.raised": {
    ask: "¿creciste en el {door}?",
    c: {
      yes: "sí, desde la infancia",
      later: "llegué a él más tarde",
      exploring: "no, lo estoy explorando",
      family: "no, es de mi pareja o de mi familia",
    },
  },
  "belief.practice": {
    ask: "¿qué tanto forma parte de tu vida ahora?",
    c: {
      daily: "casi todos los días",
      weekly: "casi todas las semanas",
      holidays: "en las fiestas y los momentos importantes",
      rarely: "no mucho por ahora",
    },
  },
  "belief.hold": {
    ask: "¿cómo lo vives?",
    note: "no hay una respuesta correcta. esto solo cambia cómo te hablamos.",
    c: {
      fully: "lo creo, del todo",
      questions: "creo, con preguntas",
      culture: "es más cultura y familia",
      figuring: "lo estoy descubriendo",
    },
  },
  "belief.openness": {
    ask: "a veces otra tradición tiene una palabra para algo parecido. cuando eso pase, te gustaría…",
    note: "puedes cambiarlo cuando quieras en Tú.",
    c: {
      stay: "seguir en mi camino: solo el {door}",
      sometimes: "saber de eso de vez en cuando",
      love: "me encanta ese tipo de cosas",
    },
  },
  "belief.practiceMode": {
    ask: "¿quieres probar las prácticas, o solo aprender?",
    note: "cámbialo cuando quieras en Tú.",
    c: {
      practice: "probarlas: una respiración, una oración, algo pequeño que hacer",
      learn: "solo aprender: muéstrame cómo se hace, sin practicar",
    },
  },
  "intake.raised": {
    ask: "¿creciste en una religión?",
    note: "no hay respuestas incorrectas. no tienes que elegir una aquí, ni ahora ni nunca.",
    c: RAISED_ES,
  },
  "intake.feelNow": {
    ask: "¿y cómo te sientes con ella ahora?",
    c: { part: "sigue siendo parte de mí", complicated: "es complicado", left: "la dejé", never: "nunca me terminó de convencer" },
  },
  "intake.turnedOff": {
    ask: "¿qué te alejó, si es que algo lo hizo?",
    c: {
      rules: "las reglas", judged: "sentir que me juzgaban", hypocrisy: "la hipocresía",
      believe: "no me lo creía", rote: "se sentía mecánico", politics: "la política",
      hurt: "algo que pasó", none: "nada, la verdad",
    },
  },
  "intake.loved": {
    ask: "¿hubo algo que te encantara?",
    c: {
      music: "la música", ritual: "los rituales", community: "la gente",
      stories: "las historias", quiet: "el silencio, la oración", holidays: "las fiestas y la comida",
      nothing: "la verdad, no",
    },
  },
  "intake.grewUp": {
    ask: "en tu infancia, la religión era…",
    c: {
      absent: "algo que no estaba", others: "cosa de otras personas",
      curious: "algo que me daba curiosidad", avoided: "algo de lo que había que alejarse",
    },
  },
  "intake.believe": {
    ask: "¿en qué crees ahora mismo?",
    note: "es privado. solo cambia lo que te mostramos.",
    c: { bigger: "hay algo más grande", unsure: "no lo sé", meaning: "no hay dios, pero el sentido importa", searching: "estoy buscando" },
  },
  "intake.organized": {
    ask: "¿y la religión organizada?",
    c: { like: "me gusta", mixed: "tengo sentimientos encontrados", away: "prefiero mantenerme lejos" },
  },
  "intake.feeling": {
    ask: "¿qué te está pasando últimamente?",
    c: {
      sleep: "no puedo dormir", anxious: "ansiedad", grief: "estoy de duelo por alguien",
      sick: "alguien que quiero está enfermo", lonely: "soledad", focus: "no me puedo concentrar",
      grateful: "gratitud, la verdad", curious: "solo curiosidad",
    },
  },
  "intake.interests": {
    ask: "¿qué te suena bien?",
    c: {
      still: "respirar y la quietud", stories: "historias antiguas", words: "palabras sabias para llevar contigo",
      kindness: "la bondad, en la práctica", others: "cómo creen otras personas",
      common: "lo que todas las religiones comparten",
    },
  },
};

/** raisedInQ(): the follow-up question's wording (its choices are RAISED_ES). */
export const RAISED_IN_ES = {
  learningAsk: "qué bien. ¿qué fe estás aprendiendo?",
  learningNote: "la enseñaremos como la entienden quienes la practican. tu propia historia sigue siendo tuya.",
  practiceAsk: "qué bien. ¿cuál?",
  grewUpAsk: "¿en cuál creciste?",
  otherAsk: "¿creciste en una religión?",
  grewUpNote: "no hay respuestas incorrectas. nada aquí te pide volver.",
  noneLabel: "no, ninguna",
};

/** intakeReply(): the short replies after an answer. */
export const REPLIES_ES = {
  left: "y está bien. nada aquí te pide volver.",
  complicated: "como el de casi todo el mundo.",
  away: "entendible. aquí nadie te va a inscribir en nada.",
  meaning: "bien. aquí hay mucho que funciona sin necesidad de un dios.",
  none: "entonces llegas con ojos nuevos.",
  hurt: "lo siento. iremos con calma.",
  grief: "lo siento. empezaremos con algo que te sostenga.",
};

/** Bridges by id: the idea, why it might speak to someone, and each member's gloss in the same order as BRIDGES. */
export const BRIDGES_ES: Record<string, { idea: string; why: string; glosses: string[] }> = {
  greeting: {
    idea: "un saludo que también es una bendición",
    why: "una forma de recibir a la gente deseándole el bien",
    glosses: ["la luz en mí ve la luz en ti", "hola, adiós, paz… y plenitud", "la paz sea contigo"],
  },
  rest: {
    idea: "un día apartado para detenerse",
    why: "permiso para parar, incluido en la semana",
    glosses: ["desde la puesta del sol del viernes, la semana se detiene", "un día de descanso, santificado", "un día que no es tuyo para llenarlo", "la reunión de oración del viernes"],
  },
  name: {
    idea: "repetir una palabra sagrada hasta que te aquiete",
    why: "una sola palabra a la cual volver cuando tu mente no se calma",
    glosses: ["un nombre repetido, contado en cuentas", "recuerdo: repetir palabras que alaban a Dios", "recordar el Nombre, una y otra vez", "oraciones contadas en cuentas"],
  },
  service: {
    idea: "dar como práctica, no como sentimiento",
    why: "hacer algo por otra persona, sin hacer ruido, como parte de tu día",
    glosses: ["servicio desinteresado", "servicio ofrecido sin esperar nada a cambio", "dar como justicia, no solo como caridad", "una parte de lo que tienes, que se les debe a otros", "generosidad"],
  },
  compassion: {
    idea: "bondad deseada a propósito, incluso a desconocidos",
    why: "una práctica para cuando cuidar a otros duele o se agota",
    glosses: ["amor bondadoso, deseado hacia afuera", "compasión ante el sufrimiento", "bondad que no te ganaste", "el amor como algo que se hace"],
  },
  return: {
    idea: "puedes dar la vuelta y empezar de nuevo",
    why: "un camino de regreso después de equivocarte",
    glosses: ["regresar: reparar y volver a empezar", "decirlo en voz alta, y ser perdonado", "el hijo que vuelve a casa y es bien recibido"],
  },
  oneness: {
    idea: "lo uno, debajo de todo",
    why: "una idea antigua sobre cómo encaja todo",
    glosses: ["hay uno", "la unicidad de Dios", "escucha: el Señor es uno", "la única realidad detrás de todas las cosas"],
  },
  sound: {
    idea: "un sonido que abre el silencio",
    why: "algo que escuchar y que te trae de vuelta al ahora",
    glosses: ["el primer sonido", "una campana que te llama de vuelta al presente", "un sonido, y luego silencio"],
  },
  blessing: {
    idea: "empezar algo diciendo por qué importa",
    why: "una pequeña pausa antes de las cosas de todos los días",
    glosses: ["en el nombre de Dios: antes de comer, de un viaje, de una primera línea", "una bendición que se dice antes y después", "cabeza, corazón, hombros: todo tu ser"],
  },
  gratitude: {
    idea: "gracias, dichas en voz alta",
    why: "notar lo que ya está bien",
    glosses: ["toda alabanza es de Dios: gracias, en las buenas y en las malas", "gracias, de todos modos"],
  },
  community: {
    idea: "reunirse para practicar en compañía",
    why: "compañía para la parte que cuesta hacer a solas",
    glosses: ["la comunidad reunida", "la comunidad que camina unida", "reunirse en la verdad", "diez personas, para que la oración pueda empezar", "una cocina gratuita: todos comen, lado a lado"],
  },
  patience: {
    idea: "mantenerse firme cuando las cosas son difíciles",
    why: "algo a qué aferrarte cuando no puedes arreglarlo",
    glosses: ["paciencia que resiste", "el ánimo en alto, incluso en la dificultad", "una mente que se mantiene serena"],
  },
  stillness: {
    idea: "sentarse en silencio a propósito",
    why: "unos minutos de calma que no te piden nada",
    glosses: ["atención plena: notar lo que está aquí", "en el silencio está él", "atención quieta y vigilante", "estar a solas para hablar libremente con Dios", "unos minutos de nada"],
  },
  stories: {
    idea: "historias antiguas sobre volver a empezar",
    why: "historias que la gente cuenta desde hace miles de años porque siguen funcionando",
    glosses: ["el hijo que vuelve a casa", "el hermano vendido, que perdona", "las vidas pasadas del Buda, contadas como historias", "historias de los Gurús"],
  },
  golden: {
    idea: "trata a los demás como quisieras que te trataran",
    why: "la regla a la que casi todas las tradiciones llegaron por su cuenta",
    glosses: ["sé bueno con los demás como contigo", "el desconocido que se detuvo a ayudar", "no hacer daño"],
  },
};
