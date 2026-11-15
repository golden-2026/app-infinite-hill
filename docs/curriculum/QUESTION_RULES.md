# Question rules

Every question in a lesson has to earn its place: it should surprise, make you think, or make you feel something.
A question that anyone could answer without understanding the story is a bad question, however short the lesson.
These rules cover the playable story lessons (`prototypes/greybox/lessons/*.json`) and the games in the daily lessons
(`docs/curriculum/<door>/scripts/`, `apps/app/public/lessons/`). `scripts/check-story-questions.mjs` checks the parts a
machine can check; the rest is for the writer and the reviewer.

## Keep

- **What happens next?** Stop the story at a turn and let the player guess. The wrong options are what most people
  would expect; the right one is what the story actually does. This is the main game. Every story has one or two.
- **The surprise.** A real fact from the tradition that changes how you see the scene: a law, a custom, what a word
  meant, what the first listeners would have felt. ("Jesus's listeners would have winced at the pigs. Why?")
- **Why did they do that?** A character's choice, where the answer needs the meaning, not the plot.
- **The hard one.** What the tradition itself takes from the story, or who it was told for. Near the end.
- **You're in it.** Put the player in the character's place at the moment of choice, then reveal what they did.

## Cut

- **Gimmes.** A fill-in-the-blank whose answer is the obvious next word ("he was lost, and is ___" → found), or any
  question a stranger could answer from the wording alone.
- **Echoes.** Anything the story said on the screen just before ("What makes him go home?" right after "he was
  starving").
- **Memory drills.** Matching that only re-pairs things the story just listed, word lists, vocabulary for its own
  sake.
- **Joke or straw options.** Every wrong option must be something a thoughtful person might pick. No silly answers,
  and the right answer must not be the longest or most careful-sounding one.
- **Lectures.** The question isn't a vehicle for a sermon; the "why" after it can teach, in one or two sentences.

## Craft

- Three options, all plausible, similar length. The right answer is not always in the same position.
- The "why" adds something new (a fact, a source, what it meant then), never just "correct!". One or two sentences.
- Fill-in and matching are allowed only when they pass the rules above: the blank is a word the player would not
  guess without the meaning, the pairs need understanding to match.
- Accurate to the tradition and its sources. Where readers disagree, say so ("many readers hear it as…").
- The guide's voice: warm, plain, a little playful. Never preachy, never corny, never "great job!" filler.
- Prayer and practice are always a choice. Never quiz faith or belief; quiz understanding.
