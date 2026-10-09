// Courses: seven days on one life need (worry, grief, anger…), for seekers who don't want to pick a religion. Every day
// is a lesson ALREADY WRITTEN in years 1–3 of one door, a different door each day, labeled with its tradition. Nothing
// here is new religious content: only the course names, the question each one answers, the mascot's line, and a
// one-line setup where a lesson starts mid-story (the lesson's own "yesterday" look back is dropped in a course).
// Picked 2026-10-08 (every pick read in full; owner approved the list). A course day is a sit tagged with the course:
// it counts for the streak, and never moves that door's path (packages/domain/src/sits.js).
//
// KEEPER REVIEW REQUIRED: this selection is ours, not a Keeper's. Before public release, each door's Keeper should
// confirm the day chosen for their tradition, as with the sampler week (content/sampler.ts).
import { getLang } from "@/i18n/core";
import { doorLabel, t } from "@/i18n";

/** Where a course day comes from, in a sentence: the tradition, or "many traditions" for a day from my own religion. */
export const fromLabel = (door: string) => (door === "SPIRITUAL" ? t("courses.many") : doorLabel(door).toLowerCase());

type Text = { en: string; es: string };
export type CourseDay = { door: string; day: number; setup?: Text };
export type Course = { id: string; title: Text; ask: Text; line: Text; days: CourseDay[] };

const d = (door: string, day: number, en?: string, es?: string): CourseDay => (en ? { door, day, setup: { en, es: es || en } } : { door, day });

