# Week-1 film brief (one religion per writer)

Infinite Hill's lesson standard: every lesson opens with a ~40-50 second narrated story film (vertical 9:16),
then games, a word card and sources. Hindu week 1 is finished and is the model; see
`example-scripts-hindu.json` (the 6 narrations, days 2-7) and `example-cfg-hindu-day3.json` (one full film config).

Your job: write the 7 films for days 1-7 of ONE path, matching the lessons that already exist.

## Inputs
- Lessons: `C:/Users/shset/code/golden-app/.claude/worktrees/vibrant-lamport-71d977/prototypes/greybox/episodes/c/data/<door>/<1..7>.json`
  (fields: title, word, hookLine, hook, teach[{h,b}], carry, how, sources). Each film must teach THAT lesson's word/idea,
  agreeing with the lesson's teach and sources. Do not contradict the lesson.

## Each film's narration (the "script")
- 85-125 words, read by a cinematic narrator. Short punchy sentences. Plain words a 16-year-old gets.
- Shape: a REAL story from this tradition's own sources (scripture, tradition, history) told vividly
  -> a clear turn (the surprising moment) -> what this faith actually teaches, said plainly
  -> one line connecting it to a teen/young adult's life today. Not self-help, not a generic tip.
- The point must land. A first-time viewer must be able to say in one sentence what they learned.
- Stay inside this one faith (no comparing religions). Open to every school within it; don't take sides in its internal debates.
- No romance/flirting angle. No "sing along". Prayer/practice is always the viewer's choice; never tell them to pray.
- Never put invented words in God's mouth. Quote scripture only accurately (short), or paraphrase as "the Torah says", etc.
- Only real stories and real teachings. If a detail is legend rather than scripture, it's fine, but don't present legend as scripture.
- Every story beat must be paintable: the pictures will be painted and animated.

## Picture rules (very important)
- NEVER show the face of Jesus, the Prophet Muhammad or ANY prophet in Islam, or any Sikh Guru. Islam: no depiction of
  prophets at all (not even from behind or veiled); tell those stories through places, objects, light, hands of ordinary
  people, nature, or companions/ordinary believers seen from a distance. For Jesus: from behind, hands, distant figure, or
  the scene around him. Sikh Gurus: no figure at all; show the sangat, the langar, places, objects, light.
- Judaism: God never depicted. Avoid depicting Moses' face too; show from behind/at a distance.
- Buddhism: the Buddha may be shown as in traditional art, respectfully.
- No blood, no gore. No text in pictures.
- Last picture is always TODAY: real modern people of that faith (teens/young adults with family), warm, everyday, cool not corny.
- 6 pictures per film (7 allowed if the story needs it).

## Output: write ONE JSON file `C:/Users/shset/AppData/Local/Temp/claude/b7a33f8c5f710ca7/a620df6c-f8a6-408f-8012-5fb621146125/scratchpad/allfaiths/<door>.json`
```
{
 "door": "<door>",
 "characters": "one paragraph describing every recurring character's fixed look (age, hair, beard, clothes, colors) so the painter keeps them consistent across all 7 films",
 "films": {
  "1": {
   "story": "short name of the source story + where it comes from (e.g. 'Nicodemus at night, John 3')",
   "point": "one sentence: what the viewer learns",
   "script": "<narration>",
   "open": {"shot": <1-based picture index for the cold open>, "text": "<5-9 word shock hook, lowercase, with the one key word wrapped in *stars*>"},
   "q": "wait. *why?*   (2-3 word Finn reaction, lowercase, key word in *stars*)",
   "drop": "<exact first words of the phrase where the story turns; must be the START of a phrase in the script, i.e. right after a , . ? ! or ;>",
   "close": "<4-7 word closing line, lowercase, key words in *stars*>",
   "keywords": ["10-15 lowercase words from the script to highlight, most important first"],
   "beats": ["for each picture, a short exact substring of the script where that picture should START showing, in order; first is the script's opening words"],
   "pictures": ["Picture 1: <full painting brief for that beat: setting, who, action, light, framing>", "..."],
   "motion": ["for each picture, one sentence of camera + movement for a 5-second animation of it (what moves, how the camera moves); keep it physically simple and believable"]
  },
  "2": { ... }, ... "7": { ... }
 },
 "sources_check": ["for each day: the primary source(s) you relied on, e.g. 'Exodus 12; Mishnah Pesachim 10'"],
 "risks": ["anything a scholar should double-check"]
}
```
Validate the JSON parses (e.g. `node -e "JSON.parse(require('fs').readFileSync(path,'utf8'))"`). Check that each `drop`
really begins a phrase and each `beats` string really appears in the script, in order.
Reply with just: done, the file path, and the risks list.
