// Strings for the ways in that keep the homepage's promise (lib/lane.ts): the mascot's first warm line for each
// reason someone came, the gentle lane's first week, the Guide offered after a gentle lesson, the deferred check-in's
// intro, and the placement check offered later. Keys are prefixed "gentle." so areas never collide.
// The mascot's voice (docs/brand/MASCOT_VOICE.md): warm first, lowercase, "i" for him, "we" only for the company.
// No emoji in grief, health or hard moments; exclamation points only for real joy.
import type { Dict } from "../core";

export const en = {
  // the first line he says, above the first question (welcome/you), by the reason they came
  "gentle.hello.grief": "i'm so sorry. let's take this slowly, together.",
  "gentle.hello.diagnosis": "i'm so sorry. let's take this slowly, together.",
  "gentle.hello.hard": "i'm really glad you came. let's keep this small and quiet, just a few minutes for you.",
  "gentle.hello.forgiveness": "that takes courage. let's go gently, at your pace.",
  "gentle.hello.baby": "congratulations! i'll keep this short. one hand is plenty.",
  "gentle.hello.wedding": "congratulations! two families, one table. let's start with yours.",
  "gentle.hello.belonging": "everyone needs their people. i'm so glad you're here.",
  "gentle.hello.gratitude": "what a lovely thing to feel. let's find the words for it.",
  "gentle.hello.sent": "fair. but i'm really glad you're here 🙂 two taps and you're in.",
  "gentle.hello.partner": "that's so kind of you to want to understand them.",
  "gentle.hello.curious": "love that. eight doors, each told by its own people.",
  "gentle.hello.own": "imagine finally hearing what they mean. let's start.",
  "gentle.hello.roots": "welcome home. no guilt, no lecture.",
  "gentle.hello.god": "that's an honest place to be. you're welcome here exactly as you are.",
  "gentle.hello.kids": "what a gift to give them.",
  "gentle.hello.calm": "a calmer day, five minutes at a time.",
  "gentle.hello.spiritual": "you're in the right place. a few easy questions, then your own path.",
  // "ready", on a week-first lane: what opens first
  "gentle.ready.first": "first: {title}",
  "gentle.ready.light": "five minutes, one lesson.\nyour week starts now.",
  // after a first-week lesson (/done/week)
  "gentle.after.title": "you came",
  "gentle.after.gentle": "you came. that's enough.",
  "gentle.after.light": "that's one. look at you.",
  "gentle.after.guide": "want to talk about it? i'm here.",
  "gentle.after.talk": "talk with me",
  "gentle.after.notNow": "not now",
  "gentle.after.next": "next, whenever you're ready: {title}",
  "gentle.after.weekDone": "that's your first week. next, the path begins at day one, whenever you're ready.",
  "gentle.after.home": "back to today",
  // Today, while the first week leads
  "gentle.today.week": "your first week · {n} of {of}",
  "gentle.today.place": "know the basics already? find your place",
  "gentle.today.placeA11y": "take the short check to find where to start",
  // the deferred check-in, on the third day
  "gentle.wellbeing.intro": "can i ask how you've been? five quick questions about the last two weeks, so you can see your own change later. skip anytime, no hard feelings.",
};

export const es: Dict<typeof en> = {
  "gentle.hello.grief": "lo siento mucho. vamos despacio, juntos.",
  "gentle.hello.diagnosis": "lo siento mucho. vamos despacio, juntos.",
  "gentle.hello.hard": "me alegra mucho que vinieras. hagamos esto pequeño y tranquilo, unos minutos solo para ti.",
  "gentle.hello.forgiveness": "eso requiere valor. vamos con calma, a tu ritmo.",
  "gentle.hello.baby": "¡felicidades! lo haré corto. con una mano basta.",
  "gentle.hello.wedding": "¡felicidades! dos familias, una mesa. empecemos por la tuya.",
  "gentle.hello.belonging": "todos necesitamos a nuestra gente. me alegra mucho que estés aquí.",
  "gentle.hello.gratitude": "qué bonito sentir eso. busquemos las palabras para decirlo.",
  "gentle.hello.sent": "vale. pero me alegra mucho que estés aquí 🙂 dos toques y listo.",
  "gentle.hello.partner": "qué lindo que quieras entenderlos.",
  "gentle.hello.curious": "me encanta. ocho puertas, cada una contada por su propia gente.",
  "gentle.hello.own": "imagina por fin escuchar lo que significan. empecemos.",
  "gentle.hello.roots": "bienvenido a casa. sin culpa, sin sermones.",
  "gentle.hello.god": "es un lugar honesto. aquí eres bienvenido tal como eres.",
  "gentle.hello.kids": "qué regalo para ellos.",
  "gentle.hello.calm": "un día más tranquilo, cinco minutos a la vez.",
  "gentle.hello.spiritual": "estás en el lugar indicado. unas preguntas fáciles y luego tu propio camino.",
  "gentle.ready.first": "primero: {title}",
  "gentle.ready.light": "cinco minutos, una lección.\ntu semana empieza ahora.",
  "gentle.after.title": "viniste",
  "gentle.after.gentle": "viniste. con eso basta.",
  "gentle.after.light": "ya va una. mírate.",
  "gentle.after.guide": "¿quieres hablar de ello? aquí estoy.",
  "gentle.after.talk": "habla conmigo",
  "gentle.after.notNow": "ahora no",
  "gentle.after.next": "después, cuando quieras: {title}",
  "gentle.after.weekDone": "esa fue tu primera semana. después, el camino empieza en el día uno, cuando quieras.",
  "gentle.after.home": "volver a hoy",
  "gentle.today.week": "tu primera semana · {n} de {of}",
  "gentle.today.place": "¿ya sabes lo básico? encuentra tu lugar",
  "gentle.today.placeA11y": "haz la prueba corta para saber dónde empezar",
  "gentle.wellbeing.intro": "¿puedo preguntarte cómo has estado? cinco preguntas rápidas sobre las últimas dos semanas, para que luego veas tu propio cambio. puedes saltarlo cuando quieras, sin problema.",
};