export const COURSES: readonly Course[] = Object.freeze([
  {
    id: "worry", title: { en: "worry and fear", es: "preocupación y miedo" }, ask: { en: "how do i stop overthinking?", es: "¿cómo dejo de darle tantas vueltas?" },
    line: { en: "worry is heavy. let's set it down together, a little.", es: "la preocupación pesa. vamos a soltarla un poco, juntos." },
    days: [
      d("CHRISTIANITY", 253), d("ISLAM", 43), d("SIKHISM", 414),
      d("JUDAISM", 302, "the baal shem tov began hasidism, a joyful jewish movement. today's teacher, rebbe nachman, was his great-grandson.",
        "el baal shem tov fundó el jasidismo, un movimiento judío alegre. el maestro de hoy, rebe najman, era su bisnieto."),
      d("HINDUISM", 282, "advaita is a hindu way of seeing that says everything is one. its teachers love one picture: a rope mistaken for a snake.",
        "advaita es una mirada hindú que dice que todo es uno. a sus maestros les encanta una imagen: una cuerda confundida con una serpiente."),
      d("SPIRITUAL", 438), d("BUDDHISM", 406),
    ],
  },
  {
    id: "grief", title: { en: "when someone dies", es: "cuando alguien muere" }, ask: { en: "how do i carry missing someone?", es: "¿cómo llevo el extrañar a alguien?" },
    line: { en: "when you miss someone, i'll sit with you a while.", es: "cuando extrañas a alguien, me siento contigo un rato." },
    days: [
      d("JUDAISM", 182, "in jewish tradition, a family mourns at home for seven days, called shiva. this lesson starts with abraham grieving his wife sarah.",
        "en la tradición judía, la familia guarda luto en casa siete días; se llama shivá. esta lección empieza con abraham llorando a su esposa sara."),
      d("CHRISTIANITY", 234),
      d("HINDUISM", 43, "a little context first: prince rama has just been sent into forest exile, and his old father, king dasharatha, is left behind at home.",
        "un poco de contexto: el príncipe rama acaba de ser desterrado al bosque, y su anciano padre, el rey dasharatha, se queda en casa."),
      d("SIKHISM", 674), d("ISLAM", 686), d("SPIRITUAL", 679), d("BUDDHISM", 603),
    ],
  },
  {
    id: "anger", title: { en: "anger", es: "el enojo" }, ask: { en: "how do i not snap?", es: "¿cómo hago para no estallar?" },
    line: { en: "anger visits everyone. i'll help you keep the keys.", es: "el enojo nos visita a todos. te ayudo a no soltar las llaves." },
    days: [d("JUDAISM", 266), d("ISLAM", 250), d("BUDDHISM", 201), d("CHRISTIANITY", 452), d("SPIRITUAL", 680), d("HINDUISM", 166), d("CATHOLIC", 189)],
  },
  {
    id: "forgiveness", title: { en: "forgiveness", es: "el perdón" }, ask: { en: "how do i let it go, or say sorry?", es: "¿cómo lo suelto, o cómo pido perdón?" },
    line: { en: "letting go and saying sorry both take courage. i'm here.", es: "soltar y pedir perdón piden valor. aquí estoy." },
    days: [
      d("CHRISTIANITY", 31, "one thing to know first: in jesus's day a talent was a huge weight of silver, more than a worker could earn in years.",
        "algo que saber primero: en tiempos de jesús, un talento era un peso enorme de plata, más de lo que un trabajador ganaba en años."),
      d("SIKHISM", 634), d("BUDDHISM", 666),
      d("ISLAM", 496, "first, some context: a cruel rumor was spread about aisha, the prophet's wife, and verses of the qur'an cleared her name.",
        "primero, contexto: se difundió un rumor cruel sobre aisha, la esposa del profeta, y unos versos del corán limpiaron su nombre."),
      d("JUDAISM", 408), d("CATHOLIC", 925), d("SPIRITUAL", 965),
    ],
  },
  {
    id: "purpose", title: { en: "finding your purpose", es: "encontrar tu propósito" }, ask: { en: "what am i actually for?", es: "¿para qué estoy aquí, de verdad?" },
    line: { en: "you have something only you can give. let's find it.", es: "tienes algo que solo tú puedes dar. vamos a encontrarlo." },
    days: [
      d("JUDAISM", 298), d("CHRISTIANITY", 29), d("SIKHISM", 12), d("BUDDHISM", 381), d("SPIRITUAL", 891), d("ISLAM", 637),
      d("HINDUISM", 164, "arjuna, a great archer, freezes before a battle. his charioteer, krishna, begins to teach him, and that teaching is the gita.",
        "arjuna, un gran arquero, se paraliza antes de una batalla. su auriga, krishna, empieza a enseñarle, y esa enseñanza es la gita."),
    ],
  },
  {
    id: "hard", title: { en: "when life is hard", es: "cuando la vida pesa" }, ask: { en: "how do i get through this?", es: "¿cómo salgo de esta?" },
    line: { en: "this is hard, and you're not alone in it. i'm here.", es: "esto es difícil, y no estás solo en esto. aquí estoy." },
    days: [
      d("CHRISTIANITY", 418),
      d("ISLAM", 185, "this comes from a short surah where god reminds the prophet, in a hard season, of burdens already lifted from him.",
        "viene de una sura corta en la que dios le recuerda al profeta, en un tiempo difícil, las cargas que ya le quitó."),
      d("SIKHISM", 17), d("HINDUISM", 30), d("SPIRITUAL", 342),
      d("BUDDHISM", 334, "the buddha's first talk began with a middle way, between harsh self-denial and chasing pleasure. then came the first truth.",
        "la primera charla del buda empezó con un camino medio, entre la dureza consigo mismo y la búsqueda de placer. luego vino la primera verdad."),
      d("JUDAISM", 842, "job is a good man in the bible who loses nearly everything. his friends come to sit with him, then start explaining.",
        "job es un hombre bueno de la biblia que lo pierde casi todo. sus amigos vienen a acompañarlo, y luego empiezan a explicarle."),
    ],
  },
  {
    id: "quiet", title: { en: "quiet", es: "silencio" }, ask: { en: "how do i slow my mind down?", es: "¿cómo calmo mi mente?" },
    line: { en: "you don't have to do anything right now. breathe with me.", es: "no tienes que hacer nada ahora. respira conmigo." },
    days: [
      d("CATHOLIC", 208), d("JUDAISM", 106),
      d("ISLAM", 220, "an-naba', meaning the news, is a short chapter of the qur'an about a day to come. then it points to everyday signs, like sleep.",
        "an-naba', que significa la noticia, es un capítulo corto del corán sobre un día por venir. luego señala signos cotidianos, como el sueño."),
      d("BUDDHISM", 108),
      d("HINDUISM", 441, "patanjali's yoga sutras offer several doors to a calm mind, each starting with the word or. this one is the breath.",
        "los yoga sutras de patanjali ofrecen varias puertas a una mente en calma, cada una empieza con la palabra o. esta es la respiración."),
      d("CHRISTIANITY", 145), d("SPIRITUAL", 12),
    ],
  },
  {
    id: "ego", title: { en: "letting go of ego", es: "soltar el ego" }, ask: { en: "why am i always comparing?", es: "¿por qué siempre me comparo?" },
    line: { en: "you don't have to be the biggest. you're enough already.", es: "no tienes que ganarle a nadie. ya eres suficiente." },
    days: [
      d("SPIRITUAL", 338), d("ISLAM", 24), d("JUDAISM", 380),
      d("HINDUISM", 205, "you'll hear the word ahimsa today. it means not harming: gentleness toward every living thing.",
        "hoy oirás la palabra ahimsa. significa no dañar: ternura con todo ser vivo."),
      d("SIKHISM", 236, "haumai is the sikh word for ego. the japji, guru nanak's morning prayer, is where it first shows up.",
        "haumai es la palabra sij para el ego. aparece por primera vez en el japji, la oración de la mañana de guru nanak."),
      d("CHRISTIANITY", 454, "ecclesiastes is a short, honest book in the bible that comes right after proverbs. its voice has seen everything and is a bit tired.",
        "eclesiastés es un libro corto y honesto de la biblia, justo después de proverbios. su voz lo ha visto todo y está un poco cansada."),
      d("BUDDHISM", 14, "the buddha named three marks of life: things change, nothing fully satisfies, and there's no fixed self. today is the third.",
        "el buda nombró tres marcas de la vida: todo cambia, nada satisface del todo, y no hay un yo fijo. hoy toca la tercera."),
    ],
  },
  {
    id: "love", title: { en: "love, family and friends", es: "amor, familia y amigos" }, ask: { en: "how do i show up for my people?", es: "¿cómo estoy presente para los míos?" },
    line: { en: "the people we love are the whole point. let's tend them.", es: "la gente que queremos es lo que importa. vamos a cuidarla." },
    days: [
      d("SIKHISM", 23), d("BUDDHISM", 569), d("CHRISTIANITY", 717),
      d("JUDAISM", 212, "joseph was sold by his brothers long ago. now he rules in egypt, they don't recognize him, and he's about to tell them.",
        "hace mucho, josé fue vendido por sus hermanos. ahora gobierna en egipto, ellos no lo reconocen, y está a punto de decírselo."),
      d("HINDUISM", 390, "in an old upanishad, a teacher gives his graduating students a parting charge. today i'm sharing the part about who to honor.",
        "en una antigua upanishad, un maestro despide a sus alumnos con un encargo. hoy te comparto la parte sobre a quién honrar."),
      d("ISLAM", 683), d("SPIRITUAL", 862),
    ],
  },
  {
    id: "gratitude", title: { en: "gratitude", es: "gratitud" }, ask: { en: "how do i notice the good?", es: "¿cómo me fijo en lo bueno?" },
    line: { en: "let's notice the good things, even on a hard day.", es: "vamos a notar lo bueno, incluso en un día difícil." },
    days: [
      d("JUDAISM", 109), d("ISLAM", 11),
      d("HINDUISM", 12, "uddalaka, who comes up today, is a father in the old upanishads who taught his son with a simple cup of salt water.",
        "uddalaka, que aparece hoy, es un padre de las antiguas upanishads que enseñó a su hijo con un simple vaso de agua con sal."),
      d("BUDDHISM", 595, "the mangala sutta is a short poem where the buddha lists life's highest blessings. today's verses come near the end.",
        "el mangala sutta es un poema corto donde el buda enumera las mayores bendiciones de la vida. los versos de hoy están cerca del final."),
      d("CHRISTIANITY", 563), d("SIKHISM", 642), d("SPIRITUAL", 120),
    ],
  },
  {
    id: "kindness", title: { en: "kindness and giving", es: "bondad y generosidad" }, ask: { en: "how do i be a little kinder?", es: "¿cómo soy un poco más amable?" },
    line: { en: "small kindnesses count. let's do one together today.", es: "las pequeñas bondades cuentan. hagamos una juntos hoy." },
    days: [
      d("ISLAM", 149), d("HINDUISM", 15), d("JUDAISM", 16), d("CATHOLIC", 45),
      d("SIKHISM", 97, "seva means selfless service, and it sits at the heart of sikh life. this lesson is about doing it where no one sees.",
        "seva significa servicio desinteresado, y está en el corazón de la vida sij. esta lección trata de hacerlo donde nadie ve."),
      d("BUDDHISM", 137), d("JUDAISM", 217),
    ],
  },
]);

