// Guided trips (2026-10-29): one entry per place that has a walkable 3D world (art/trip/worlds/<world>-150k.spz
// and -full.spz, made in Marble from our painting art/trip/<world>.webp). trip.html?w=<key> plays one.
// Every line here is the mascot's voice: lowercase, warm, "i". Facts need a scholar's read before anything ships.
window.IH_TRIPS = {
  galilee: {
    world: "galilee",
    guide: { name: "Denzel Washington", photo: "art/guides/christianity.webp", door: "Christianity" },
    askLine: "before today's class, can i ask you something? what's been on your mind lately?",
    ask: [
      { t: "someone i need to forgive", r: "then i know exactly where to take you. there's a lake where a lot of second chances started." },
      { t: "starting over", r: "then come with me. there's a lake where some fishermen dropped everything and started over." },
      { t: "feeling far from home", r: "i know a story about that. come with me, i'll show you where it was told." },
      { t: "just curious", r: "good. curious is the best way to travel. come with me." }
    ],
    dest: { name: "Sea of Galilee", lat: 32.83, lon: 35.59 },
    soon: [{ name: "Rishikesh", lat: 30.09, lon: 78.27 }, { name: "Vatican City", lat: 41.90, lon: 12.45 }],
    region: "northern Israel",
    flyName: "the Sea of Galilee",
    where: "Sea of Galilee · northern Israel",
    painting: "art/trip/galilee.webp",
    alt: "The Sea of Galilee at sunrise: fishing boats near a stone village, nets drying on black rocks, olive trees on the hillside",
    teach: [
      "you made it. this is the sea of galilee. it's really a lake, about 13 miles long, and those hills on the far side look the same today.",
      "jesus grew up in nazareth, in the hills not far from here. as a grown man he made his home in capernaum, a fishing town right on this shore.",
      "his first friends fished this water: peter and andrew, james and john. he told them, \"follow me,\" and they left their nets.",
      "he taught out in the open, to whoever showed up. once the crowd was so big he spoke from a boat like that one.",
      "later, on the road to jerusalem, people complained that he ate with the wrong crowd. so he told them a story about a son who came home. want to see it?"
    ],
    film: "lost-son-film.html",
    keep: { what: "The father's ring", sub: "He put it on his son's hand before the son could finish his speech." },
    keepLine: "you stood where he taught, and you heard one of his best stories. tomorrow i'll take you somewhere new.",
    real: "later: plan a real trip to galilee with people from your circle."
  },
  rishikesh: {
    world: "rishikesh",
    guide: { name: "Priyanka Chopra", photo: "art/guides/hinduism.webp", door: "Hinduism" },
    askLine: "before today's class, can i ask you something? what's been on your mind lately?",
    ask: [
      { t: "something i keep failing at", r: "then i know where to take you. there's a river that only came down because someone refused to quit." },
      { t: "i need some peace", r: "come with me. there's a place where the mountains meet a river, and people have come to sit beside it for thousands of years." },
      { t: "feeling far from my roots", r: "then let's go see a river your grandparents probably called mother. come with me." },
      { t: "just curious", r: "good. curious is the best way to travel. come with me." }
    ],
    dest: { name: "Rishikesh", lat: 30.1033, lon: 78.2948 },
    soon: [{ name: "Varanasi", lat: 25.3109, lon: 83.0107 }, { name: "Sea of Galilee", lat: 32.83, lon: 35.59 }],
    region: "the foothills of the Himalaya",
    flyName: "Rishikesh, on the Ganga",
    where: "Rishikesh · Uttarakhand, India",
    painting: "art/trip/rishikesh.webp",
    alt: "The Ganga at Rishikesh at sunrise: stone ghat steps with brass bells and marigolds, floating lamps, a suspension bridge and temples under misty green hills",
    teach: [
      "you made it. this is rishikesh. right here the ganga comes out of the himalaya, still cold and green from the mountains.",
      "for thousands of years, people who wanted to go quiet came to these hills to meditate. they still come, from all over the world.",
      "people here don't just call her a river. they call her ganga ma, mother ganga. those little leaf boats with lamps are thank-you notes.",
      "that bridge is named for lakshman, rama's brother. people say he crossed the river right here, on a rope.",
      "but here's the real question: how did a river from heaven end up here? because one king would not give up. want to see it?"
    ],
    film: "ganga-film.html",
    keep: { what: "A drop of the Ganga", sub: "Three generations tried and failed. Bhagiratha kept going, and a river came down.",
      medal: '<path d="M50 24c9 14 18 24 18 35a18 18 0 0 1-36 0c0-11 9-21 18-35z" fill="#2a1b05"/><path d="M44 60a7 7 0 0 0 7 7" stroke="#f0b93d" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    keepLine: "you stood where the ganga leaves the mountains, and you saw why she came down. tomorrow i'll take you somewhere new.",
    real: "later: plan a real trip to rishikesh with people from your circle."
  }
};
