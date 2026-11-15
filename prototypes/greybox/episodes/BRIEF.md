# Overnight brief, Nov 6–7 2026: the new brand across episodes, app and site

The owner (Shaan, non-technical founder) is asleep, so don't ask questions; make sensible calls and write down what you
chose. Nothing gets deployed and nothing goes live. Publish nothing, push nothing.

## What we're building

The new direction: every lesson becomes a loud, culture-forward 5-minute **episode**. The reference is episode "A",
"the night out" (Prahlad/Holi). The engine is now `episodes/engine.html`, filled per episode by `episodes/build.mjs`
(it began as an overnight template in a temporary scratch folder that is no longer needed).

Root for all new work: `C:/Users/shset/code/golden-app/.claude/worktrees/vibrant-lamport-71d977/prototypes/greybox` (GB).
This folder is NOT in git, so back up any existing file before you edit it (`name.pre-brand.html`).

- 226 stories: `GB/lessons/<id>.json`. Each has:
  - `title`, `told`, and `home`, which is the faith home:
    - olive = Christian
    - rose = Catholic
    - lotus = Buddhist
    - marigold = Hindu
    - cedar = Jewish
    - crescent = Muslim
    - khanda = Sikh
    - wildwonder = my own religion
  - `clips`: the folder holding `<v>.mp4` and `<v>.webp`.
  - `voice`: either "" or a folder of narration mp3s; only 31 have one.
  - `hook`: the guide asks you a question, with options.
  - `steps`, of these kinds:
    - `shot`: `v` and a story `line`
    - `ask`: `q`, `o`, `a`, `why`
    - `teach`: `say` lines
    - `match`
    - `fill`
  - `today`: a modern-life action.
  - `tomorrow`: `title` and `line`.
  - `card.sources`.

**CORRECTION: the real `home` values are olive = Christian, angelus = Catholic, pomegranate = Jewish, datepalm = Muslim, marigold = Hindu, lotus = Buddhist, nectar = Sikh, wild = my own religion.** Library order: olive, angelus, pomegranate, datepalm, marigold, lotus, nectar, wild. Muslim (datepalm) episodes are drums-only.

## Brand (identical everywhere: site, app and episodes)

- **Fonts:** Anton for display, uppercase. Manrope for body (500/700/800). Google Fonts.
- **Colours:**
  - ink `#0A0A0A`, night `#070a14`, cream `#F3EFE4`
  - lime `#EEFF6A`: the brand colour, used for CTAs and the key word
  - accents: pink `#FF2D8A`, saffron `#FF8A1F`, green `#19E68C`, blue `#2F7BFF`, violet `#9B5CFF`
- **Look:** dark backgrounds, film grain on photos, and big, loud uppercase type.
- **No rainbow gradient text, ever.** One highlighted word is solid lime.
- **Mascot:** Finn, the approved art only, in `episodes/assets/finn-*.webp`. Finn says "i"; "we" means only the
  company.
- **Copy:** lowercase, punchy and current, warm first, never corny, never flat.
  - Tagline: "religion, reimagined."
  - Headline: "because you gotta have faith."
  - Line: "understand yourself. understand each other. pick a faith or build your own faith, with celebrity guides and
    voices you know."
- **Never:**
  - "draft", "review pending" or "signed"
  - daily AI limits
  - invented numbers or testimonials
  - "famous" (say "celebrity")
  - asking anyone to sing
  - saying the hill never ends
- **Prayer** is always a choice.
- **Faith images:** no faces of Jesus, prophets or Sikh Gurus, and no people in Islamic scenes (the existing art already
  follows this).
- **Crisis words** get 988 (US) or local emergency help.

## The episode contract (engine, writers and app all rely on this)

- Each episode is built at `GB/episodes/<id>/index.html`. It's a standalone page, so it needs its own doctype.
- It loads media straight from the lesson's clip folder via relative paths (`../../art/sacred/...`). Don't copy any
  media.
- Library page: `GB/episodes/index.html`.
- When an episode finishes, the end card has a lime "head home" button linking to `../../hill-app.html?done=<id>`. The
  app gives the stamp and streak for `done`.
- Writer configs go in `GB/episodes/configs/<id>.json`, using this schema (all strings lowercase unless noted):