/** A short, friendly name for each course day (the lesson's own title can be long: verse references, series counts). */
const NAMES: Record<string, [en: string, es: string]> = {
  "CHRISTIANITY:253": ["look at the birds", "mira las aves"], "ISLAM:43": ["a basket on the river", "una cesta en el río"],
  "SIKHISM:414": ["why worry, mind?", "¿por qué te preocupas, mente?"], "JUDAISM:302": ["a very narrow bridge", "un puente muy angosto"],
  "HINDUISM:282": ["the rope and the snake", "la cuerda y la serpiente"], "SPIRITUAL:438": ["hope and fear march together", "esperanza y miedo van juntos"],
  "BUDDHISM:406": ["fear in the night forest", "miedo en el bosque de noche"],
  "JUDAISM:182": ["to mourn and to weep", "hacer duelo y llorar"], "CHRISTIANITY:234": ["those who mourn", "los que lloran"],
  "HINDUISM:43": ["the king dies", "muere el rey"], "SIKHISM:674": ["songs of mourning", "cantos de duelo"],
  "ISLAM:686": ["death as return", "la muerte como regreso"], "SPIRITUAL:679": ["a stoic in grief", "un estoico en duelo"],
  "BUDDHISM:603": ["the dart of grief", "el dardo del duelo"],
  "JUDAISM:266": ["who is strong?", "¿quién es fuerte?"], "ISLAM:250": ["the forbearing", "el paciente"],
  "BUDDHISM:201": ["hold the chariot", "sujeta el carro"], "CHRISTIANITY:452": ["a soft answer", "una respuesta suave"],
  "SPIRITUAL:680": ["a stoic in anger", "un estoico enojado"], "HINDUISM:166": ["from wanting to anger", "del deseo al enojo"],
  "CATHOLIC:189": ["by the rivers of babylon", "junto a los ríos de babilonia"],
  "CHRISTIANITY:31": ["the unforgiving servant", "el siervo que no perdonó"], "SIKHISM:634": ["forgive our mistakes", "perdona nuestros errores"],
  "BUDDHISM:666": ["removing grudges", "soltar el rencor"], "ISLAM:496": ["don't you want to be forgiven?", "¿no quieres ser perdonado?"],
  "JUDAISM:408": ["ask the person first", "pídeselo primero a la persona"], "CATHOLIC:925": ["forgiving the gunman", "perdonar al que disparó"],
  "SPIRITUAL:965": ["the forgiveness chant", "el canto del perdón"],
  "JUDAISM:298": ["why weren't you zusya?", "¿por qué no fuiste zusya?"], "CHRISTIANITY:29": ["the talents", "los talentos"],
  "SIKHISM:12": ["honest work", "trabajo honrado"], "BUDDHISM:381": ["work as practice", "el trabajo como práctica"],
  "SPIRITUAL:891": ["every job a calling", "todo trabajo, una vocación"], "ISLAM:637": ["the best in deed", "lo mejor en obras"],
  "HINDUISM:164": ["act, and let go of results", "actúa y suelta el resultado"],
  "CHRISTIANITY:418": ["joy in the morning", "alegría en la mañana"], "ISLAM:185": ["with hardship, ease", "con la dificultad, alivio"],
  "SIKHISM:17": ["spirits rising", "el ánimo en alto"], "HINDUISM:30": ["the forgotten strength", "la fuerza olvidada"],
  "SPIRITUAL:342": ["what do i have for this?", "¿qué tengo para esto?"], "BUDDHISM:334": ["pain comes to everyone", "el dolor nos llega a todos"],
  "JUDAISM:842": ["don't explain their pain", "no le expliques su dolor"],
  "CATHOLIC:208": ["come away and rest", "vengan a descansar"], "JUDAISM:106": ["a sabbath afternoon", "una tarde de shabat"],
  "ISLAM:220": ["sleep as rest", "el sueño como descanso"], "BUDDHISM:108": ["long breath, short breath", "respiración larga, corta"],
  "HINDUISM:441": ["the long out-breath", "la exhalación larga"], "CHRISTIANITY:145": ["be still", "quédate quieto"],
  "SPIRITUAL:12": ["the quiet the mystics share", "el silencio de los místicos"],
  "SPIRITUAL:338": ["the horse is handsome, not you", "el caballo es hermoso, no tú"], "ISLAM:24": ["the one who would not bow", "el que no quiso inclinarse"],
  "JUDAISM:380": ["the small letter", "la letra pequeña"], "HINDUISM:205": ["knowledge starts with humility", "el saber empieza con humildad"],
  "SIKHISM:236": ["haumai, the i-me sickness", "haumai, el mal del yo"], "CHRISTIANITY:454": ["everything is breath", "todo es soplo"],
  "BUDDHISM:14": ["not-self", "el no-yo"],
  "SIKHISM:23": ["the sister who saw first", "la hermana que vio primero"], "BUDDHISM:569": ["the true friend", "el amigo verdadero"],
  "CHRISTIANITY:717": ["jonathan and david", "jonatán y david"], "JUDAISM:212": ["does my father live?", "¿vive mi padre?"],
  "HINDUISM:390": ["honor your parents and guests", "honra a tus padres y huéspedes"], "ISLAM:683": ["parents and family", "padres y familia"],
  "SPIRITUAL:862": ["parents as they are", "los padres tal como son"],
  "JUDAISM:109": ["thank you, first thing", "gracias, lo primero"], "ISLAM:11": ["thank you as a reflex", "gracias como reflejo"],
  "HINDUISM:12": ["who turned a light on", "quien encendió una luz"], "BUDDHISM:595": ["blessings of the heart", "bendiciones del corazón"],
  "CHRISTIANITY:563": ["one came back", "uno volvió"], "SIKHISM:642": ["a prayer in joy", "una oración en la alegría"],
  "SPIRITUAL:120": ["thanks without a forced smile", "gratitud sin sonrisa forzada"],
  "ISLAM:149": ["a smile is charity", "una sonrisa es caridad"], "HINDUISM:15": ["hanuman helps quietly", "hanuman ayuda en silencio"],
  "JUDAISM:16": ["giving is justice", "dar es justicia"], "CATHOLIC:45": ["the good samaritan", "el buen samaritano"],
  "SIKHISM:97": ["service with no audience", "servir sin público"], "BUDDHISM:137": ["a gift with no receipt", "un regalo sin recibo"],
  "JUDAISM:217": ["kindness that can't be repaid", "la bondad que no se paga"],
};
export const dayName = (door: string, day: number) => { const n = NAMES[`${door}:${day}`]; return n ? (getLang() === "es" ? n[1] : n[0]) : ""; };

