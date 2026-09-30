# Brief — writing a path's five-year plan (DRAFT, Keeper review pending)

You are writing one path's complete five-year daily curriculum outline for Infinite Hill, a daily practice app: a few minutes a day, one short lesson — a story or idea, a small practice, and one line to carry. Camp 1 (days 1–21) is already written for every path; you write **days 22 through 1791**, one session per day, no gaps, no repeats.

## Read first
- `docs/curriculum/golden_hinduism_year1_camps2-5.md` and `golden_hinduism_years2-5.md` — the owner's own Hinduism plan. **Match its voice, pacing, rigor and structure.** Note how it serializes stories, lets texts be read in order, spaces "words", keeps practices tiny and concrete, and writes carries as short lowercase lines.
- Your path's Camp 1 (to continue from it): run from the repo root
  `node -e "import('./packages/content/src/index.js').then(m=>console.log(JSON.stringify(m.camp1('DOOR').map(d=>({day:d.day,title:d.title,word:d.word,carry:d.carry})),null,1)))"` (replace DOOR).
- Your path's existing camp 2–5 topics (given in your task) — honor them as the spine of year one.

## The shape of five years (same for every path)
- **Year one = five camps** (days 1–331): Camp 1 First steps 1–21 (done) · **Camp 2 The stories 22–96** · **Camp 3 The practices 97–156** · **Camp 4 The text 157–231** · **Camp 5 The depths 232–331**. Day 331 closes year one ("the big lookout").
- **Years two to five = "the ranges"**, 365 days each: year 2 = 332–696, year 3 = 697–1061, year 4 = 1062–1426, year 5 = 1427–1791. Day 1791 is the summit. Give each year a theme and 3–6 blocks; end each camp and each year with a close session.
- Go deeper each year: year 2 the core texts read in order; year 3 the big narratives, history and saints/teachers; year 4 the schools, thought and practice traditions (explained without ranking); year 5 reading primary sources and living it. Adapt to what's true for the tradition.
- The festival/holy-day calendar should appear in sessions (e.g. "Ramadan: …", "Passover: …") as normal numbered days — never as placeholder text.

## Exact format (a script reads it — follow precisely)
Write five files in `docs/curriculum/<door-lowercase>/`: `y1.md` (days 22–331), `y2.md` (332–696), `y3.md` (697–1061), `y4.md` (1062–1426), `y5.md` (1427–1791).
- Headings: `# ` camp or year (e.g. `# CAMP 2 · THE STORIES (Days 22–96)`, `# YEAR THREE — "…"`), `## ` week or block, `### ` optional sub-part. Short italic notes under headings are fine.
- **Every day is its own line**, numbered, nothing else on the line:
  `22. **title** · word · hook · practice · *carry*`
  - title: 2–8 words. word: one term people learn that day (in the tradition's language where natural, else English), or `—` (most days `—`; a word every 2–3 days is right). hook: one sentence — the story beat or idea. practice: one tiny concrete thing (under 12 words). carry: the line to take into the day, lowercase, under 9 words, wrapped in single `*`.
  - Separator is exactly ` · ` (space, middle dot, space). Never use ` · ` inside a field.
- Top of y1.md: a one-line note: `*DRAFT — written for Keeper review. Sources: …*` naming the public-domain translations you draw on.

## Rules
- Accurate and respectful. Follow mainstream scholarship and the tradition's own self-understanding; where traditions within the path differ, say "Catholics say… Protestants say…" style, never rank. No invented quotations; paraphrase, and cite chapter/verse or section in the title or hook where you draw on a text (e.g. "(Mark 4:35–41)", "(Surah 12)", "(Dhammapada 1)").
- Public-domain translations only for anything quoted (e.g. KJV/Douay-Rheims/JPS 1917/Pickthall 1930 for the Qur'an (not Yusuf Ali 1934, which stays under US copyright until 2030)/Max Müller or Rhys Davids/Macauliffe 1909 only for Sikh scripture (Gopal Singh and Manmohan Singh are not public domain)/Long for Marcus Aurelius; never Coleman Barks for Rumi…).
- Never pushy, never compares religions, never tells people what to believe; practices are invitations. Keep sensitive history (e.g. 1984 for Sikhs, the Holocaust, colonialism) honest and careful.
- Simply Spiritual (SPIRITUAL) draws from every tradition and from Stoics/science, always tagged with its source, never blended into one teaching; its year five should include the "summit" framing of living it.

## Check your work
From the repo root run `node packages/content/scripts/import-paths.mjs DOOR --check` (DOOR in capitals). It must say `1770 sessions, none missing` with nothing "without a title or carry" and no "listed twice". Fix and re-run until clean. Write files in chunks with the Write tool (a file per year; a year can be written in 2–3 Write calls by appending with Edit if long). Do not edit any other files, don't commit, don't deploy.

## Final report (plain English, owner is non-technical, under 120 words)
The shape of the five years for your path, 2–3 highlights, anything you weren't sure about that a Keeper should decide.