```json
{
  "id": "bud-alms",
  "open": ["a prince", "came home", "with a begging bowl."],
  "open2": ["his dad", "was not", "ok."],
  "hint": "tap anywhere to toss rice",
  "particle": "petals|sparks|waves|stars|lanterns|confetti|embers|snow|leaves|bubbles|rice|light",
  "energy": "hype|warm|eerie|triumphant|tender|epic|playful|mystic",
  "hot": { "0": { "bowl": "y" }, "2": { "window": "p" } },
  "drop": 3,
  "game": { "ask": 0, "q": "the king calls it begging. what does the buddha <span class=\"o\">say back?</span>",
            "opts": [["feed", "“feed us and we’ll stop”"], ["yes", "“your line is royal. mine is the buddhas’.”"], ["gym", "“it’s cardio, dad”"]],
            "wrong": { "feed": "close, but he wasn’t bargaining.", "gym": "honestly iconic. still no." },
            "right": "YES. he’d changed families. the bowl was his family custom now." },
  "teachH": "give <em>first.</em>",
  "end": { "h": ["give", "it", "first."], "line": "a prince came home with a bowl, and his father learned to give.",
           "l1": "a prince came home with a bowl.", "l2": "his father learned to give." },
  "cliff": { "s1": "short line 1", "s2": "short line 2 with one <i>italic</i> twist", "tmr": "tomorrow: two streams of water." },
  "share": "a prince came home with a begging bowl. the story on infinite hill"
}
```

Rules for writers:
- **Use only facts already in the lesson.** Add no new religious claims and no new quotes. Keep the lesson's own
  "as tradition tells it" style hedges where it uses them.
- **`hot` keys are shot indexes** (0-based, counting only `shot` steps). Each word must appear exactly as written in
  that shot's line (lowercase match). Pick 1–3 words per shot at most, and skip some shots.
- **`drop`** is the shot index of the story's big turn.
- **`game`** turns one of the lesson's `ask` steps (its index among asks) into a fun version:
  - The right answer must mean the same thing as the lesson's correct option, with the key "yes".
  - Two playful wrong answers. Joke about the situation or ourselves, **never about God, Jesus, Mary, a prophet, the
    Buddha, a Guru or anyone's faith**.
  - For Muslim (crescent) and Sikh (khanda) stories, keep the wrong answers gentle and plainly respectful.
- **`end.h`** is exactly 3 words, each ≤ 9 characters.
- **`cliff`** comes from `tomorrow` (`tmr` = "tomorrow: " + tomorrow.title lowercased).
- **Make each episode feel different.** Vary the `open` rhythm, the particle, the energy and the jokes, and repeat no
  joke across episodes.
- **Christian-first and one faith only.** Never compare faiths inside an episode.

## Owner direction added overnight (binding)
- "Everything we do now is going to be loud and have some shock value, like the way Magna does things. They're super on trend."
- What that means in practice:
  - **Type:** huge confident type, and short punchy lines that stop the scroll.
  - **Openers:** unexpected, cheeky hooks (e.g. "a robber asked his family one question.").
  - **Pace and motion:** bold colour blocks, fast cuts, kinetic type, drops.
  - **Tone:** streetwear and drop-culture energy.
- Shock comes from surprise and confidence. It never mocks a faith, its holy figures or its people, and is never crude.
- The whole product must feel like one loud brand: the website, the hill app, the main Expo app and every lesson.
- Owner, later: "follow everything they do." **Magna's playbook, to borrow closely:**
  - **One ownable colour:** lime + black everywhere. The chunky wordmark doubles as a graphic.
  - **Photos:** grainy film photos of real-looking people.
  - **A recurring series template** (Magna's "THE LONG GAME with [name]", with location/craft/date lines). For us, e.g. "THE LONG GAME" story cards per faith.
  - **A manifesto of short vs long pairs** (Magna: "life is short / life is long", "burn out / burn bright"). Ours could be "scroll / stay", "react / respond".
  - **Limited "drops":** each with its own retro type treatment and name (lesson weeks or seasons as drops).
  - **Playful puns,** never mocking.
  - **IRL community nights.**
  - **A short homepage:** hero + one line + CTA → drops row → proof → 4 benefits → 3 big stats (real only) → reviews (real only) → community → FAQ.
- Not approved yet: "my mind is a temple" (don't use).
- Owner (2026-11-07): "Make sure all the videos are disruptive and dope / fire." Every film and clip must stop the scroll: bold camera, epic elemental motion, music-video energy. Reverent subjects stay reverent.