/** The words in the app's language. */
export const say = (x: Text | undefined) => (x ? (getLang() === "es" ? x.es : x.en) : "");
export const courseById = (id: string | null | undefined) => COURSES.find((c) => c.id === id) ?? null;

/** Where someone is with a course: which one, and the day they started it. Kept with the settings. */
export type CourseState = { id: string; on: string } | null | undefined;

type SitLike = { door: string; day: number; kidId?: string | null; course?: string };

/** Each day of a course with where it stands: done (a sit of this course on that lesson), and open (every day before
 *  it done; no waiting a day, as many as they like). */
export function courseDays(c: Course, sits: readonly SitLike[]) {
  const done = (x: CourseDay) => sits.some((s) => !s.kidId && s.course === c.id && s.door === x.door && s.day === x.day);
  let open = true;
  return c.days.map((x, i) => {
    const row = { n: i + 1, door: x.door, day: x.day, setup: x.setup, done: done(x), open };
    if (!row.done) open = false;
    return row;
  });
}

/** The next day to take, or null when the course is finished. */
export const courseNext = (c: Course, sits: readonly SitLike[]) => courseDays(c, sits).find((x) => !x.done) ?? null;

/** May this lesson open as a day of this course? Only an open day of the course someone is on. */
export function courseOpens(s: CourseState, sits: readonly SitLike[], id: string | undefined, door: string, day: number): boolean {
  if (!s || !id || s.id !== id) return false;
  const c = courseById(id);
  return !!c && courseDays(c, sits).some((x) => x.open && x.door === door && x.day === day);
}

/** A course's day 1 to n, for one door's day: which day of the course it is (1-based), or 0. */
export function courseDayOf(id: string | null | undefined, door: string, day: number): number {
  const c = courseById(id);
  return c ? c.days.findIndex((x) => x.door === door && x.day === day) + 1 : 0;
}
