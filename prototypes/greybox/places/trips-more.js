// More guided trips (2026-10-29): one per place in first-worlds.json not already in trips.js. Same shape as trips.js;
// load after it. Every line is the mascot's voice: lowercase, warm, "i". Facts need a scholar's read before anything ships.
window.IH_TRIPS = window.IH_TRIPS || {};
Object.assign(window.IH_TRIPS, {
  "bethlehem": {
    "world": "bethlehem",
    "guide": {
      "name": "Denzel Washington",
      "photo": "art/guides/christianity.webp",
      "door": "Christianity"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "feeling like an outsider",
        "r": "then come with me. there's a field where an outsider found a home."
      },
      {
        "t": "staying loyal to someone",
        "r": "come with me. there's a field where someone chose to stay, and it changed everything."
      },
      {
        "t": "missing someone i lost",
        "r": "i'm so sorry. there's a field i want to show you, where a woman who had lost a lot was not left alone."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Shepherds' Field, Bethlehem",
      "lat": 31.7044,
      "lon": 35.2131
    },
    "soon": [
      {
        "name": "Jordan River at Qasr al-Yahud",
        "lat": 31.838,
        "lon": 35.539
      },
      {
        "name": "Summit of Mount Sinai at dawn",
        "lat": 28.5392,
        "lon": 33.975
      }
    ],
    "region": "the hills of Bethlehem",
    "flyName": "Bethlehem",
    "where": "Shepherds' Field · Bethlehem, West Bank",
    "painting": "art/trip/bethlehem.webp",
    "alt": "The Shepherds' Field outside Bethlehem at dusk: terraced hills, a stone sheepfold and cave, a few sheep and olive trees, the town's lights on the ridge and one bright star",
    "teach": [
      "you made it. these are the shepherds' fields, just outside bethlehem. that's the town, up on the ridge.",
      "christians remember that jesus was born in bethlehem, and that shepherds out in fields like these were the first to hear the news.",
      "the gospel of luke says angels told them, and they hurried into town to find a newborn baby lying in a manger, a feeding trough.",
      "that's a big christian idea: the good news went first to ordinary people working the night shift, not to a palace.",
      "but these fields hold an older story too. long before, a woman far from home gathered grain near here. want to see it?"
    ],
    "film": "ruth-film.html",
    "keep": {
      "what": "A Handful of Barley",
      "sub": "Ruth gathered leftover grain in Bethlehem's fields, and found a family."
    },
    "keepLine": "you stood in the fields of bethlehem, and you heard how ruth found her home. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to bethlehem with people from your circle."
  },
  "jordan": {
    "world": "jordan",
    "guide": {
      "name": "Denzel Washington",
      "photo": "art/guides/christianity.webp",
      "door": "Christianity"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want a fresh start",
        "r": "then come with me. there's a river where people have stepped in to begin again for thousands of years."
      },
      {
        "t": "wondering if i'm enough",
        "r": "come with me. there's a river where someone heard he was loved before he'd done a single thing."
      },
      {
        "t": "something i need to let go of",
        "r": "i know a river for that. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Jordan River at Qasr al-Yahud",
      "lat": 31.838,
      "lon": 35.539
    },
    "soon": [
      {
        "name": "Summit of Mount Sinai at dawn",
        "lat": 28.5392,
        "lon": 33.975
      },
      {
        "name": "Jerusalem from the Mount of Olives",
        "lat": 31.7784,
        "lon": 35.2437
      }
    ],
    "region": "the Jordan valley",
    "flyName": "the Jordan River",
    "where": "Qasr al-Yahud · Jordan Valley, near Jericho",
    "painting": "art/trip/jordan.webp",
    "alt": "The green Jordan River at Qasr al-Yahud in early morning: reeds and tamarisk trees, worn stone steps and a wooden platform into the water, desert hills beyond, soft white light through clouds",
    "teach": [
      "you made it. this is the jordan river, near jericho. christians remember this stretch as the place where jesus was baptized.",
      "his cousin john was out here in the wilderness, calling people to turn their lives around and washing them in the river as a sign.",
      "the gospels say that as jesus came up out of the water, the spirit came down like a dove, and a voice said, \"you are my beloved son.\"",
      "that's why baptism matters so much to christians: you're claimed and loved first, before you've earned anything.",
      "this river has always meant new beginnings. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who was baptizing people here in the jordan?",
        "options": [
          "john, jesus' cousin",
          "peter the fisherman",
          "a roman soldier"
        ],
        "a": 0,
        "why": "john was calling people to turn their lives around, and the river was his sign of a fresh start."
      },
      {
        "q": "what came down like a dove?",
        "options": [
          "a bright star",
          "the spirit",
          "a rain cloud"
        ],
        "a": 1,
        "why": "the gospels say the spirit came down like a dove as jesus came up from the water."
      },
      {
        "q": "what does baptism mean to christians?",
        "options": [
          "a test you have to pass",
          "being claimed and loved by god",
          "a summer tradition"
        ],
        "a": 1,
        "why": "for christians, baptism says you're loved first, before you've earned a thing."
      }
    ],
    "keep": {
      "what": "A Smooth River Stone",
      "sub": "From the river where Jesus stepped in, and a voice called him beloved."
    },
    "keepLine": "you stood by the river where jesus heard he was loved. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the jordan river with people from your circle."
  },
  "sinai": {
    "world": "sinai",
    "guide": {
      "name": "Denzel Washington",
      "photo": "art/guides/christianity.webp",
      "door": "Christianity"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm not sure how to live",
        "r": "come with me. there's a mountain where some newly freed people were given a way to live."
      },
      {
        "t": "i just got free of something hard",
        "r": "then i know where to take you. there's a mountain for people who just walked out of something."
      },
      {
        "t": "i need some perspective",
        "r": "come with me. there's a mountaintop where the whole world looks new at dawn."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Summit of Mount Sinai at dawn",
      "lat": 28.5392,
      "lon": 33.975
    },
    "soon": [
      {
        "name": "Jerusalem from the Mount of Olives",
        "lat": 31.7784,
        "lon": 35.2437
      },
      {
        "name": "The Garden Tomb, Jerusalem",
        "lat": 31.7838,
        "lon": 35.2297
      }
    ],
    "region": "the Sinai desert",
    "flyName": "Mount Sinai",
    "where": "Mount Sinai · South Sinai, Egypt",
    "painting": "art/trip/sinai.webp",
    "alt": "The granite summit of Mount Sinai at dawn: a small stone chapel, red mountains rolling away in pink and violet mist, the sun breaking the horizon, a few distant pilgrims in blankets",
    "teach": [
      "you made it. this is the top of mount sinai, in egypt. people climb in the dark just to be here when the sun comes up.",
      "for centuries, people have honored this mountain as the place where god spoke to moses, out of fire and cloud.",
      "the story says moses led his people out of slavery in egypt, and up here god gave him ten commandments, carved in stone.",
      "jesus later summed them up in two: love god with all your heart, and love your neighbor as yourself.",
      "rules can feel cold, but in this story they're a gift to people who had just been set free. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who climbed this mountain in the story?",
        "options": [
          "moses",
          "noah",
          "david"
        ],
        "a": 0,
        "why": "moses climbed up here after leading his people out of slavery in egypt."
      },
      {
        "q": "what did god give moses here?",
        "options": [
          "a crown",
          "ten commandments",
          "a map home"
        ],
        "a": 1,
        "why": "the story says the ten commandments came carved in stone."
      },
      {
        "q": "how did jesus sum up the commandments?",
        "options": [
          "follow every rule exactly",
          "love god, and love your neighbor",
          "keep to yourself"
        ],
        "a": 1,
        "why": "two loves hold the whole thing together: god, and the person next to you."
      }
    ],
    "keep": {
      "what": "A Stone Tablet",
      "sub": "Ten words for people who had just been set free."
    },
    "keepLine": "you watched the sun come up where moses stood. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to mount sinai with people from your circle."
  },
  "mount-of-olives": {
    "world": "mount-of-olives",
    "guide": {
      "name": "Denzel Washington",
      "photo": "art/guides/christianity.webp",
      "door": "Christianity"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm scared of something coming",
        "r": "i'm sorry, that's a heavy thing to carry. there's a garden where someone was scared too, and wasn't ashamed of it. come with me."
      },
      {
        "t": "friends let me down",
        "r": "come with me. there's a hill where some friends fell asleep right when they were needed most."
      },
      {
        "t": "trying to trust",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Jerusalem from the Mount of Olives",
      "lat": 31.7784,
      "lon": 35.2437
    },
    "soon": [
      {
        "name": "The Garden Tomb, Jerusalem",
        "lat": 31.7838,
        "lon": 35.2297
      },
      {
        "name": "Mount of Beatitudes",
        "lat": 32.8806,
        "lon": 35.5559
      }
    ],
    "region": "Jerusalem",
    "flyName": "the Mount of Olives",
    "where": "Mount of Olives · Jerusalem",
    "painting": "art/trip/mount-of-olives.webp",
    "alt": "Jerusalem's Old City walls and golden domes seen from the Mount of Olives in late afternoon, ancient olive trees of Gethsemane and old stone graves in the foreground, the Kidron Valley between",
    "teach": [
      "you made it. this is the mount of olives. across the valley is the old city of jerusalem, and those old trees below are the garden of gethsemane.",
      "on his last night, after supper with his friends, jesus came to this garden to pray. his friends fell asleep.",
      "he was afraid, and he said so. then he said, \"not my will, but yours.\"",
      "christians see real courage in that night: being honest about your fear, and trusting god anyway.",
      "that same night he was arrested here. what happened three days later is a story for another place. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what is the garden below this hill called?",
        "options": [
          "eden",
          "gethsemane",
          "babylon"
        ],
        "a": 1,
        "why": "gethsemane sits at the foot of the mount of olives, full of old olive trees."
      },
      {
        "q": "what did his friends do that night?",
        "options": [
          "kept watch",
          "fell asleep",
          "went fishing"
        ],
        "a": 1,
        "why": "they fell asleep. they were just too tired, and he stayed with his fear anyway."
      },
      {
        "q": "what did jesus do with his fear?",
        "options": [
          "hid it",
          "was honest about it, and trusted god",
          "laughed it off"
        ],
        "a": 1,
        "why": "he said he was afraid, then said, \"not my will, but yours.\""
      }
    ],
    "keep": {
      "what": "An Olive Leaf",
      "sub": "From the garden where he was honest about his fear, and stayed."
    },
    "keepLine": "you stood where jesus spent his hardest night. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the mount of olives with people from your circle."
  },
  "garden-tomb": {
    "world": "garden-tomb",
    "guide": {
      "name": "Denzel Washington",
      "photo": "art/guides/christianity.webp",
      "door": "Christianity"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "missing someone who died",
        "r": "i'm so sorry. i can't tell you everything about what comes after, but there's a garden where people found hope at sunrise. come sit there with me."
      },
      {
        "t": "i need some hope",
        "r": "come with me. there's a garden where a sad morning turned into the brightest one."
      },
      {
        "t": "coming out of a hard season",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "The Garden Tomb, Jerusalem",
      "lat": 31.7838,
      "lon": 35.2297
    },
    "soon": [
      {
        "name": "Mount of Beatitudes",
        "lat": 32.8806,
        "lon": 35.5559
      },
      {
        "name": "Shepherds' Field, Bethlehem",
        "lat": 31.7044,
        "lon": 35.2131
      }
    ],
    "region": "Jerusalem",
    "flyName": "the Garden Tomb",
    "where": "The Garden Tomb · Jerusalem",
    "painting": "art/trip/garden-tomb.webp",
    "alt": "A quiet Jerusalem garden at sunrise: an ancient rock-cut tomb with a large round stone rolled aside, flowering plants and cypress trees, morning light falling into the empty doorway",
    "teach": [
      "you made it. this is the garden tomb, a quiet garden just outside the old city walls of jerusalem.",
      "it's a tomb cut into the rock, like the one where jesus was laid. many christians honor a church inside the walls as the exact place. this garden helps people picture it.",
      "the gospels say that early on sunday morning, mary magdalene came to the tomb and found the stone rolled away, and the tomb empty.",
      "for christians, this is the center of everything: jesus rose from death, and love turned out to be stronger than the grave.",
      "it's why easter morning feels like sunrise. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who came to the tomb that sunday morning?",
        "options": [
          "mary magdalene",
          "king herod",
          "a shepherd"
        ],
        "a": 0,
        "why": "mary magdalene came early, and she was the first to find it empty."
      },
      {
        "q": "what had happened to the stone?",
        "options": [
          "it was sealed shut",
          "it was rolled away",
          "it turned to gold"
        ],
        "a": 1,
        "why": "the big stone was rolled away from the doorway."
      },
      {
        "q": "what do christians celebrate about that morning?",
        "options": [
          "a harvest",
          "jesus rising from death",
          "a king's crowning"
        ],
        "a": 1,
        "why": "easter celebrates jesus rising, and love being stronger than the grave."
      }
    ],
    "keep": {
      "what": "The Rolled-Away Stone",
      "sub": "Sunday morning, and the tomb was empty."
    },
    "keepLine": "you stood in a garden that helps people picture easter morning. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the garden tomb with people from your circle."
  },
  "beatitudes": {
    "world": "beatitudes",
    "guide": {
      "name": "Denzel Washington",
      "photo": "art/guides/christianity.webp",
      "door": "Christianity"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "feeling overlooked",
        "r": "then come with me. there's a hillside where the overlooked were blessed first."
      },
      {
        "t": "i'm grieving",
        "r": "i'm so sorry. there's a hill where someone said the ones who mourn will be comforted. come sit there with me."
      },
      {
        "t": "trying to keep the peace",
        "r": "come with me. there's a hill where peacemakers got a blessing all their own."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Mount of Beatitudes",
      "lat": 32.8806,
      "lon": 35.5559
    },
    "soon": [
      {
        "name": "Shepherds' Field, Bethlehem",
        "lat": 31.7044,
        "lon": 35.2131
      },
      {
        "name": "Jordan River at Qasr al-Yahud",
        "lat": 31.838,
        "lon": 35.539
      }
    ],
    "region": "northern Israel",
    "flyName": "the Mount of Beatitudes",
    "where": "Mount of Beatitudes · Galilee, Israel",
    "painting": "art/trip/beatitudes.webp",
    "alt": "A grassy hillside of spring wildflowers sloping down to the Sea of Galilee, rocks to sit on, palms and a small domed church among the trees, the lake shimmering below",
    "teach": [
      "you made it. this is the mount of beatitudes, a hillside sloping down to the sea of galilee. beatitudes means blessings.",
      "christians remember this hill as the place where jesus sat down with a crowd and gave what's called the sermon on the mount.",
      "he started with blessings for people nobody called lucky: the poor in spirit, the ones who mourn, the gentle, the peacemakers.",
      "it turned the world upside down. in the kingdom he talked about, the people who feel last are seen first.",
      "he ended by saying to build your life on his words, like a house built on rock. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "where did jesus teach this crowd?",
        "options": [
          "in a palace",
          "on a hillside",
          "in a market"
        ],
        "a": 1,
        "why": "he sat down on a hill above the lake and taught whoever came."
      },
      {
        "q": "who did he call blessed?",
        "options": [
          "only the strong",
          "the ones who mourn and the peacemakers",
          "only the rich"
        ],
        "a": 1,
        "why": "he blessed the people nobody else called lucky."
      },
      {
        "q": "what did he say to build your life on?",
        "options": [
          "sand",
          "rock",
          "gold"
        ],
        "a": 1,
        "why": "a house on rock stands when the storm comes. he meant his teaching."
      }
    ],
    "keep": {
      "what": "A Wildflower From the Hill",
      "sub": "Blessed are the peacemakers, he said, right here."
    },
    "keepLine": "you sat on the hill where jesus blessed the overlooked. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the mount of beatitudes with people from your circle."
  },
  "st-peters": {
    "world": "st-peters",
    "guide": {
      "name": "Nicole Kidman",
      "photo": "art/guides/catholic.webp",
      "door": "Catholic"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i messed up",
        "r": "then come with me. there's a church built on a man who messed up, and was trusted anyway."
      },
      {
        "t": "wanting to belong",
        "r": "come with me. there's a square built to look like a hug."
      },
      {
        "t": "thinking about my family's faith",
        "r": "that's a lovely thing to think about. come with me, i'll show you a place a lot of families dream of seeing."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "St Peter's Square, Vatican",
      "lat": 41.9022,
      "lon": 12.4568
    },
    "soon": [
      {
        "name": "Assisi and the Basilica of St Francis",
        "lat": 43.075,
        "lon": 12.605
      },
      {
        "name": "The Grotto at Lourdes",
        "lat": 43.0975,
        "lon": -0.0583
      }
    ],
    "region": "Rome",
    "flyName": "Vatican City",
    "where": "St. Peter's Square · Vatican City",
    "painting": "art/trip/st-peters.webp",
    "alt": "St. Peter's Square at dawn: the curving colonnade around the empty square, the obelisk and fountains, the great dome of St. Peter's glowing pink and gold in soft mist",
    "teach": [
      "you made it. this is st. peter's square in vatican city, the smallest country in the world.",
      "those curved colonnades were designed to look like two arms, the church reaching out to hug whoever walks in.",
      "catholics believe peter, the fisherman who followed jesus, died in rome and was buried right here, under the great dome.",
      "jesus called him the rock. catholics see the pope as peter's successor, and the church as one family all over the world.",
      "and peter wasn't perfect. he let jesus down badly, and jesus still built on him. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who do catholics believe is buried under the dome?",
        "options": [
          "st. peter",
          "st. francis",
          "st. patrick"
        ],
        "a": 0,
        "why": "peter the fisherman, jesus' friend, is honored right under the dome."
      },
      {
        "q": "what are the curved colonnades meant to look like?",
        "options": [
          "walls",
          "two open arms",
          "ocean waves"
        ],
        "a": 1,
        "why": "the arms reach out to welcome everyone who walks in."
      },
      {
        "q": "what did jesus call peter?",
        "options": [
          "the rock",
          "the lamb",
          "the lion"
        ],
        "a": 0,
        "why": "peter means rock. jesus built on him, stumbles and all."
      }
    ],
    "keep": {
      "what": "Peter's Keys",
      "sub": "Jesus trusted him with the keys, stumbles and all."
    },
    "keepLine": "you stood in the arms of st. peter's square. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to vatican city with people from your circle."
  },
  "assisi": {
    "world": "assisi",
    "guide": {
      "name": "Nicole Kidman",
      "photo": "art/guides/catholic.webp",
      "door": "Catholic"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "too much stuff, not enough joy",
        "r": "come with me. there's a hill town where a rich young man found joy by giving it all away."
      },
      {
        "t": "i love animals and nature",
        "r": "then i know exactly who you need to meet. come with me."
      },
      {
        "t": "wondering what really matters",
        "r": "come with me. there's a man in italy who asked that same question, and changed his whole life."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Assisi and the Basilica of St Francis",
      "lat": 43.075,
      "lon": 12.605
    },
    "soon": [
      {
        "name": "The Grotto at Lourdes",
        "lat": 43.0975,
        "lon": -0.0583
      },
      {
        "name": "Santiago de Compostela, end of the Camino",
        "lat": 42.8806,
        "lon": -8.5446
      }
    ],
    "region": "Umbria, Italy",
    "flyName": "Assisi",
    "where": "Assisi · Umbria, Italy",
    "painting": "art/trip/assisi.webp",
    "alt": "The hill town of Assisi at golden hour seen from a meadow, the Basilica of St. Francis with its long arches, olive groves, cypress trees, wildflowers and a small bird on a branch",
    "teach": [
      "you made it. this is assisi, a hill town in italy. that long church on the hillside holds the tomb of st. francis.",
      "francis was a rich cloth merchant's son who loved a good party. then, as a young man, he gave it all away to live simply and serve the poor.",
      "he called the sun his brother and the moon his sister, and the old stories say even the birds stopped to listen to him.",
      "catholics remember him for a joy that didn't need things: everything is a gift, so every creature is family.",
      "that's why he's the patron saint of animals and the earth. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what did francis's father do?",
        "options": [
          "sold cloth",
          "built ships",
          "led an army"
        ],
        "a": 0,
        "why": "his father was a rich cloth merchant, and francis grew up with plenty."
      },
      {
        "q": "what did francis do with his wealth?",
        "options": [
          "kept it safe",
          "gave it away",
          "bought a castle"
        ],
        "a": 1,
        "why": "he gave it all away to live simply and serve the poor."
      },
      {
        "q": "what did francis call the sun?",
        "options": [
          "his king",
          "his brother",
          "his enemy"
        ],
        "a": 1,
        "why": "brother sun, sister moon. to him, all of creation was family."
      }
    ],
    "keep": {
      "what": "A Bird on a Branch",
      "sub": "Francis called every creature his brother or sister."
    },
    "keepLine": "you stood below st. francis's hill town, where joy didn't need a thing. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to assisi with people from your circle."
  },
  "lourdes": {
    "world": "lourdes",
    "guide": {
      "name": "Nicole Kidman",
      "photo": "art/guides/catholic.webp",
      "door": "Catholic"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "someone i love is sick",
        "r": "i'm so sorry. there's a quiet place where people bring the ones they love and light a candle. come with me."
      },
      {
        "t": "feeling small or overlooked",
        "r": "come with me. there's a rock where heaven came to a poor girl nobody noticed."
      },
      {
        "t": "i need some hope",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "The Grotto at Lourdes",
      "lat": 43.0975,
      "lon": -0.0583
    },
    "soon": [
      {
        "name": "Santiago de Compostela, end of the Camino",
        "lat": 42.8806,
        "lon": -8.5446
      },
      {
        "name": "Tepeyac Hill, Guadalupe",
        "lat": 19.4847,
        "lon": -99.1175
      }
    ],
    "region": "southwest France",
    "flyName": "Lourdes",
    "where": "The Grotto · Lourdes, France",
    "painting": "art/trip/lourdes.webp",
    "alt": "The rock grotto of Massabielle at Lourdes in the evening: a white statue of Mary in a niche high in the rock, racks of glowing candles, the river flowing past, the basilica spire above",
    "teach": [
      "you made it. this is the grotto at lourdes, in the foothills of the pyrenees in france.",
      "in 1858, a poor 14-year-old girl named bernadette came here to gather firewood. catholics believe mary appeared to her in this rock.",
      "the lady asked her to dig in the ground, and a spring came up. people still come to that water, many of them sick, carrying their hopes.",
      "for catholics, it says something tender: heaven came first to a poor, sickly, overlooked girl, and spoke to her kindly.",
      "every evening people walk here with candles. you can watch, learn the songs, or join in if you want. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who do catholics believe mary appeared to here?",
        "options": [
          "a queen",
          "bernadette, a poor girl",
          "a bishop"
        ],
        "a": 1,
        "why": "bernadette was fourteen, poor and often sick, and she came here for firewood."
      },
      {
        "q": "what came up where bernadette dug?",
        "options": [
          "a spring",
          "a flower",
          "gold"
        ],
        "a": 0,
        "why": "a spring came up, and people still come to its water today."
      },
      {
        "q": "what happens here every evening?",
        "options": [
          "a market",
          "a candle procession",
          "fireworks"
        ],
        "a": 1,
        "why": "people walk together with candles, singing as they go."
      }
    ],
    "keep": {
      "what": "A Lit Candle",
      "sub": "Bernadette was poor and overlooked, and heaven spoke to her kindly."
    },
    "keepLine": "you stood by the candles at lourdes. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to lourdes with people from your circle."
  },
  "santiago": {
    "world": "santiago",
    "guide": {
      "name": "Nicole Kidman",
      "photo": "art/guides/catholic.webp",
      "door": "Catholic"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm at the end of something long",
        "r": "then come with me. there's a square where long journeys end."
      },
      {
        "t": "i need to walk something off",
        "r": "come with me. there's a city people have walked to for more than a thousand years."
      },
      {
        "t": "starting a new chapter",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Santiago de Compostela, end of the Camino",
      "lat": 42.8806,
      "lon": -8.5446
    },
    "soon": [
      {
        "name": "Tepeyac Hill, Guadalupe",
        "lat": 19.4847,
        "lon": -99.1175
      },
      {
        "name": "Montserrat monastery",
        "lat": 41.5933,
        "lon": 1.8372
      }
    ],
    "region": "Galicia, Spain",
    "flyName": "Santiago de Compostela",
    "where": "Santiago de Compostela · Galicia, Spain",
    "painting": "art/trip/santiago.webp",
    "alt": "The Praza do Obradoiro in Santiago de Compostela at sunset: the towering baroque cathedral, wet granite paving reflecting the light, a walking staff and scallop shell on a backpack",
    "teach": [
      "you made it. this is santiago de compostela in spain, the end of the camino, the way of st. james.",
      "james was one of jesus' first friends, a fisherman from galilee. catholics believe his remains rest in this cathedral.",
      "for more than a thousand years, pilgrims have walked here, some for weeks, carrying a scallop shell as their sign.",
      "catholics see all of life as a pilgrimage: you don't walk it alone, and every step can be a prayer, if you want it to be.",
      "at some masses inside, a giant incense burner swings high over the crowd. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who is honored in this cathedral?",
        "options": [
          "st. james",
          "st. nicholas",
          "st. george"
        ],
        "a": 0,
        "why": "james was one of jesus' first friends, a fisherman like peter."
      },
      {
        "q": "what do pilgrims carry as their sign?",
        "options": [
          "a key",
          "a scallop shell",
          "a bell"
        ],
        "a": 1,
        "why": "the scallop shell marks you as a pilgrim on the way of st. james."
      },
      {
        "q": "what is the camino?",
        "options": [
          "a race",
          "a pilgrimage on foot",
          "a river"
        ],
        "a": 1,
        "why": "it's a long walk to santiago, and people have made it for centuries."
      }
    ],
    "keep": {
      "what": "A Scallop Shell",
      "sub": "Pilgrims carry it all the way to St. James."
    },
    "keepLine": "you reached the end of the camino today. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to santiago de compostela with people from your circle."
  },
  "guadalupe": {
    "world": "guadalupe",
    "guide": {
      "name": "Nicole Kidman",
      "photo": "art/guides/catholic.webp",
      "door": "Catholic"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "missing my mom",
        "r": "that's a tender thing to carry. there's a hill where someone heard, \"am i not here, i who am your mother?\" come with me."
      },
      {
        "t": "feeling like i don't fit in",
        "r": "come with me. there's a hill where mary spoke to a man in his own language."
      },
      {
        "t": "waiting for a sign",
        "r": "then i know where to take you. there's a hill where roses bloomed in december."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Tepeyac Hill, Guadalupe",
      "lat": 19.4847,
      "lon": -99.1175
    },
    "soon": [
      {
        "name": "Montserrat monastery",
        "lat": 41.5933,
        "lon": 1.8372
      },
      {
        "name": "St Peter's Square, Vatican",
        "lat": 41.9022,
        "lon": 12.4568
      }
    ],
    "region": "Mexico City",
    "flyName": "Tepeyac Hill",
    "where": "Tepeyac Hill · Mexico City, Mexico",
    "painting": "art/trip/guadalupe.webp",
    "alt": "Tepeyac Hill in Mexico City at dawn: a stone stairway through rose gardens to a small hilltop chapel, the old basilica domes below, the city in morning haze, roses in the foreground",
    "teach": [
      "you made it. this is tepeyac hill in mexico city.",
      "in 1531, a man named juan diego was walking past here. catholics believe mary appeared to him, speaking his own language, nahuatl.",
      "the bishop wanted proof. so in december, juan diego gathered roses from this cold hill in his cloak, and catholics believe her image appeared on the cloth.",
      "she told him, \"am i not here, i who am your mother?\" that's why she feels like family to so many, across mexico and the americas.",
      "that cloak hangs in the basilica below to this day. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who do catholics believe mary appeared to here?",
        "options": [
          "juan diego",
          "a spanish king",
          "a sea captain"
        ],
        "a": 0,
        "why": "juan diego was an ordinary man walking past this hill."
      },
      {
        "q": "what did he carry in his cloak?",
        "options": [
          "bread",
          "roses",
          "stones"
        ],
        "a": 1,
        "why": "roses, in december, on a cold hill. that was the sign."
      },
      {
        "q": "what did she tell him?",
        "options": [
          "go away",
          "am i not here, i who am your mother?",
          "build a castle"
        ],
        "a": 1,
        "why": "she spoke to him like a mother, in his own language."
      }
    ],
    "keep": {
      "what": "A December Rose",
      "sub": "Juan Diego carried roses from a cold hill in his cloak."
    },
    "keepLine": "you climbed tepeyac hill, where a mother's words still comfort people. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to tepeyac hill with people from your circle."
  },
  "montserrat": {
    "world": "montserrat",
    "guide": {
      "name": "Nicole Kidman",
      "photo": "art/guides/catholic.webp",
      "door": "Catholic"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need to put something down",
        "r": "come with me. there's a mountain where a soldier laid down his sword."
      },
      {
        "t": "too much noise in my life",
        "r": "then i know where to take you. there's a monastery up above the clouds."
      },
      {
        "t": "changing direction",
        "r": "come with me. there's a place where someone turned his whole life around."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Montserrat monastery",
      "lat": 41.5933,
      "lon": 1.8372
    },
    "soon": [
      {
        "name": "St Peter's Square, Vatican",
        "lat": 41.9022,
        "lon": 12.4568
      },
      {
        "name": "Assisi and the Basilica of St Francis",
        "lat": 43.075,
        "lon": 12.605
      }
    ],
    "region": "Catalonia, Spain",
    "flyName": "Montserrat",
    "where": "Montserrat · Catalonia, Spain",
    "painting": "art/trip/montserrat.webp",
    "alt": "The Benedictine monastery of Montserrat among jagged pink rock pinnacles above the clouds, morning sun, a stone terrace with a bench, a valley of mist below",
    "teach": [
      "you made it. this is montserrat, a monastery in the mountains near barcelona, in spain. the name means \"saw-toothed mountain.\"",
      "benedictine monks have lived up here for centuries, following st. benedict's simple rule: pray and work.",
      "in 1522, a wounded soldier named ignatius came here, laid his sword down before the statue of mary, and walked away to serve god instead.",
      "for catholics, that's what a monastery is for: a quiet place where you can put down what you've been carrying, and start again.",
      "a boys' choir still sings here, and visitors can listen in. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who lives here?",
        "options": [
          "benedictine monks",
          "knights",
          "fishermen"
        ],
        "a": 0,
        "why": "benedictine monks have lived and worked on this mountain for centuries."
      },
      {
        "q": "what did ignatius leave here?",
        "options": [
          "his sword",
          "his crown",
          "his boots"
        ],
        "a": 0,
        "why": "he laid down his sword and started a new life."
      },
      {
        "q": "st. benedict's rule, in two words?",
        "options": [
          "eat and sleep",
          "pray and work",
          "fight and win"
        ],
        "a": 1,
        "why": "pray and work: an ordinary day, made holy."
      }
    ],
    "keep": {
      "what": "Ignatius's Sword",
      "sub": "He laid it down here and walked away a new man."
    },
    "keepLine": "you stood above the clouds where ignatius put down his sword. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to montserrat with people from your circle."
  },
  "varanasi": {
    "world": "varanasi",
    "guide": {
      "name": "Priyanka Chopra",
      "photo": "art/guides/hinduism.webp",
      "door": "Hinduism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "worried about having enough",
        "r": "come with me. there's a city with a goddess who makes sure everyone is fed."
      },
      {
        "t": "wanting to give back",
        "r": "then i know a kitchen you'll love. come with me."
      },
      {
        "t": "thinking about someone i lost",
        "r": "i'm so sorry. there's a city by the river where people have come to remember the ones they love for thousands of years. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Dashashwamedh Ghat, Varanasi",
      "lat": 25.3069,
      "lon": 83.0104
    },
    "soon": [
      {
        "name": "Vaishno Devi in the Trikuta hills",
        "lat": 33.0305,
        "lon": 74.949
      },
      {
        "name": "Kedarnath Temple",
        "lat": 30.7352,
        "lon": 79.0669
      }
    ],
    "region": "the banks of the Ganga",
    "flyName": "Varanasi, on the Ganga",
    "where": "Dashashwamedh Ghat · Varanasi, India",
    "painting": "art/trip/varanasi.webp",
    "alt": "The ghats of Varanasi at dawn: long stone steps, old temples and palaces along the Ganga, wooden boats with lamps, marigolds and brass bells, golden mist on the river",
    "teach": [
      "you made it. this is varanasi, on the ganga. people also call it kashi, the city of light.",
      "it's one of the oldest cities in the world where people still live, and it's known as shiva's own city.",
      "every evening at this ghat, priests wave big brass lamps for the river. it's called the ganga aarti. you can watch, learn the words, or join in if you want.",
      "people here don't only bring flowers. many feed strangers, because sharing food is a way of honoring god in every person.",
      "and kashi has a goddess whose whole story is about food. she runs the kitchen of the world. want to see it?"
    ],
    "film": "annapurna-film.html",
    "keep": {
      "what": "Annapurna's Ladle",
      "sub": "The goddess of food feeds the whole city, and no one is turned away."
    },
    "keepLine": "you stood on the ghats of kashi and saw who feeds the city. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to varanasi with people from your circle."
  },
  "vaishno-devi": {
    "world": "vaishno-devi",
    "guide": {
      "name": "Priyanka Chopra",
      "photo": "art/guides/hinduism.webp",
      "door": "Hinduism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need strength for something hard",
        "r": "then come with me. there's a mountain people climb all night, calling out for their mother."
      },
      {
        "t": "missing my mom",
        "r": "that's a tender thing to carry. come with me. there's a shrine where everyone calls god mother."
      },
      {
        "t": "feeling far from my roots",
        "r": "come with me. a lot of families have walked this path, maybe even yours."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Vaishno Devi in the Trikuta hills",
      "lat": 33.0305,
      "lon": 74.949
    },
    "soon": [
      {
        "name": "Kedarnath Temple",
        "lat": 30.7352,
        "lon": 79.0669
      },
      {
        "name": "Keshi Ghat, Vrindavan",
        "lat": 27.5833,
        "lon": 77.696
      }
    ],
    "region": "the Trikuta hills",
    "flyName": "Vaishno Devi",
    "where": "Vaishno Devi · Jammu and Kashmir, India",
    "painting": "art/trip/vaishno-devi.webp",
    "alt": "The lamp-lit mountain path to Vaishno Devi at dusk, winding up a forested mountain to a glowing shrine near the summit, red and gold flags, snowy peaks behind, a few distant pilgrims",
    "teach": [
      "you made it. these are the trikuta hills, and that glow near the top is the shrine of vaishno devi.",
      "she's a form of the divine mother. people walk up from the town of katra, even through the night, calling out \"jai mata di,\" victory to the mother.",
      "at the top, in a cave, she's honored as three natural rocks, for three goddesses: kali, lakshmi and saraswati.",
      "people here say the mother calls you when you're ready. you bring your tired feet, and she meets you there.",
      "strength, abundance and wisdom, all in one mother. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what do pilgrims call out on the climb?",
        "options": [
          "jai mata di",
          "happy diwali",
          "good morning"
        ],
        "a": 0,
        "why": "it means victory to the mother."
      },
      {
        "q": "how is she honored in the cave?",
        "options": [
          "as three natural rocks",
          "as a golden statue",
          "as a painting"
        ],
        "a": 0,
        "why": "three natural rock forms, called pindis, sit in the cave."
      },
      {
        "q": "which three goddesses do the rocks stand for?",
        "options": [
          "kali, lakshmi and saraswati",
          "sita, radha and ganga",
          "parvati, sati and uma"
        ],
        "a": 0,
        "why": "strength, abundance and wisdom, all honored as one mother."
      }
    ],
    "keep": {
      "what": "A Red Chunri",
      "sub": "The red scarf pilgrims offer to the mother at the top."
    },
    "keepLine": "you climbed to the mother's cave in the trikuta hills. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to vaishno devi with people from your circle."
  },
  "kedarnath": {
    "world": "kedarnath",
    "guide": {
      "name": "Priyanka Chopra",
      "photo": "art/guides/hinduism.webp",
      "door": "Hinduism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm trying to make things right",
        "r": "come with me. there's a temple where some brothers climbed a mountain to ask forgiveness."
      },
      {
        "t": "waiting for something i really want",
        "r": "then i know where to take you. there's a mountain where someone worked and waited for what she loved."
      },
      {
        "t": "i need to get away",
        "r": "come with me. it's about as far up as a temple goes."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Kedarnath Temple",
      "lat": 30.7352,
      "lon": 79.0669
    },
    "soon": [
      {
        "name": "Keshi Ghat, Vrindavan",
        "lat": 27.5833,
        "lon": 77.696
      },
      {
        "name": "The Sarayu at Ayodhya",
        "lat": 26.803,
        "lon": 82.199
      }
    ],
    "region": "the high Himalaya",
    "flyName": "Kedarnath",
    "where": "Kedarnath · Uttarakhand, India",
    "painting": "art/trip/kedarnath.webp",
    "alt": "The ancient stone Kedarnath temple at sunrise before a towering snow-covered Himalayan peak, a carved stone Nandi bull in front, prayer bells, mist in the valley",
    "teach": [
      "you made it. this is kedarnath, high in the himalaya. the stone temple is for shiva, and it's only open about half the year, before the snow comes.",
      "the old story says that after a terrible war, the five pandava brothers came looking for shiva to ask forgiveness. he hid from them as a bull.",
      "when bhima grabbed the bull, it sank into the earth. people say its hump stayed right here, and that's what is honored inside.",
      "so this place is about seeking: you climb a long way, you keep looking, and shiva lets himself be found.",
      "the trail up starts at gaurikund, named for parvati. she did her own long seeking in these mountains. want to see it?"
    ],
    "film": "parvati-film.html",
    "keep": {
      "what": "Parvati's Patience",
      "sub": "Season after season, she kept her practice in these mountains."
    },
    "keepLine": "you climbed to kedarnath and saw how parvati kept going. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to kedarnath with people from your circle."
  },
  "vrindavan": {
    "world": "vrindavan",
    "guide": {
      "name": "Priyanka Chopra",
      "photo": "art/guides/hinduism.webp",
      "door": "Hinduism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "missing someone i love",
        "r": "come with me. there's a town where the whole place is about longing for someone you love."
      },
      {
        "t": "i need more play in my life",
        "r": "then i know exactly where to take you. there's a river where god grew up playing."
      },
      {
        "t": "my heart feels far from god",
        "r": "come with me. there's a town where people say god is as close as a friend."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Keshi Ghat, Vrindavan",
      "lat": 27.5833,
      "lon": 77.696
    },
    "soon": [
      {
        "name": "The Sarayu at Ayodhya",
        "lat": 26.803,
        "lon": 82.199
      },
      {
        "name": "Tirumala hills",
        "lat": 13.6833,
        "lon": 79.3475
      }
    ],
    "region": "the banks of the Yamuna",
    "flyName": "Vrindavan",
    "where": "Keshi Ghat · Vrindavan, India",
    "painting": "art/trip/vrindavan.webp",
    "alt": "Keshi Ghat on the Yamuna at Vrindavan at sunset: red sandstone pavilions and steps, peacocks on the ghat, a flute resting on a step with marigolds, boats on the calm river",
    "teach": [
      "you made it. this is keshi ghat in vrindavan, on the yamuna river.",
      "this is where krishna grew up as a cowherd boy, playing his flute in the forests by this river. that's why peacocks feel at home here: he wore their feather in his hair.",
      "people say this ghat is named for keshi, a wild horse demon krishna beat, before bathing right here.",
      "but vrindavan's real teaching is love. for many hindus, krishna and radha's love is a picture of the soul and god longing for each other.",
      "people here even greet each other with \"radhe radhe.\" let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who grew up here as a cowherd boy?",
        "options": [
          "krishna",
          "rama",
          "ganesha"
        ],
        "a": 0,
        "why": "krishna spent his childhood here, playing by the yamuna."
      },
      {
        "q": "what did he play by the river?",
        "options": [
          "a flute",
          "a drum",
          "a violin"
        ],
        "a": 0,
        "why": "his flute is so loved that you'll see it everywhere in vrindavan."
      },
      {
        "q": "how do people greet each other here?",
        "options": [
          "radhe radhe",
          "jai ho",
          "hello friend"
        ],
        "a": 0,
        "why": "it calls on radha, krishna's beloved, every time you say hi."
      }
    ],
    "keep": {
      "what": "A Peacock Feather",
      "sub": "Krishna wore one in his hair, playing his flute by the Yamuna."
    },
    "keepLine": "you stood by the yamuna where krishna played. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to vrindavan with people from your circle."
  },
  "ayodhya": {
    "world": "ayodhya",
    "guide": {
      "name": "Priyanka Chopra",
      "photo": "art/guides/hinduism.webp",
      "door": "Hinduism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "coming home after a long time away",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "waiting for something to end",
        "r": "come with me. there's a city that waited fourteen years for someone to come home."
      },
      {
        "t": "keeping a hard promise",
        "r": "come with me. there's a prince who kept his word, even when it cost him everything."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "The Sarayu at Ayodhya",
      "lat": 26.803,
      "lon": 82.199
    },
    "soon": [
      {
        "name": "Tirumala hills",
        "lat": 13.6833,
        "lon": 79.3475
      },
      {
        "name": "Dashashwamedh Ghat, Varanasi",
        "lat": 25.3069,
        "lon": 83.0104
      }
    ],
    "region": "the banks of the Sarayu",
    "flyName": "Ayodhya, on the Sarayu",
    "where": "The Sarayu · Ayodhya, India",
    "painting": "art/trip/ayodhya.webp",
    "alt": "The ghats of the Sarayu river at Ayodhya at dusk during a festival of lights: small clay lamps along the steps, temple spires on the bank, reflections on the water",
    "teach": [
      "you made it. this is ayodhya, on the banks of the sarayu river.",
      "hindus remember ayodhya as the city where rama was born, the prince who was kind, fair and kept his word.",
      "the ramayana says he was sent away to the forest for fourteen years, and he went without bitterness.",
      "for many hindus, rama shows what dharma looks like: doing what's right, even when it costs you.",
      "and when he finally came home, the whole city lit up. want to see it?"
    ],
    "film": "homecoming-film.html",
    "keep": {
      "what": "A Clay Lamp",
      "sub": "Ayodhya lit every step to welcome Rama home."
    },
    "keepLine": "you stood by the sarayu, where a whole city lit lamps for a homecoming. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to ayodhya with people from your circle."
  },
  "tirumala": {
    "world": "tirumala",
    "guide": {
      "name": "Priyanka Chopra",
      "photo": "art/guides/hinduism.webp",
      "door": "Hinduism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm getting married",
        "r": "that's so wonderful! come with me. there's a hill with a famous wedding story."
      },
      {
        "t": "letting go of my pride",
        "r": "come with me. there's a hill where people give a little of themselves away."
      },
      {
        "t": "i owe someone a lot",
        "r": "then i know a story for that. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Tirumala hills",
      "lat": 13.6833,
      "lon": 79.3475
    },
    "soon": [
      {
        "name": "Dashashwamedh Ghat, Varanasi",
        "lat": 25.3069,
        "lon": 83.0104
      },
      {
        "name": "Vaishno Devi in the Trikuta hills",
        "lat": 33.0305,
        "lon": 74.949
      }
    ],
    "region": "the hills of Andhra Pradesh",
    "flyName": "the Tirumala hills",
    "where": "Tirumala · Andhra Pradesh, India",
    "painting": "art/trip/tirumala.webp",
    "alt": "The green Tirumala hills at sunrise, a golden temple dome among the trees, a stone stairway climbing through the forest, morning mist and a few lamps",
    "teach": [
      "you made it. these are the tirumala hills. that golden dome among the trees is the temple of lord venkateswara, a form of vishnu.",
      "many pilgrims climb thousands of stone steps up through this forest, barefoot, to reach him.",
      "the story goes that he borrowed a fortune from kubera, the god of wealth, to pay for his wedding to padmavati. people's gifts help him pay it back.",
      "and many people offer their hair here. it's a way to give up a little pride and say, \"i'm yours.\"",
      "everyone leaves with a sweet laddu, a gift from the temple. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who is honored in the temple here?",
        "options": [
          "lord venkateswara",
          "king ashoka",
          "a river spirit"
        ],
        "a": 0,
        "why": "lord venkateswara is a form of vishnu, loved all over south india."
      },
      {
        "q": "what do many pilgrims offer here?",
        "options": [
          "their hair",
          "their shoes",
          "a letter"
        ],
        "a": 0,
        "why": "giving your hair is a way of saying \"i'm yours,\" and letting go of a little pride."
      },
      {
        "q": "what sweet do pilgrims take home?",
        "options": [
          "a laddu",
          "a cupcake",
          "a mango"
        ],
        "a": 0,
        "why": "the tirumala laddu is a gift from the temple, shared with family back home."
      }
    ],
    "keep": {
      "what": "A Temple Laddu",
      "sub": "A sweet gift from the hill, made to be shared."
    },
    "keepLine": "you climbed the tirumala hills and heard about a wedding still being paid for. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the tirumala hills with people from your circle."
  },
  "western-wall": {
    "world": "western-wall",
    "guide": {
      "name": "Natalie Portman",
      "photo": "art/guides/judaism.webp",
      "door": "Judaism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm exhausted",
        "r": "then come with me. there's a city that stops every friday night to rest."
      },
      {
        "t": "missing someone",
        "r": "i'm sorry. there's a wall where people leave notes for the ones they love and the things they hope for. come with me."
      },
      {
        "t": "feeling far from my roots",
        "r": "come with me. there's a wall people have come back to for centuries."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "The Western Wall at Shabbat's arrival",
      "lat": 31.7767,
      "lon": 35.2345
    },
    "soon": [
      {
        "name": "Safed in the Galilee hills",
        "lat": 32.9646,
        "lon": 35.496
      },
      {
        "name": "Masada at sunrise",
        "lat": 31.3156,
        "lon": 35.3536
      }
    ],
    "region": "Jerusalem",
    "flyName": "the Western Wall",
    "where": "The Western Wall · Jerusalem",
    "painting": "art/trip/western-wall.webp",
    "alt": "The Western Wall in Jerusalem at dusk as Shabbat arrives: huge pale golden stones with plants and folded notes in the cracks, the plaza softly lit, a deep blue evening sky",
    "teach": [
      "you made it. this is the western wall in jerusalem, just as shabbat begins.",
      "these huge stones held up the hill where the holy temple once stood. the romans destroyed the temple almost two thousand years ago, and this wall is what's left close by.",
      "people tuck tiny folded notes into the cracks: wishes, thank-yous, prayers. you can watch, write one, or just stand quietly if you want.",
      "jews have kept coming back for centuries, and shabbat says the same thing every week: stop, rest, you are more than what you do.",
      "people here greet each other with \"shabbat shalom,\" a peaceful sabbath. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what once stood on the hill above this wall?",
        "options": [
          "the holy temple",
          "a castle",
          "a lighthouse"
        ],
        "a": 0,
        "why": "the wall held up the hill where the temple stood."
      },
      {
        "q": "what do people tuck into the cracks?",
        "options": [
          "coins",
          "folded notes",
          "flowers"
        ],
        "a": 1,
        "why": "little notes of hope and thanks, tucked into the old stones."
      },
      {
        "q": "what does shabbat ask of you each week?",
        "options": [
          "work harder",
          "stop and rest",
          "stay up late"
        ],
        "a": 1,
        "why": "shabbat is a weekly gift of rest: you are more than what you do."
      }
    ],
    "keep": {
      "what": "A Folded Note",
      "sub": "Tucked between the old stones, for whatever you hope."
    },
    "keepLine": "you stood at the western wall as shabbat began. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the western wall with people from your circle."
  },
  "safed": {
    "world": "safed",
    "guide": {
      "name": "Natalie Portman",
      "photo": "art/guides/judaism.webp",
      "door": "Judaism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "the world feels broken",
        "r": "then come with me. there's a town where a teacher said every kind act lifts a spark of light."
      },
      {
        "t": "i want something deeper",
        "r": "come with me. there's a little town in the hills where people have searched deep for centuries."
      },
      {
        "t": "i love music",
        "r": "then i know where to take you. there's a town that gave the world a song for friday nights."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Safed in the Galilee hills",
      "lat": 32.9646,
      "lon": 35.496
    },
    "soon": [
      {
        "name": "Masada at sunrise",
        "lat": 31.3156,
        "lon": 35.3536
      },
      {
        "name": "Old-New Synagogue, Prague",
        "lat": 50.0903,
        "lon": 14.4187
      }
    ],
    "region": "the hills of Galilee",
    "flyName": "Safed",
    "where": "Safed · Galilee, Israel",
    "painting": "art/trip/safed.webp",
    "alt": "The old blue-painted stone lanes of Safed at twilight, a synagogue doorway glowing with light, stone steps and arches, green hills beyond, a pair of Shabbat candles in a window",
    "teach": [
      "you made it. this is safed, up in the hills of galilee. it's one of judaism's four holy cities.",
      "about five hundred years ago, great teachers of jewish mysticism, called kabbalah, gathered in these little stone lanes.",
      "one of them, rabbi isaac luria, taught that god's light was scattered into sparks hidden in everything, and every kind thing a person does lifts one back up.",
      "another wrote a song here welcoming shabbat like a bride. jews around the world still sing it on friday nights.",
      "people say the blue on these walls is there to remind you of heaven. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what kind of teaching is safed famous for?",
        "options": [
          "kabbalah, jewish mysticism",
          "sailing",
          "astronomy"
        ],
        "a": 0,
        "why": "great teachers of kabbalah gathered here about five hundred years ago."
      },
      {
        "q": "what did rabbi luria say is hidden in everything?",
        "options": [
          "sparks of god's light",
          "gold coins",
          "secret maps"
        ],
        "a": 0,
        "why": "every good deed lifts a little light back up, he taught."
      },
      {
        "q": "how does the song from safed welcome shabbat?",
        "options": [
          "like a bride",
          "like a storm",
          "like a stranger"
        ],
        "a": 0,
        "why": "it greets shabbat like a bride arriving, full of joy."
      }
    ],
    "keep": {
      "what": "A Spark of Light",
      "sub": "Hidden in everything, lifted by every kind act."
    },
    "keepLine": "you walked the blue lanes of safed, where sparks are hidden everywhere. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to safed with people from your circle."
  },
  "masada": {
    "world": "masada",
    "guide": {
      "name": "Natalie Portman",
      "photo": "art/guides/judaism.webp",
      "door": "Judaism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "trying to hold on",
        "r": "come with me. there's a mountain where an old scroll about hope was found."
      },
      {
        "t": "feeling stuck in a low place",
        "r": "then i know where to take you. you'll be looking down at the lowest place on land."
      },
      {
        "t": "starting over after a loss",
        "r": "i'm sorry. there's a mountain where people found an old vision of coming back to life. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Masada at sunrise",
      "lat": 31.3156,
      "lon": 35.3536
    },
    "soon": [
      {
        "name": "Old-New Synagogue, Prague",
        "lat": 50.0903,
        "lon": 14.4187
      },
      {
        "name": "Abraham's road, Haran",
        "lat": 36.864,
        "lon": 39.031
      }
    ],
    "region": "the Dead Sea",
    "flyName": "Masada",
    "where": "Masada · Dead Sea, Israel",
    "painting": "art/trip/masada.webp",
    "alt": "The top of Masada at sunrise: ancient stone walls and ruins in the foreground, the Dead Sea shining below, the mountains of Moab glowing pink across the water",
    "teach": [
      "you made it. this is the top of masada, a mountain fortress above the dead sea, the lowest place on land on earth.",
      "king herod built palaces up here. later, after rome destroyed the temple in jerusalem, a group of jews held out on this mountain for years.",
      "they built a small synagogue up top. under its floor, archaeologists found old scroll pieces, including ezekiel's vision of dry bones coming back to life.",
      "that's a deep jewish teaching: even when everything looks lost, a people can come back to life, together.",
      "today people climb the snake path in the dark to watch the sun come up over the water. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "which sea shines below masada?",
        "options": [
          "the dead sea",
          "the red sea",
          "the black sea"
        ],
        "a": 0,
        "why": "the dead sea, the lowest place on land on earth."
      },
      {
        "q": "what did the people on the mountain build?",
        "options": [
          "a synagogue",
          "a lighthouse",
          "a harbor"
        ],
        "a": 0,
        "why": "they built a small synagogue, one of the oldest ever found."
      },
      {
        "q": "what vision was in the scroll pieces found there?",
        "options": [
          "dry bones coming back to life",
          "a great flood",
          "a golden calf"
        ],
        "a": 0,
        "why": "ezekiel saw dry bones come back to life, a picture of hope for a whole people."
      }
    ],
    "keep": {
      "what": "A Scroll Fragment",
      "sub": "Dry bones, coming back to life. It was kept under the synagogue floor."
    },
    "keepLine": "you watched the sun rise from masada and found a scroll full of hope. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to masada with people from your circle."
  },
  "prague": {
    "world": "prague",
    "guide": {
      "name": "Natalie Portman",
      "photo": "art/guides/judaism.webp",
      "door": "Judaism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "worried about what people are building",
        "r": "come with me. there's an old legend about someone who built something powerful, and had to be careful with it."
      },
      {
        "t": "wanting to protect my family",
        "r": "then i know a story for that. come with me."
      },
      {
        "t": "i love old legends",
        "r": "come with me. there's a synagogue in prague with one of the best."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Old-New Synagogue, Prague",
      "lat": 50.0903,
      "lon": 14.4187
    },
    "soon": [
      {
        "name": "Abraham's road, Haran",
        "lat": 36.864,
        "lon": 39.031
      },
      {
        "name": "Tzippori, home of the Mishnah",
        "lat": 32.753,
        "lon": 35.279
      }
    ],
    "region": "Central Europe",
    "flyName": "Prague",
    "where": "Old-New Synagogue · Prague, Czech Republic",
    "painting": "art/trip/prague.webp",
    "alt": "The medieval Old-New Synagogue in Prague's Jewish quarter on a misty autumn morning: steep brick gable, cobblestones, gas lamps and old trees",
    "teach": [
      "you made it. this is the old-new synagogue in prague. people have been praying here for more than seven hundred years, and it's one of the oldest in europe.",
      "a famous rabbi taught here, rabbi judah loew. a legend grew that he shaped a giant out of river clay, called the golem, to protect his people.",
      "the story says he put the hebrew word emet, truth, on its forehead. take away one letter, and it says met, dead.",
      "jewish teachers love that: truth is what gives life, and whatever power you make, you're responsible for how it's used.",
      "people say the golem still sleeps up in the attic. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what was the golem made of?",
        "options": [
          "river clay",
          "iron",
          "wood"
        ],
        "a": 0,
        "why": "the legend says rabbi loew shaped it out of clay from the river."
      },
      {
        "q": "what word was on its forehead?",
        "options": [
          "emet, truth",
          "shalom, peace",
          "chai, life"
        ],
        "a": 0,
        "why": "emet means truth. take away one letter, and it means dead."
      },
      {
        "q": "what's the lesson of the golem?",
        "options": [
          "power needs truth and care",
          "bigger is always better",
          "never build anything"
        ],
        "a": 0,
        "why": "whatever you make, you're responsible for how it's used."
      }
    ],
    "keep": {
      "what": "A Lump of River Clay",
      "sub": "Truth gives it life. Use your power with care."
    },
    "keepLine": "you stood outside the old-new synagogue, where the golem sleeps. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to prague with people from your circle."
  },
  "ur": {
    "world": "ur",
    "guide": {
      "name": "Natalie Portman",
      "photo": "art/guides/judaism.webp",
      "door": "Judaism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "a big move",
        "r": "then come with me. there's a road where the biggest move in the story started."
      },
      {
        "t": "feeling too old to start over",
        "r": "come with me. there's a man who set out on the journey of his life at seventy-five."
      },
      {
        "t": "not sure where i'm headed",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Abraham's road, Haran",
      "lat": 36.864,
      "lon": 39.031
    },
    "soon": [
      {
        "name": "Tzippori, home of the Mishnah",
        "lat": 32.753,
        "lon": 35.279
      },
      {
        "name": "The Western Wall at Shabbat's arrival",
        "lat": 31.7767,
        "lon": 35.2345
      }
    ],
    "region": "southeastern Turkey",
    "flyName": "Harran, on Abraham's road",
    "where": "Harran · Şanlıurfa, Turkey",
    "painting": "art/trip/ur.webp",
    "alt": "Beehive mud-brick houses of Harran on a wide plain at dawn, a well with a stone lip, camels resting, a dusty road into the distance under a vast sky with fading stars",
    "teach": [
      "you made it. this is harran, on a wide plain in southeastern turkey. those beehive houses are made of mud brick.",
      "the torah says abraham's family moved here from the city of ur. and here, god told abraham, \"go, to the land i will show you.\"",
      "he was already seventy-five. he packed up and went, without a map, trusting the voice.",
      "jews call that first step lech lecha, \"go for yourself.\" it wasn't only a trip to a new place, but toward who he was meant to be.",
      "later, his tent was famous for being open on all four sides, so any guest could find the way in. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what did god tell abraham here?",
        "options": [
          "go, to the land i will show you",
          "stay and build a city",
          "sail across the sea"
        ],
        "a": 0,
        "why": "abraham set out without a map, trusting the voice."
      },
      {
        "q": "how old was abraham when he set out?",
        "options": [
          "seventeen",
          "seventy-five",
          "a hundred and fifty"
        ],
        "a": 1,
        "why": "seventy-five. it's never too late to start the journey."
      },
      {
        "q": "why was his tent open on all four sides?",
        "options": [
          "so any guest could find the way in",
          "for the breeze",
          "to watch for storms"
        ],
        "a": 0,
        "why": "abraham is remembered for welcoming strangers from every direction."
      }
    ],
    "keep": {
      "what": "Abraham's Open Tent",
      "sub": "Open on all four sides, so any guest could find the way in."
    },
    "keepLine": "you stood on the road where abraham set out. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to harran with people from your circle."
  },
  "tzippori": {
    "world": "tzippori",
    "guide": {
      "name": "Natalie Portman",
      "photo": "art/guides/judaism.webp",
      "door": "Judaism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i lost something i built my life around",
        "r": "i'm sorry. come with me. there's a hill where people kept going after losing something huge."
      },
      {
        "t": "i love learning",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "remembering what my grandparents knew",
        "r": "come with me. there's a hill where someone wrote down what people had carried by heart."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Tzippori, home of the Mishnah",
      "lat": 32.753,
      "lon": 35.279
    },
    "soon": [
      {
        "name": "The Western Wall at Shabbat's arrival",
        "lat": 31.7767,
        "lon": 35.2345
      },
      {
        "name": "Safed in the Galilee hills",
        "lat": 32.9646,
        "lon": 35.496
      }
    ],
    "region": "the hills of Galilee",
    "flyName": "Tzippori",
    "where": "Tzippori · Galilee, Israel",
    "painting": "art/trip/tzippori.webp",
    "alt": "The ancient hilltop town of Tzippori in soft afternoon light: stone ruins, columns and a mosaic floor in the foreground, rolling green hills and fields beyond",
    "teach": [
      "you made it. this is tzippori, an ancient town on a hill in the galilee. look down: those floors are mosaics made of tiny stones.",
      "after the temple was destroyed, jewish life needed a new center. for years, the great council of rabbis met right here.",
      "around the year 200, rabbi judah the prince gathered the teachings people had passed down by heart, and wrote them down. it's called the mishnah.",
      "that's a big jewish idea: you can lose a building and still carry the teaching. study became a home you can take anywhere.",
      "jews still study it in pairs, arguing kindly over every line. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what did rabbi judah the prince write down here?",
        "options": [
          "the mishnah",
          "a map",
          "a song"
        ],
        "a": 0,
        "why": "he gathered the teachings people had carried by heart."
      },
      {
        "q": "what are the old floors here made of?",
        "options": [
          "tiny stones, in mosaics",
          "gold",
          "glass"
        ],
        "a": 0,
        "why": "tiny stones, set one by one into pictures."
      },
      {
        "q": "what did people carry when the temple was gone?",
        "options": [
          "the teaching",
          "the bricks",
          "a crown"
        ],
        "a": 0,
        "why": "the teaching went wherever they went."
      }
    ],
    "keep": {
      "what": "A Mosaic Stone",
      "sub": "One tiny piece of a bigger picture, like every line of the Mishnah."
    },
    "keepLine": "you stood where the mishnah was written down. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to tzippori with people from your circle."
  },
  "hira": {
    "world": "hira",
    "guide": {
      "name": "Mahershala Ali",
      "photo": "art/guides/islam.webp",
      "door": "Islam"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need some quiet",
        "r": "then come with me. there's a mountain where someone went to be alone with his thoughts."
      },
      {
        "t": "i want to learn more",
        "r": "come with me. there's a cave where the very first word was \"read.\""
      },
      {
        "t": "feeling overwhelmed",
        "r": "i hear you. come with me. there's a quiet cave up high, under a huge sky."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Jabal al-Nour, the Cave of Hira",
      "lat": 21.4575,
      "lon": 39.8611
    },
    "soon": [
      {
        "name": "The Prophet's Mosque, Medina",
        "lat": 24.4672,
        "lon": 39.6111
      },
      {
        "name": "Masjid al-Haram from above",
        "lat": 21.4225,
        "lon": 39.8262
      }
    ],
    "region": "the mountains of Mecca",
    "flyName": "the Mountain of Light",
    "where": "Jabal al-Nour · Mecca, Saudi Arabia",
    "painting": "art/trip/hira.webp",
    "alt": "The rocky mountain Jabal al-Nour at night, a narrow path of steps climbing toward a small cave near the summit, a huge starry sky, soft light glowing from the cave, distant city lights; no people",
    "teach": [
      "you made it. this is jabal al-nour, the mountain of light, in mecca. only muslims can visit mecca in person, so i'm glad i can show it to you this way.",
      "the prophet muhammad, peace be upon him, used to climb up to a small cave near the top, called hira, to be alone and think quietly about god.",
      "muslims believe that one night here, the angel jibril came to him with the first words of the quran: \"read, in the name of your lord.\"",
      "the very first word was read. that's why learning is sacred in islam: seeking knowledge is part of faith.",
      "the cave is tiny and the climb is steep, and pilgrims still make it to sit where it began. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what is the cave on this mountain called?",
        "options": [
          "hira",
          "the blue cave",
          "the lion's den"
        ],
        "a": 0,
        "why": "the cave of hira, near the top of the mountain of light."
      },
      {
        "q": "what was the first word revealed here?",
        "options": [
          "read",
          "sing",
          "run"
        ],
        "a": 0,
        "why": "\"read, in the name of your lord.\" it all began with read."
      },
      {
        "q": "why is learning sacred in islam?",
        "options": [
          "the first revelation began with \"read\"",
          "it makes you famous",
          "it's a school rule"
        ],
        "a": 0,
        "why": "seeking knowledge is part of faith, right from the very first word."
      }
    ],
    "keep": {
      "what": "The First Word",
      "sub": "Read. It came in a small cave on the mountain of light."
    },
    "keepLine": "you saw the mountain of light, where the first word came. tomorrow i'll take you somewhere new.",
    "real": "later: learn how pilgrims prepare for the journey, with people from your circle."
  },
  "medina": {
    "world": "medina",
    "guide": {
      "name": "Mahershala Ali",
      "photo": "art/guides/islam.webp",
      "door": "Islam"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i just moved somewhere new",
        "r": "then i know exactly where to take you. there's a city that welcomed newcomers like family."
      },
      {
        "t": "welcoming someone new",
        "r": "that's so kind of you. come with me, i'll show you the city that wrote the book on welcome."
      },
      {
        "t": "feeling homesick",
        "r": "i'm sorry, that's a lonely feeling. come with me. there's a city where people far from home found a new one."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "The Prophet's Mosque, Medina",
      "lat": 24.4672,
      "lon": 39.6111
    },
    "soon": [
      {
        "name": "Masjid al-Haram from above",
        "lat": 21.4225,
        "lon": 39.8262
      },
      {
        "name": "Al-Aqsa compound, Jerusalem",
        "lat": 31.778,
        "lon": 35.2354
      }
    ],
    "region": "western Saudi Arabia",
    "flyName": "Medina",
    "where": "The Prophet's Mosque · Medina, Saudi Arabia",
    "painting": "art/trip/medina.webp",
    "alt": "The Prophet's Mosque in Medina at dawn from a respectful distance: the green dome and tall minarets, white umbrella canopies over the marble courtyard, date palms, a soft pink sky",
    "teach": [
      "you made it. this is medina, and that's the prophet's mosque, with its green dome. its sacred heart is for muslims, so i'm glad i can show you from here.",
      "when the prophet muhammad, peace be upon him, and his followers had to leave mecca, the people of medina welcomed them in.",
      "the people of medina shared their homes, their food and their work with the newcomers. muslims still honor them as the ansar, the helpers.",
      "that journey, the hijra, is where the islamic calendar begins. a whole faith counts its years from a move to a city that said yes.",
      "the prophet is buried under that green dome, and visitors greet him with peace. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what did the people of medina do for the newcomers?",
        "options": [
          "shared their homes and food",
          "sent them away",
          "charged them rent"
        ],
        "a": 0,
        "why": "they made strangers into family."
      },
      {
        "q": "what are the helpers of medina called?",
        "options": [
          "the ansar",
          "the knights",
          "the elders"
        ],
        "a": 0,
        "why": "ansar means helpers, and muslims still honor them."
      },
      {
        "q": "what does the islamic calendar count from?",
        "options": [
          "the hijra, the move to medina",
          "a great flood",
          "a king's birthday"
        ],
        "a": 0,
        "why": "year one begins with the journey to medina."
      }
    ],
    "keep": {
      "what": "A Shared Date",
      "sub": "The helpers of Medina shared their homes and food with newcomers."
    },
    "keepLine": "you saw the city that welcomed the prophet home. tomorrow i'll take you somewhere new.",
    "real": "later: learn how pilgrims prepare for the journey, with people from your circle."
  },
  "mecca": {
    "world": "mecca",
    "guide": {
      "name": "Mahershala Ali",
      "photo": "art/guides/islam.webp",
      "door": "Islam"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want to understand my muslim friends",
        "r": "that's so kind of you. come with me, i'll show you the center of their world."
      },
      {
        "t": "wanting to feel like i belong",
        "r": "come with me. there's a place where everyone faces the same center, side by side."
      },
      {
        "t": "i want everyone treated equal",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Masjid al-Haram from above",
      "lat": 21.4225,
      "lon": 39.8262
    },
    "soon": [
      {
        "name": "Al-Aqsa compound, Jerusalem",
        "lat": 31.778,
        "lon": 35.2354
      },
      {
        "name": "Al-Qarawiyyin, Fez",
        "lat": 34.0646,
        "lon": -4.9737
      }
    ],
    "region": "western Saudi Arabia",
    "flyName": "Mecca",
    "where": "Masjid al-Haram · Mecca, Saudi Arabia",
    "painting": "art/trip/mecca.webp",
    "alt": "A distant elevated view of the Masjid al-Haram at night, the Kaaba small and dark at the center of a softly glowing white courtyard, pilgrims as tiny points of light, minarets around; no faces",
    "teach": [
      "you made it. this is the sacred mosque in mecca, seen from far above. only muslims can go in person, so this is a quiet way for you to see it.",
      "the prophet muhammad, peace be upon him, was born in this city. in the middle is the kaaba, and muslims believe ibrahim and his son ismail built it to honor the one god.",
      "wherever muslims are in the world, they turn toward this spot to pray. picture circles of people, all over the earth, facing one center.",
      "pilgrims walk around the kaaba seven times, side by side. rich or poor, in the same simple clothes, everyone stands equal before god.",
      "making the hajj here is the journey of a lifetime for many muslims. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what is the cube at the center called?",
        "options": [
          "the kaaba",
          "the minaret",
          "the dome"
        ],
        "a": 0,
        "why": "the kaaba, draped in black, at the heart of the sacred mosque."
      },
      {
        "q": "who do muslims believe built it?",
        "options": [
          "ibrahim and his son ismail",
          "a roman emperor",
          "a pharaoh"
        ],
        "a": 0,
        "why": "ibrahim and ismail built it to honor the one god."
      },
      {
        "q": "what do pilgrims do around the kaaba?",
        "options": [
          "walk around it seven times",
          "climb it",
          "paint it"
        ],
        "a": 0,
        "why": "seven times around, side by side, everyone equal."
      }
    ],
    "keep": {
      "what": "A Simple White Cloth",
      "sub": "Pilgrims dress simply so everyone stands equal before God."
    },
    "keepLine": "you saw the center that muslims everywhere turn toward. tomorrow i'll take you somewhere new.",
    "real": "later: learn how pilgrims prepare for the journey, with people from your circle."
  },
  "aqsa": {
    "world": "aqsa",
    "guide": {
      "name": "Mahershala Ali",
      "photo": "art/guides/islam.webp",
      "door": "Islam"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "feeling far from god",
        "r": "come with me. there's a place called the farthest, and a story that says no one is too far."
      },
      {
        "t": "going through a long night",
        "r": "i'm sorry it's been a long one. come with me. there's a story about one very special night."
      },
      {
        "t": "i want to understand islam better",
        "r": "that's a kind thing to want. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Al-Aqsa compound, Jerusalem",
      "lat": 31.778,
      "lon": 35.2354
    },
    "soon": [
      {
        "name": "Al-Qarawiyyin, Fez",
        "lat": 34.0646,
        "lon": -4.9737
      },
      {
        "name": "Mount Arafat",
        "lat": 21.3549,
        "lon": 39.9841
      }
    ],
    "region": "Jerusalem",
    "flyName": "al-Aqsa, in Jerusalem",
    "where": "Al-Aqsa · Jerusalem",
    "painting": "art/trip/aqsa.webp",
    "alt": "The wide stone courtyard of the al-Aqsa compound in Jerusalem at sunset: olive and cypress trees, stone arches, the golden Dome of the Rock glowing in the distance; no faces",
    "teach": [
      "you made it. this is the al-aqsa compound in jerusalem, and that golden dome is the dome of the rock.",
      "muslims honor al-aqsa as the third holiest place in islam. for a time, it was the direction muslims faced to pray, before mecca.",
      "the quran tells of a night journey: the prophet muhammad, peace be upon him, was carried in one night from mecca to here, to the farthest mosque.",
      "muslims believe that from here he rose through the heavens, and came back with the daily prayers, a way to come close to god wherever you are.",
      "al-aqsa means the farthest, and the story says even the farthest place isn't too far. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what does al-aqsa mean?",
        "options": [
          "the farthest",
          "the golden",
          "the oldest"
        ],
        "a": 0,
        "why": "the farthest mosque, from the story of the night journey."
      },
      {
        "q": "what came back from the night journey, muslims believe?",
        "options": [
          "the daily prayers",
          "a golden key",
          "a map"
        ],
        "a": 0,
        "why": "the daily prayers, a way to come close to god anywhere."
      },
      {
        "q": "which way did muslims first face to pray?",
        "options": [
          "toward jerusalem",
          "toward the sea",
          "toward the sunset"
        ],
        "a": 0,
        "why": "for a time they faced jerusalem, before turning toward mecca."
      }
    ],
    "keep": {
      "what": "A Lamp for the Night Journey",
      "sub": "One night, from Mecca to here, and up through the heavens."
    },
    "keepLine": "you stood at al-aqsa, the farthest mosque. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to jerusalem with people from your circle."
  },
  "qarawiyyin": {
    "world": "qarawiyyin",
    "guide": {
      "name": "Mahershala Ali",
      "photo": "art/guides/islam.webp",
      "door": "Islam"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "wanting to leave something good behind",
        "r": "then come with me. there's a gift a woman gave more than a thousand years ago that's still giving."
      },
      {
        "t": "i love learning",
        "r": "come with me. there's a place that's been teaching people for over a thousand years."
      },
      {
        "t": "thinking about what my parents gave me",
        "r": "that's a tender thing to think about. come with me. there's a woman who did something beautiful with what her father left her."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Al-Qarawiyyin, Fez",
      "lat": 34.0646,
      "lon": -4.9737
    },
    "soon": [
      {
        "name": "Mount Arafat",
        "lat": 21.3549,
        "lon": 39.9841
      },
      {
        "name": "Jabal al-Nour, the Cave of Hira",
        "lat": 21.4575,
        "lon": 39.8611
      }
    ],
    "region": "northern Morocco",
    "flyName": "Fez",
    "where": "Al-Qarawiyyin · Fez, Morocco",
    "painting": "art/trip/qarawiyyin.webp",
    "alt": "The courtyard of al-Qarawiyyin in Fez: green tiled roofs, a carved marble fountain, intricate zellige tiles and cedar woodwork, afternoon light through arches, books on a wooden stand",
    "teach": [
      "you made it. this is al-qarawiyyin in fez, morocco. it's a mosque and a place of learning, and many call it the oldest university still running in the world.",
      "it was founded around the year 859 by a woman named fatima al-fihri. she used what her father left her to build it.",
      "islam teaches sadaqa jariyah, a gift that keeps on giving. the prophet muhammad, peace be upon him, taught that useful knowledge you leave behind keeps doing good after you're gone.",
      "fatima's gift has been teaching people for more than a thousand years. that's what one generous choice can do.",
      "its library holds some of the oldest books in the muslim world. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who founded al-qarawiyyin?",
        "options": [
          "fatima al-fihri",
          "a sultan",
          "a sea trader"
        ],
        "a": 0,
        "why": "fatima al-fihri built it with what her father left her."
      },
      {
        "q": "what is sadaqa jariyah?",
        "options": [
          "a gift that keeps on giving",
          "a kind of bread",
          "a holiday"
        ],
        "a": 0,
        "why": "a good deed that keeps doing good, long after you're gone."
      },
      {
        "q": "what has it been doing for over a thousand years?",
        "options": [
          "teaching people",
          "selling spices",
          "guarding the city"
        ],
        "a": 0,
        "why": "fatima's gift is still teaching people today."
      }
    ],
    "keep": {
      "what": "Fatima's Library Key",
      "sub": "She turned what her father left her into a gift that still teaches."
    },
    "keepLine": "you stood in fatima's courtyard, where a gift is still giving. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to fez with people from your circle."
  },
  "arafat": {
    "world": "arafat",
    "guide": {
      "name": "Mahershala Ali",
      "photo": "art/guides/islam.webp",
      "door": "Islam"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need forgiveness",
        "r": "then come with me. there's a plain where people stand all afternoon asking for mercy."
      },
      {
        "t": "tired of people judging by skin color",
        "r": "come with me. there's a hill where the prophet said no race is better than another."
      },
      {
        "t": "i want a fresh start",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Mount Arafat",
      "lat": 21.3549,
      "lon": 39.9841
    },
    "soon": [
      {
        "name": "Jabal al-Nour, the Cave of Hira",
        "lat": 21.4575,
        "lon": 39.8611
      },
      {
        "name": "The Prophet's Mosque, Medina",
        "lat": 24.4672,
        "lon": 39.6111
      }
    ],
    "region": "the plain outside Mecca",
    "flyName": "Mount Arafat",
    "where": "Mount Arafat · near Mecca, Saudi Arabia",
    "painting": "art/trip/arafat.webp",
    "alt": "The granite hill of Mount Arafat in golden late afternoon, a white pillar on top, a vast plain of white tents, a few tiny distant figures in white; no faces",
    "teach": [
      "you made it. this is mount arafat, on a plain outside mecca. it's part of the hajj, so only muslims come here in person.",
      "people call this hill jabal al-rahmah, the mount of mercy. on one day of the hajj, pilgrims stand on this plain from noon until sunset, asking god for forgiveness.",
      "the prophet muhammad, peace be upon him, gave his farewell sermon here. he said no one is better than another because of race, only by goodness.",
      "muslims believe that day is full of mercy. many who aren't on the hajj fast that day at home.",
      "standing here is the heart of the hajj: you come as you are, and ask to begin again. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what do people call this hill?",
        "options": [
          "the mount of mercy",
          "the mount of gold",
          "the mount of kings"
        ],
        "a": 0,
        "why": "jabal al-rahmah, the mount of mercy."
      },
      {
        "q": "how long do pilgrims stand on the plain?",
        "options": [
          "noon until sunset",
          "a few minutes",
          "all week"
        ],
        "a": 0,
        "why": "they stand from noon until sunset, asking for mercy."
      },
      {
        "q": "what did the prophet's farewell sermon teach?",
        "options": [
          "no one is better because of race",
          "only the rich matter",
          "stay away from strangers"
        ],
        "a": 0,
        "why": "no one is better than another, except by goodness."
      }
    ],
    "keep": {
      "what": "The Farewell Words",
      "sub": "No one is better than another, except by goodness."
    },
    "keepLine": "you saw the mount of mercy, where people ask to begin again. tomorrow i'll take you somewhere new.",
    "real": "later: learn how pilgrims prepare for the journey, with people from your circle."
  },
  "bodh-gaya": {
    "world": "bodh-gaya",
    "guide": {
      "name": "Orlando Bloom",
      "photo": "art/guides/buddhism.webp",
      "door": "Buddhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i keep getting distracted",
        "r": "come with me. there's a tree where someone sat and didn't move until he understood."
      },
      {
        "t": "wondering why life hurts sometimes",
        "r": "i'm sorry it's been hurting. come with me. there's a tree where someone sat until he understood suffering."
      },
      {
        "t": "i want to wake up to my life",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "The Bodhi tree, Bodh Gaya",
      "lat": 24.6959,
      "lon": 84.9914
    },
    "soon": [
      {
        "name": "Deer Park, Sarnath",
        "lat": 25.38,
        "lon": 83.0242
      },
      {
        "name": "Lumbini, birthplace of the Buddha",
        "lat": 27.4697,
        "lon": 83.2756
      }
    ],
    "region": "Bihar, India",
    "flyName": "Bodh Gaya",
    "where": "Bodh Gaya · Bihar, India",
    "painting": "art/trip/bodh-gaya.webp",
    "alt": "The great Bodhi tree beside the tall Mahabodhi Temple at Bodh Gaya at dawn: prayer flags, butter lamps and lotus offerings on a stone platform, leaves drifting in golden light",
    "teach": [
      "you made it. this is bodh gaya, in india. that tree is the bodhi tree, and the tower beside it is the mahabodhi temple.",
      "about 2,500 years ago, a prince named siddhartha sat under a tree right here and decided not to get up until he understood why people suffer.",
      "the story says mara tried to scare him and tempt him away. siddhartha just touched the ground, as if to say, \"the earth is my witness.\"",
      "he woke up, which is what buddha means: the awakened one. he saw that suffering comes from clinging, and that it can end.",
      "this tree grew from the same tree's family, so people still sit in its shade. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what does buddha mean?",
        "options": [
          "the awakened one",
          "the strong one",
          "the king"
        ],
        "a": 0,
        "why": "buddha means the awakened one."
      },
      {
        "q": "what did siddhartha touch when mara tried to stop him?",
        "options": [
          "the earth",
          "the sky",
          "the river"
        ],
        "a": 0,
        "why": "he touched the ground: the earth is my witness."
      },
      {
        "q": "what did he see is behind suffering?",
        "options": [
          "clinging",
          "bad luck",
          "the weather"
        ],
        "a": 0,
        "why": "suffering comes from clinging, and he saw that it can end."
      }
    ],
    "keep": {
      "what": "A Bodhi Leaf",
      "sub": "Heart-shaped, from the tree where Siddhartha woke up."
    },
    "keepLine": "you sat under the bodhi tree, where the buddha woke up. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to bodh gaya with people from your circle."
  },
  "sarnath": {
    "world": "sarnath",
    "guide": {
      "name": "Orlando Bloom",
      "photo": "art/guides/buddhism.webp",
      "door": "Buddhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm too hard on myself",
        "r": "then come with me. there's a park where the buddha taught the middle way."
      },
      {
        "t": "reconnecting with old friends",
        "r": "come with me. there's a park where the buddha went to find his old friends."
      },
      {
        "t": "feeling burned out",
        "r": "i hear you. come with me. there's a quiet park with deer and a calm road in between."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Deer Park, Sarnath",
      "lat": 25.38,
      "lon": 83.0242
    },
    "soon": [
      {
        "name": "Lumbini, birthplace of the Buddha",
        "lat": 27.4697,
        "lon": 83.2756
      },
      {
        "name": "Vulture Peak, Rajgir",
        "lat": 25.0063,
        "lon": 85.4386
      }
    ],
    "region": "near Varanasi",
    "flyName": "Sarnath",
    "where": "Deer Park · Sarnath, India",
    "painting": "art/trip/sarnath.webp",
    "alt": "The Deer Park at Sarnath in morning light: the great round Dhamek Stupa, green lawns with spotted deer, old brick monastery ruins, a lotus pond",
    "teach": [
      "you made it. this is the deer park at sarnath, near varanasi. that big round stupa is the dhamek stupa.",
      "after he woke up under the bodhi tree, the buddha walked here to find five old friends who had practiced with him.",
      "here he gave his first teaching. buddhists call it turning the wheel of the dharma.",
      "he taught the middle way: not punishing yourself, and not chasing every pleasure. a calm road in between.",
      "he also named four noble truths about suffering and how it ends. the wheel you see in buddhist art started turning here. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who did the buddha teach here first?",
        "options": [
          "five old friends",
          "a king",
          "his parents"
        ],
        "a": 0,
        "why": "he came back to the five friends who had practiced with him."
      },
      {
        "q": "what is the middle way?",
        "options": [
          "not too hard on yourself, not too easy",
          "always the fastest road",
          "never leaving home"
        ],
        "a": 0,
        "why": "a calm road between punishing yourself and chasing every pleasure."
      },
      {
        "q": "what do buddhists call his first teaching?",
        "options": [
          "turning the wheel of the dharma",
          "the mountain song",
          "the deer's promise"
        ],
        "a": 0,
        "why": "the wheel of the dharma started turning right here."
      }
    ],
    "keep": {
      "what": "A Dharma Wheel",
      "sub": "It started turning here, with five friends in a deer park."
    },
    "keepLine": "you walked the deer park where the buddha first taught. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to sarnath with people from your circle."
  },
  "lumbini": {
    "world": "lumbini",
    "guide": {
      "name": "Orlando Bloom",
      "photo": "art/guides/buddhism.webp",
      "door": "Buddhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm having a baby",
        "r": "oh, congratulations! come with me. there's a garden where a very special baby was born."
      },
      {
        "t": "thinking about where i come from",
        "r": "come with me. there's a garden where one of the world's great stories began."
      },
      {
        "t": "wanting to begin again",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Lumbini, birthplace of the Buddha",
      "lat": 27.4697,
      "lon": 83.2756
    },
    "soon": [
      {
        "name": "Vulture Peak, Rajgir",
        "lat": 25.0063,
        "lon": 85.4386
      },
      {
        "name": "Ryoan-ji rock garden, Kyoto",
        "lat": 35.0345,
        "lon": 135.7182
      }
    ],
    "region": "southern Nepal",
    "flyName": "Lumbini",
    "where": "Lumbini · Lumbini Province, Nepal",
    "painting": "art/trip/lumbini.webp",
    "alt": "The sacred garden at Lumbini at sunrise: an ancient pool with steps, a huge bodhi tree hung with prayer flags, the white Maya Devi temple and an old stone pillar, morning mist",
    "teach": [
      "you made it. this is lumbini, in nepal. buddhists remember this garden as the place where siddhartha was born.",
      "his mother, queen maya, was traveling to her family's home when he was born here, in this garden.",
      "the old story says the baby took seven steps, and a lotus flower bloomed under each one.",
      "that stone pillar was put up by emperor ashoka more than two thousand years ago, to mark the spot.",
      "many buddhists teach that every person is born with the same seed of awakening he had. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who was siddhartha's mother?",
        "options": [
          "queen maya",
          "queen elena",
          "queen rosa"
        ],
        "a": 0,
        "why": "queen maya, on her way to her family's home."
      },
      {
        "q": "what bloomed under the baby's steps, in the story?",
        "options": [
          "lotus flowers",
          "roses",
          "sunflowers"
        ],
        "a": 0,
        "why": "a lotus under each of his first seven steps."
      },
      {
        "q": "who put up the stone pillar?",
        "options": [
          "emperor ashoka",
          "alexander the great",
          "a sailor"
        ],
        "a": 0,
        "why": "ashoka marked the spot more than two thousand years ago."
      }
    ],
    "keep": {
      "what": "A Lotus Flower",
      "sub": "One bloomed under each of his first seven steps."
    },
    "keepLine": "you stood in the garden where siddhartha was born. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to lumbini with people from your circle."
  },
  "vulture-peak": {
    "world": "vulture-peak",
    "guide": {
      "name": "Orlando Bloom",
      "photo": "art/guides/buddhism.webp",
      "door": "Buddhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm tired of talking",
        "r": "come with me. there's a hilltop where the best teaching had no words at all."
      },
      {
        "t": "nobody understands me",
        "r": "that's lonely, i'm sorry. come with me. there's a hilltop where one person understood without a single word."
      },
      {
        "t": "i need a quiet morning",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Vulture Peak, Rajgir",
      "lat": 25.0063,
      "lon": 85.4386
    },
    "soon": [
      {
        "name": "Ryoan-ji rock garden, Kyoto",
        "lat": 35.0345,
        "lon": 135.7182
      },
      {
        "name": "Shwedagon Pagoda at dusk",
        "lat": 16.7983,
        "lon": 96.1497
      }
    ],
    "region": "Bihar, India",
    "flyName": "Vulture Peak",
    "where": "Vulture Peak · Rajgir, India",
    "painting": "art/trip/vulture-peak.webp",
    "alt": "The rocky summit of Vulture Peak near Rajgir at dawn: a small brick platform with flowers and candles, boulders shaped like a bird, green hills fading into mist",
    "teach": [
      "you made it. this is vulture peak, above rajgir in india. see that big rock? people say it looks like a vulture folding its wings.",
      "the buddha loved this quiet hilltop. he stayed near here many times and taught his students on this little platform.",
      "a famous zen story says that once, instead of speaking, he simply held up a flower. only one student, mahakashyapa, understood, and smiled.",
      "it's a buddhist teaching: some of the deepest truths aren't in words. you see them when your mind is quiet.",
      "people still climb up at dawn to sit right where he sat. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what does the big rock look like?",
        "options": [
          "a vulture",
          "a lion",
          "a boat"
        ],
        "a": 0,
        "why": "a vulture folding its wings, which gave the peak its name."
      },
      {
        "q": "what did the buddha hold up in the zen story?",
        "options": [
          "a flower",
          "a bowl",
          "a stone"
        ],
        "a": 0,
        "why": "just a flower, and no words."
      },
      {
        "q": "what did mahakashyapa do?",
        "options": [
          "he smiled",
          "he left",
          "he wrote a book"
        ],
        "a": 0,
        "why": "he smiled, because he understood."
      }
    ],
    "keep": {
      "what": "The Held-Up Flower",
      "sub": "No words. One student smiled, and understood."
    },
    "keepLine": "you sat on vulture peak, where a flower said everything. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to vulture peak with people from your circle."
  },
  "ryoanji": {
    "world": "ryoanji",
    "guide": {
      "name": "Orlando Bloom",
      "photo": "art/guides/buddhism.webp",
      "door": "Buddhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i always want more",
        "r": "come with me. there's a garden where you can never see every stone, and that's okay."
      },
      {
        "t": "my mind is too busy",
        "r": "then i know where to take you. there's a garden made for a busy mind."
      },
      {
        "t": "i need things to make sense",
        "r": "come with me. there's a garden nobody fully understands, and people love it anyway."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Ryoan-ji rock garden, Kyoto",
      "lat": 35.0345,
      "lon": 135.7182
    },
    "soon": [
      {
        "name": "Shwedagon Pagoda at dusk",
        "lat": 16.7983,
        "lon": 96.1497
      },
      {
        "name": "The Bodhi tree, Bodh Gaya",
        "lat": 24.6959,
        "lon": 84.9914
      }
    ],
    "region": "Kyoto, Japan",
    "flyName": "Kyoto",
    "where": "Ryoan-ji · Kyoto, Japan",
    "painting": "art/trip/ryoanji.webp",
    "alt": "The Zen rock garden of Ryoan-ji in autumn: raked white gravel with fifteen mossy stones, an earthen wall, red maple leaves beyond, seen from the wooden veranda in morning light",
    "teach": [
      "you made it. this is ryoan-ji, a zen temple in kyoto, japan. that's the rock garden: white gravel raked like water, and fifteen stones.",
      "here's the thing: from anywhere on this porch, you can only see fourteen at once. one is always hidden.",
      "nobody knows for sure what the garden means, and that's kind of the point. zen asks you to just sit and look, without needing an answer.",
      "nearby is a stone water basin carved with a zen saying: \"i only know contentment.\"",
      "you don't need the fifteenth stone to be at peace. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "how many stones are in the garden?",
        "options": [
          "fifteen",
          "seven",
          "a hundred"
        ],
        "a": 0,
        "why": "fifteen stones, set in raked white gravel."
      },
      {
        "q": "how many can you see at once?",
        "options": [
          "all of them",
          "fourteen",
          "just one"
        ],
        "a": 1,
        "why": "fourteen. one is always hidden, wherever you sit."
      },
      {
        "q": "what's carved on the water basin?",
        "options": [
          "i only know contentment",
          "work harder",
          "you will win"
        ],
        "a": 0,
        "why": "contentment, right where you are."
      }
    ],
    "keep": {
      "what": "The Hidden Stone",
      "sub": "You can never see all fifteen at once, and that's okay."
    },
    "keepLine": "you sat on the porch at ryoan-ji, and let one stone stay hidden. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to kyoto with people from your circle."
  },
  "shwedagon": {
    "world": "shwedagon",
    "guide": {
      "name": "Orlando Bloom",
      "photo": "art/guides/buddhism.webp",
      "door": "Buddhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "my birthday is coming up",
        "r": "happy almost-birthday. come with me, there's a golden place with a corner just for the day you were born."
      },
      {
        "t": "i want to be more generous",
        "r": "come with me. there's a pagoda that started with two brothers sharing their food."
      },
      {
        "t": "i need something beautiful today",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Shwedagon Pagoda at dusk",
      "lat": 16.7983,
      "lon": 96.1497
    },
    "soon": [
      {
        "name": "The Bodhi tree, Bodh Gaya",
        "lat": 24.6959,
        "lon": 84.9914
      },
      {
        "name": "Deer Park, Sarnath",
        "lat": 25.38,
        "lon": 83.0242
      }
    ],
    "region": "Yangon, Myanmar",
    "flyName": "Yangon",
    "where": "Shwedagon Pagoda · Yangon, Myanmar",
    "painting": "art/trip/shwedagon.webp",
    "alt": "The golden Shwedagon Pagoda in Yangon at dusk: gleaming spires and smaller shrines on the marble platform, oil lamps and flowers, a purple sky, a few distant visitors",
    "teach": [
      "you made it. this is the shwedagon pagoda in yangon, myanmar, covered in real gold.",
      "the story goes that two merchant brothers met the buddha soon after he woke up, offered him food, and he gave them strands of his hair. this pagoda was built to hold them.",
      "people walk around it clockwise, barefoot on the marble. each corner has a day of the week, and you visit the one for the day you were born.",
      "there, people pour water over a small buddha statue, a way of wishing well for themselves and everyone. you can watch, learn, or join in if you want.",
      "for buddhists it's about generosity: two brothers shared a meal, and their gift became a light for a whole city. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what does the pagoda hold, the story says?",
        "options": [
          "strands of the buddha's hair",
          "a golden sword",
          "a king's crown"
        ],
        "a": 0,
        "why": "the merchant brothers brought them home, and the pagoda was built to hold them."
      },
      {
        "q": "which way do people walk around it?",
        "options": [
          "clockwise",
          "backward",
          "in a zigzag"
        ],
        "a": 0,
        "why": "clockwise, barefoot, all the way around."
      },
      {
        "q": "which corner do you visit?",
        "options": [
          "the one for the day you were born",
          "the shadiest one",
          "the tallest one"
        ],
        "a": 0,
        "why": "every day of the week has its own corner."
      }
    ],
    "keep": {
      "what": "Your Birthday Corner",
      "sub": "Every day of the week has its own corner at the Shwedagon."
    },
    "keepLine": "you walked the golden shwedagon, barefoot and clockwise. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to yangon with people from your circle."
  },
  "harmandir": {
    "world": "harmandir",
    "guide": {
      "name": "Diljit Dosanjh",
      "photo": "art/guides/sikhism.webp",
      "door": "Sikhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want to help people",
        "r": "then come with me. there's a kitchen where everyone serves and everyone eats."
      },
      {
        "t": "feeling like i don't belong",
        "r": "come with me. there's a temple with a door on every side."
      },
      {
        "t": "i need some peace and quiet",
        "r": "i know just the hour for it. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Harmandir Sahib at amrit vela",
      "lat": 31.62,
      "lon": 74.8765
    },
    "soon": [
      {
        "name": "Hemkund Sahib",
        "lat": 30.698,
        "lon": 79.6189
      },
      {
        "name": "Nankana Sahib",
        "lat": 31.45,
        "lon": 73.706
      }
    ],
    "region": "Punjab, India",
    "flyName": "Amritsar",
    "where": "Sri Harmandir Sahib · Amritsar, India",
    "painting": "art/trip/harmandir.webp",
    "alt": "Sri Harmandir Sahib, the Golden Temple, before dawn: the golden temple glowing and reflected in the still sacred pool, white marble walkway, soft lamps, a few distant figures with covered heads",
    "teach": [
      "you made it. this is sri harmandir sahib in amritsar, the golden temple, in the quiet hours before dawn. sikhs call this time amrit vela.",
      "the city's name means pool of nectar, after this water. the temple sits low, so you step down to go in, a lesson in humility.",
      "it has four doors, one on each side, to say everyone is welcome from every direction, every faith and every background.",
      "sikhs teach seva, selfless service. in the langar, the free kitchen, volunteers cook every day and everyone sits on the floor together, as equals.",
      "all day, singers sing the words of the guru granth sahib. you can just listen, or join in if you want. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what does amritsar mean?",
        "options": [
          "pool of nectar",
          "city of gold",
          "river of light"
        ],
        "a": 0,
        "why": "the city is named for this sacred pool."
      },
      {
        "q": "why does the temple have four doors?",
        "options": [
          "everyone is welcome from every direction",
          "for the wind",
          "for four kings"
        ],
        "a": 0,
        "why": "every direction, every faith, every background."
      },
      {
        "q": "what is the langar?",
        "options": [
          "a free kitchen where everyone eats together",
          "a bell tower",
          "a market"
        ],
        "a": 0,
        "why": "everyone sits on the floor together and is served as an equal."
      }
    ],
    "keep": {
      "what": "A Bowl From the Langar",
      "sub": "Everyone sits on the floor together, as equals."
    },
    "keepLine": "you stood by the golden temple at amrit vela. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to amritsar with people from your circle."
  },
  "hemkund": {
    "world": "hemkund",
    "guide": {
      "name": "Diljit Dosanjh",
      "photo": "art/guides/sikhism.webp",
      "door": "Sikhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm climbing something hard right now",
        "r": "then come with me. there's a gurdwara at the top of a very steep trail."
      },
      {
        "t": "i want to remember what matters",
        "r": "come with me. there's a lake high in the snow, perfect for remembering."
      },
      {
        "t": "i love the mountains",
        "r": "then you're going to love this. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Hemkund Sahib",
      "lat": 30.698,
      "lon": 79.6189
    },
    "soon": [
      {
        "name": "Nankana Sahib",
        "lat": 31.45,
        "lon": 73.706
      },
      {
        "name": "Kartarpur Sahib",
        "lat": 32.088,
        "lon": 75.02
      }
    ],
    "region": "the high Himalaya",
    "flyName": "Hemkund Sahib",
    "where": "Hemkund Sahib · Uttarakhand, India",
    "painting": "art/trip/hemkund.webp",
    "alt": "Gurdwara Hemkund Sahib beside a glacial lake ringed by snow peaks in the Himalaya, early morning, the white gurdwara, wildflowers and flags on the rocks, cold clear light",
    "teach": [
      "you made it. this is hemkund sahib, a gurdwara beside a glacier lake high in the himalaya. it's only open in the warmer months, when the snow lets people through.",
      "hemkund means lake of snow. seven snowy peaks stand around it like a ring.",
      "guru gobind singh, the tenth sikh guru, wrote about meditating in an earlier life by a lake among seven snowy peaks. sikhs came to honor this as that place.",
      "for sikhs, the climb is a picture of the spiritual life: steady steps, remembering god's name the whole way up.",
      "people climb a long, steep trail from the valley to get here. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what does hemkund mean?",
        "options": [
          "lake of snow",
          "golden hill",
          "seven doors"
        ],
        "a": 0,
        "why": "hem is snow, kund is a lake."
      },
      {
        "q": "how many snowy peaks ring the lake?",
        "options": [
          "seven",
          "two",
          "twelve"
        ],
        "a": 0,
        "why": "seven peaks, like the ones guru gobind singh wrote about."
      },
      {
        "q": "which guru wrote about meditating by a lake like this?",
        "options": [
          "guru gobind singh",
          "guru nanak",
          "guru angad"
        ],
        "a": 0,
        "why": "the tenth guru wrote about it, and sikhs came to honor this lake."
      }
    ],
    "keep": {
      "what": "A Stone From the Lake Shore",
      "sub": "Steady steps, remembering God's name the whole way up."
    },
    "keepLine": "you made it all the way up to hemkund sahib. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to hemkund sahib with people from your circle."
  },
  "nankana": {
    "world": "nankana",
    "guide": {
      "name": "Diljit Dosanjh",
      "photo": "art/guides/sikhism.webp",
      "door": "Sikhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want to spend my money well",
        "r": "come with me. there's a boy who made the best deal of his life with twenty rupees."
      },
      {
        "t": "thinking about where i come from",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "i want to see the good in everyone",
        "r": "come with me. there's a village where someone taught that the same light is in every person."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Nankana Sahib",
      "lat": 31.45,
      "lon": 73.706
    },
    "soon": [
      {
        "name": "Kartarpur Sahib",
        "lat": 32.088,
        "lon": 75.02
      },
      {
        "name": "Takht Sri Kesgarh Sahib, Anandpur",
        "lat": 31.238,
        "lon": 76.497
      }
    ],
    "region": "Punjab, Pakistan",
    "flyName": "Nankana Sahib",
    "where": "Nankana Sahib · Punjab, Pakistan",
    "painting": "art/trip/nankana.webp",
    "alt": "Gurdwara Janam Asthan at Nankana Sahib at sunrise: white domes with gold tops, a sacred pool, green Punjab fields around, a Nishan Sahib flag on a tall pole",
    "teach": [
      "you made it. this is nankana sahib, in punjab, pakistan. sikhs honor this gurdwara as the place where guru nanak was born, in 1469.",
      "guru nanak was the first sikh guru. he grew up here and asked big questions from the time he was small.",
      "the story says his father gave him twenty rupees to make a good deal at the market. he spent it all feeding hungry people, and called it the truest deal there is.",
      "he taught ik onkar: there is one creator, and that light is in every single person.",
      "sikhs still travel here, across the border, to celebrate his birthday. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who was born here?",
        "options": [
          "guru nanak",
          "a king",
          "a merchant"
        ],
        "a": 0,
        "why": "guru nanak, the first sikh guru, was born here in 1469."
      },
      {
        "q": "what did young nanak do with his father's money?",
        "options": [
          "fed hungry people",
          "bought cloth",
          "saved it"
        ],
        "a": 0,
        "why": "he called it the truest deal there is."
      },
      {
        "q": "what does ik onkar mean?",
        "options": [
          "there is one creator",
          "one more time",
          "one big city"
        ],
        "a": 0,
        "why": "one creator, and that light is in everyone."
      }
    ],
    "keep": {
      "what": "Twenty Rupees",
      "sub": "Young Nanak spent them feeding hungry people and called it a true deal."
    },
    "keepLine": "you stood where guru nanak was born. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to nankana sahib with people from your circle."
  },
  "kartarpur": {
    "world": "kartarpur",
    "guide": {
      "name": "Diljit Dosanjh",
      "photo": "art/guides/sikhism.webp",
      "door": "Sikhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i'm tired of my job",
        "r": "then come with me. there's a field where someone showed that honest work can be holy."
      },
      {
        "t": "i want a simpler life",
        "r": "come with me. there's a farm by a river you'll love."
      },
      {
        "t": "i want to share more",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Kartarpur Sahib",
      "lat": 32.088,
      "lon": 75.02
    },
    "soon": [
      {
        "name": "Takht Sri Kesgarh Sahib, Anandpur",
        "lat": 31.238,
        "lon": 76.497
      },
      {
        "name": "The Kali Bein, Sultanpur Lodhi",
        "lat": 31.214,
        "lon": 75.195
      }
    ],
    "region": "Punjab, Pakistan",
    "flyName": "Kartarpur Sahib",
    "where": "Kartarpur Sahib · Punjab, Pakistan",
    "painting": "art/trip/kartarpur.webp",
    "alt": "Gurdwara Darbar Sahib Kartarpur among wide green and golden wheat fields at golden hour: a white gurdwara with domes, a plough and a water wheel, the Ravi river plain beyond",
    "teach": [
      "you made it. this is kartarpur sahib, in punjab, pakistan, near the ravi river.",
      "after years of traveling and teaching, guru nanak settled here and farmed these fields with his own hands for the rest of his life.",
      "the community here lived by three simple ideas: remember god, earn an honest living, and share what you have.",
      "for sikhs, that's the whole spiritual life, right inside ordinary work. a field can be holy.",
      "today a special corridor lets pilgrims from india cross the border to visit. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what did guru nanak do here?",
        "options": [
          "farmed the fields",
          "built a palace",
          "sailed ships"
        ],
        "a": 0,
        "why": "he farmed these fields with his own hands."
      },
      {
        "q": "what are the three simple ideas?",
        "options": [
          "remember god, work honestly, share",
          "eat, sleep, rest",
          "win, keep, hide"
        ],
        "a": 0,
        "why": "remember, work, share: the whole sikh way in three steps."
      },
      {
        "q": "which river runs near kartarpur?",
        "options": [
          "the ravi",
          "the nile",
          "the thames"
        ],
        "a": 0,
        "why": "the ravi, one of the rivers that gives punjab its name."
      }
    ],
    "keep": {
      "what": "A Handful of Wheat",
      "sub": "Remember God, work honestly, share what you have."
    },
    "keepLine": "you stood in guru nanak's fields at kartarpur. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to kartarpur sahib with people from your circle."
  },
  "anandpur": {
    "world": "anandpur",
    "guide": {
      "name": "Diljit Dosanjh",
      "photo": "art/guides/sikhism.webp",
      "door": "Sikhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want to stand up for something",
        "r": "then come with me. there's a hill where five people stood up."
      },
      {
        "t": "tired of people being ranked",
        "r": "come with me. there's a city where everyone got the same name."
      },
      {
        "t": "i want to know who i really am",
        "r": "then i know where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Takht Sri Kesgarh Sahib, Anandpur",
      "lat": 31.238,
      "lon": 76.497
    },
    "soon": [
      {
        "name": "The Kali Bein, Sultanpur Lodhi",
        "lat": 31.214,
        "lon": 75.195
      },
      {
        "name": "Harmandir Sahib at amrit vela",
        "lat": 31.62,
        "lon": 74.8765
      }
    ],
    "region": "the Shivalik hills",
    "flyName": "Anandpur Sahib",
    "where": "Takht Sri Kesgarh Sahib · Anandpur Sahib, India",
    "painting": "art/trip/anandpur.webp",
    "alt": "Takht Sri Kesgarh Sahib on a hill at sunrise: white domes and saffron Nishan Sahib flags, the Shivalik hills behind, a misty valley",
    "teach": [
      "you made it. this is anandpur sahib, in the shivalik hills of punjab. anandpur means city of bliss.",
      "on vaisakhi in 1699, guru gobind singh gathered a huge crowd here and asked who was ready to give everything for their faith. one by one, five people stood up.",
      "sikhs call them the panj pyare, the five beloved ones. they came from different castes and places, and they became the first of the khalsa.",
      "everyone who joined shared the same names: singh for men, kaur for women, so no one could be ranked by caste again.",
      "then the guru asked the five to initiate him too, so the teacher became a student. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what began here in 1699?",
        "options": [
          "the khalsa",
          "a great flood",
          "a king's reign"
        ],
        "a": 0,
        "why": "on vaisakhi in 1699, the khalsa began right here."
      },
      {
        "q": "what are the first five called?",
        "options": [
          "the panj pyare, the five beloved",
          "the five kings",
          "the five brothers"
        ],
        "a": 0,
        "why": "the five beloved ones, from different castes and places."
      },
      {
        "q": "why share the names singh and kaur?",
        "options": [
          "so no one is ranked by caste",
          "to sound brave",
          "for good luck"
        ],
        "a": 0,
        "why": "one family, one name, no ranking."
      }
    ],
    "keep": {
      "what": "The Shared Name",
      "sub": "Singh and Kaur, so no one could be ranked by caste again."
    },
    "keepLine": "you stood where the khalsa began. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to anandpur sahib with people from your circle."
  },
  "kali-bein": {
    "world": "kali-bein",
    "guide": {
      "name": "Diljit Dosanjh",
      "photo": "art/guides/sikhism.webp",
      "door": "Sikhism"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i feel divided from people",
        "r": "come with me. there's a little river where someone came out saying there are no labels."
      },
      {
        "t": "i want my work to mean something",
        "r": "then i know where to take you. there's a storekeeper you should meet."
      },
      {
        "t": "i need a fresh start",
        "r": "come with me. there's a river where a whole new path began."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "The Kali Bein, Sultanpur Lodhi",
      "lat": 31.214,
      "lon": 75.195
    },
    "soon": [
      {
        "name": "Harmandir Sahib at amrit vela",
        "lat": 31.62,
        "lon": 74.8765
      },
      {
        "name": "Hemkund Sahib",
        "lat": 30.698,
        "lon": 79.6189
      }
    ],
    "region": "Punjab, India",
    "flyName": "Sultanpur Lodhi",
    "where": "The Kali Bein · Sultanpur Lodhi, India",
    "painting": "art/trip/kali-bein.webp",
    "alt": "The quiet Kali Bein rivulet at Sultanpur Lodhi at dawn: reeds and old trees, a ber tree by the water, a small white gurdwara on the bank, mist on the water",
    "teach": [
      "you made it. this is the kali bein, a quiet little river at sultanpur lodhi in punjab, india.",
      "as a young man, guru nanak worked here as a storekeeper. the story goes that when he counted grain and reached thirteen, tera, which also means yours, he kept saying \"tera, tera,\" i'm yours.",
      "one morning he went into this river to bathe and didn't come out for three days. when he did, his first words were, \"there is no hindu, there is no muslim.\"",
      "sikhs understand it this way: look past the labels. there's one light in every person, and everyone belongs to it.",
      "that was the start of his teaching, and the start of the sikh path. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what job did guru nanak have here?",
        "options": [
          "storekeeper",
          "boat builder",
          "soldier"
        ],
        "a": 0,
        "why": "he kept the stores, and counted grain as a gift."
      },
      {
        "q": "what does tera mean?",
        "options": [
          "thirteen, and also yours",
          "goodbye",
          "river"
        ],
        "a": 0,
        "why": "thirteen, and yours. he kept saying it: i'm yours."
      },
      {
        "q": "what were his first words after the river?",
        "options": [
          "there is no hindu, there is no muslim",
          "follow me",
          "i will be king"
        ],
        "a": 0,
        "why": "look past the labels: one light in every person."
      }
    ],
    "keep": {
      "what": "Tera, Tera",
      "sub": "Thirteen, and also yours. He counted the grain as a gift."
    },
    "keepLine": "you stood by the river where the sikh path began. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to sultanpur lodhi with people from your circle."
  },
  "walden": {
    "world": "walden",
    "guide": {
      "name": "Justin Bieber",
      "photo": "art/guides/spiritual.webp",
      "door": "My own religion"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "my life feels too busy",
        "r": "then come with me. there's a pond where someone went to slow all the way down."
      },
      {
        "t": "i want to live more simply",
        "r": "come with me. there's a tiny cabin site you'll love."
      },
      {
        "t": "i miss being outside",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Walden Pond",
      "lat": 42.441,
      "lon": -71.341
    },
    "soon": [
      {
        "name": "Iona's north shore",
        "lat": 56.346,
        "lon": -6.396
      },
      {
        "name": "Machu Picchu at sunrise",
        "lat": -13.1631,
        "lon": -72.545
      }
    ],
    "region": "New England",
    "flyName": "Walden Pond",
    "where": "Walden Pond · Massachusetts, USA",
    "painting": "art/trip/walden.webp",
    "alt": "Walden Pond in an autumn morning: still clear water reflecting red and gold maples, a simple cabin site with a cairn of stones, a narrow path along the shore",
    "teach": [
      "you made it. this is walden pond in concord, massachusetts.",
      "in 1845, a writer named henry david thoreau built a tiny cabin by this water and lived here simply for about two years.",
      "he said he went to the woods to live deliberately, to find out what life really needs when you strip away the extra.",
      "he spent his days walking, watching the pond freeze and thaw, and paying attention. for him, close attention to nature was a way to touch something sacred.",
      "people still leave a stone on the pile by his cabin site. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who built a cabin here?",
        "options": [
          "henry david thoreau",
          "benjamin franklin",
          "mark twain"
        ],
        "a": 0,
        "why": "thoreau built it himself and lived here about two years."
      },
      {
        "q": "why did he go to the woods?",
        "options": [
          "to live deliberately",
          "to get rich",
          "to hide"
        ],
        "a": 0,
        "why": "he wanted to see what life really needs."
      },
      {
        "q": "what do visitors leave at his cabin site?",
        "options": [
          "a stone",
          "a coin",
          "a letter"
        ],
        "a": 0,
        "why": "a stone on the pile, one visitor at a time."
      }
    ],
    "keep": {
      "what": "A Stone for the Cairn",
      "sub": "Left by the cabin where Thoreau lived simply."
    },
    "keepLine": "you walked the shore of walden pond. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to walden pond with people from your circle."
  },
  "iona": {
    "world": "iona",
    "guide": {
      "name": "Justin Bieber",
      "photo": "art/guides/spiritual.webp",
      "door": "My own religion"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want to feel close to something bigger",
        "r": "then come with me. there's an island people call a thin place."
      },
      {
        "t": "i need to get away",
        "r": "come with me. there's a tiny island at the edge of scotland."
      },
      {
        "t": "searching for my own path",
        "r": "that's a brave thing to do. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Iona's north shore",
      "lat": 56.346,
      "lon": -6.396
    },
    "soon": [
      {
        "name": "Machu Picchu at sunrise",
        "lat": -13.1631,
        "lon": -72.545
      },
      {
        "name": "Northern Lights over Tromsø",
        "lat": 69.6492,
        "lon": 18.9553
      }
    ],
    "region": "the Scottish islands",
    "flyName": "the island of Iona",
    "where": "Iona · Inner Hebrides, Scotland",
    "painting": "art/trip/iona.webp",
    "alt": "The white sand north beach of Iona in soft morning light: turquoise water, green grass and rocks, the old abbey in the distance, gulls",
    "teach": [
      "you made it. this is the north shore of iona, a tiny island off the west coast of scotland.",
      "around the year 563, an irish monk named columba sailed here with a small band of companions and built a monastery. the abbey in the distance stands near where it was.",
      "for a long time, people have called iona a thin place, where the space between earth and heaven feels paper-thin.",
      "you don't have to believe anything in particular to feel it. it's the wind, the quiet, the sea. a thin place just asks you to notice.",
      "people of many faiths, and none, still come here to slow down. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who sailed here and built a monastery?",
        "options": [
          "columba, an irish monk",
          "a viking king",
          "a pirate"
        ],
        "a": 0,
        "why": "columba came from ireland around the year 563."
      },
      {
        "q": "what do people call iona?",
        "options": [
          "a thin place",
          "a lost island",
          "a fortress"
        ],
        "a": 0,
        "why": "a place where earth and heaven feel close."
      },
      {
        "q": "where is iona?",
        "options": [
          "off the west coast of scotland",
          "in the caribbean",
          "in the mediterranean"
        ],
        "a": 0,
        "why": "a tiny island off scotland's west coast."
      }
    ],
    "keep": {
      "what": "A Green Iona Pebble",
      "sub": "Small green stones wash up on the shore of a thin place."
    },
    "keepLine": "you stood on iona's shore, in a thin place. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the island of iona with people from your circle."
  },
  "machu-picchu": {
    "world": "machu-picchu",
    "guide": {
      "name": "Justin Bieber",
      "photo": "art/guides/spiritual.webp",
      "door": "My own religion"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i want to say thank you more",
        "r": "then come with me. there's a mountain where people give thanks to the earth itself."
      },
      {
        "t": "i feel cut off from nature",
        "r": "come with me. there's a city built to line up with the sun."
      },
      {
        "t": "i need a big view",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "Machu Picchu at sunrise",
      "lat": -13.1631,
      "lon": -72.545
    },
    "soon": [
      {
        "name": "Northern Lights over Tromsø",
        "lat": 69.6492,
        "lon": 18.9553
      },
      {
        "name": "Muir Woods",
        "lat": 37.897,
        "lon": -122.581
      }
    ],
    "region": "the Andes of Peru",
    "flyName": "Machu Picchu",
    "where": "Machu Picchu · Cusco, Peru",
    "painting": "art/trip/machu-picchu.webp",
    "alt": "Machu Picchu at sunrise from the Sun Gate: stone terraces and ruins on the ridge, the green peak of Huayna Picchu, clouds filling the valleys, a llama on a terrace",
    "teach": [
      "you made it. this is machu picchu, high in the andes of peru, seen from the sun gate.",
      "the inca built it in the 1400s, fitting giant stones together so tightly that many walls need no mortar at all.",
      "the inca honored the sun, inti, and pachamama, mother earth. parts of this city line up with the sun on the longest and shortest days of the year.",
      "andean people still live by ayni: what you receive, from the earth and from each other, you give back.",
      "people still leave small offerings of thanks to pachamama in these mountains. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "who built machu picchu?",
        "options": [
          "the inca",
          "the romans",
          "the vikings"
        ],
        "a": 0,
        "why": "the inca built it high in the andes in the 1400s."
      },
      {
        "q": "who is pachamama?",
        "options": [
          "mother earth",
          "a mountain king",
          "a river"
        ],
        "a": 0,
        "why": "pachamama is mother earth, honored with thanks."
      },
      {
        "q": "what is ayni?",
        "options": [
          "giving back what you receive",
          "climbing fast",
          "a kind of bread"
        ],
        "a": 0,
        "why": "what you receive, you give back."
      }
    ],
    "keep": {
      "what": "A Thank-You to Pachamama",
      "sub": "What you receive, you give back. That's ayni."
    },
    "keepLine": "you watched the sun rise over machu picchu. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to machu picchu with people from your circle."
  },
  "tromso": {
    "world": "tromso",
    "guide": {
      "name": "Justin Bieber",
      "photo": "art/guides/spiritual.webp",
      "door": "My own religion"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need some wonder",
        "r": "then come with me. the sky up north is putting on a show tonight."
      },
      {
        "t": "going through a dark season",
        "r": "i'm sorry it's been dark. there's a place where the sun stays down for weeks, and the sky still lights up. come with me."
      },
      {
        "t": "i want to be quiet for a while",
        "r": "come with me. there's a snowy fjord where everyone goes quiet."
      },
      {
        "t": "just curious",
        "r": "good. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Northern Lights over Tromsø",
      "lat": 69.6492,
      "lon": 18.9553
    },
    "soon": [
      {
        "name": "Muir Woods",
        "lat": 37.897,
        "lon": -122.581
      },
      {
        "name": "The Camino through Galicia",
        "lat": 42.88,
        "lon": -8
      }
    ],
    "region": "the Arctic",
    "flyName": "Tromsø",
    "where": "Tromsø · Northern Norway",
    "painting": "art/trip/tromso.webp",
    "alt": "Green and violet northern lights rippling over a snowy fjord near Tromsø: a frozen rocky shore, a small red cabin with a lit window, mountains and stars",
    "teach": [
      "you made it. this is a fjord near tromsø, in northern norway, far above the arctic circle.",
      "those ribbons of light are the northern lights. tiny bits from the sun hit the air high above and glow green and violet.",
      "the sámi, who have lived up here for a very long time, have their own old stories about the lights. many children were told to stay quiet and respectful under them.",
      "that's what awe is: something so big and beautiful that you go quiet without trying. on a path of your own, wonder is often where the sacred starts.",
      "in deep winter here, the sun doesn't rise for weeks, and people find light anyway. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what makes the northern lights?",
        "options": [
          "bits from the sun glowing in the air",
          "city lights",
          "the moon's reflection"
        ],
        "a": 0,
        "why": "tiny bits from the sun meet the air high above and glow."
      },
      {
        "q": "what were many sámi children told under the lights?",
        "options": [
          "stay quiet and respectful",
          "sing loudly",
          "run home"
        ],
        "a": 0,
        "why": "the lights were something to respect, not to shout at."
      },
      {
        "q": "what happens in tromsø's deep winter?",
        "options": [
          "the sun doesn't rise for weeks",
          "it never snows",
          "the days are extra long"
        ],
        "a": 0,
        "why": "weeks without sunrise, and still the sky lights up."
      }
    ],
    "keep": {
      "what": "A Ribbon of Green Light",
      "sub": "Something so beautiful you go quiet without trying."
    },
    "keepLine": "you stood under the northern lights. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to tromsø with people from your circle."
  },
  "muir-woods": {
    "world": "muir-woods",
    "guide": {
      "name": "Justin Bieber",
      "photo": "art/guides/spiritual.webp",
      "door": "My own religion"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need people to lean on",
        "r": "come with me. there's a forest where the trees hold each other up."
      },
      {
        "t": "missing someone who held my family together",
        "r": "i'm so sorry. there's a forest where, when an old tree falls, young ones grow in a circle around it. come walk there with me."
      },
      {
        "t": "i need to breathe",
        "r": "then i know exactly where to take you. come with me."
      },
      {
        "t": "just curious",
        "r": "i love that. curious is the best way to travel. come with me."
      }
    ],
    "dest": {
      "name": "Muir Woods",
      "lat": 37.897,
      "lon": -122.581
    },
    "soon": [
      {
        "name": "The Camino through Galicia",
        "lat": 42.88,
        "lon": -8
      },
      {
        "name": "Walden Pond",
        "lat": 42.441,
        "lon": -71.341
      }
    ],
    "region": "northern California",
    "flyName": "Muir Woods",
    "where": "Muir Woods · California, USA",
    "painting": "art/trip/muir-woods.webp",
    "alt": "A cathedral grove of giant redwoods in Muir Woods in morning fog: shafts of sunlight through the trees, ferns, a wooden boardwalk path and a creek",
    "teach": [
      "you made it. this is muir woods, just north of san francisco. some of these redwoods are more than a thousand years old.",
      "it's named for john muir, a naturalist who said the clearest way into the universe is through a forest wilderness.",
      "this part is called cathedral grove. people come here to be quiet, the way they would in a church.",
      "redwoods have shallow roots, but they reach out and tangle with each other underground, so the trees help hold each other up.",
      "and when an old tree falls, new ones often sprout in a circle around it, like a family. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "how old are some of these redwoods?",
        "options": [
          "more than a thousand years",
          "about ten years",
          "a hundred days"
        ],
        "a": 0,
        "why": "some have been standing here for more than a thousand years."
      },
      {
        "q": "how do redwoods stay standing?",
        "options": [
          "their roots tangle with each other",
          "they lean on rocks",
          "they have very deep roots"
        ],
        "a": 0,
        "why": "shallow roots, holding on to each other underground."
      },
      {
        "q": "what often grows when an old redwood falls?",
        "options": [
          "a circle of new trees",
          "nothing",
          "only mushrooms"
        ],
        "a": 0,
        "why": "young trees grow up in a circle, like a family."
      }
    ],
    "keep": {
      "what": "A Redwood Cone",
      "sub": "Small enough to hold, and it can start one of the tallest trees on earth."
    },
    "keepLine": "you walked through cathedral grove, where the trees hold each other up. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to muir woods with people from your circle."
  },
  "camino": {
    "world": "camino",
    "guide": {
      "name": "Justin Bieber",
      "photo": "art/guides/spiritual.webp",
      "door": "My own religion"
    },
    "askLine": "before today's class, can i ask you something? what's been on your mind lately?",
    "ask": [
      {
        "t": "i need to think something through",
        "r": "then come with me. there's a path people have walked for a thousand years to think."
      },
      {
        "t": "going through a big change",
        "r": "come with me. there's a road made for people in between one life and the next."
      },
      {
        "t": "i want to meet new people",
        "r": "then i know where to take you. on this path, strangers become friends fast."
      },
      {
        "t": "just curious",
        "r": "perfect. curious people make the best travelers. come with me."
      }
    ],
    "dest": {
      "name": "The Camino through Galicia",
      "lat": 42.88,
      "lon": -8
    },
    "soon": [
      {
        "name": "Walden Pond",
        "lat": 42.441,
        "lon": -71.341
      },
      {
        "name": "Iona's north shore",
        "lat": 56.346,
        "lon": -6.396
      }
    ],
    "region": "Galicia, Spain",
    "flyName": "the Camino in Galicia",
    "where": "The Camino · Galicia, Spain",
    "painting": "art/trip/camino.webp",
    "alt": "A stone path of the Camino de Santiago winding through green Galician countryside at dawn: a mossy granite waymarker with a scallop shell, oak trees, mist in the fields",
    "teach": [
      "you made it. this is the camino de santiago, winding through the green hills of galicia, in northwest spain.",
      "people have walked this way toward the city of santiago for more than a thousand years. some walk for faith, some for grief, some just to think.",
      "these stone markers with the scallop shell show the way, and many count down the kilometers left.",
      "walkers greet each other with \"buen camino,\" good way. on a path of your own, that's the teaching: you find it by walking it, and you don't walk it alone.",
      "to earn the pilgrim's certificate, you walk at least the last hundred kilometers. let's see what stuck."
    ],
    "film": null,
    "check": [
      {
        "q": "what do walkers say to each other?",
        "options": [
          "buen camino",
          "bon voyage",
          "good luck"
        ],
        "a": 0,
        "why": "buen camino: have a good way."
      },
      {
        "q": "what symbol is on the markers?",
        "options": [
          "a scallop shell",
          "a star",
          "an anchor"
        ],
        "a": 0,
        "why": "the scallop shell has marked this path for centuries."
      },
      {
        "q": "how far must you walk to earn the certificate?",
        "options": [
          "at least the last hundred kilometers",
          "just one mile",
          "all of spain"
        ],
        "a": 0,
        "why": "the last hundred kilometers, on foot."
      }
    ],
    "keep": {
      "what": "A Waymarker Shell",
      "sub": "Buen camino. You find the way by walking it."
    },
    "keepLine": "you walked a stretch of the camino today. tomorrow i'll take you somewhere new.",
    "real": "later: plan a real trip to the camino in galicia with people from your circle."
  }
});
