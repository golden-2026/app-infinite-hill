import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { checkDir, checkLesson } from "../../scripts/check-story-questions.mjs";

const DIR = fileURLToPath(new URL("../../prototypes/greybox/lessons/", import.meta.url));

test("the checker catches a gimme fill-in, an echo and a lopsided answer", () => {
  const bad = {
    steps: [
      { t: "shot", line: "He was starving and had nothing left." },
      { t: "ask", q: "Why does he go home?", o: ["He was starving and had nothing left", "He missed home", "A letter"], a: 0, why: "He came to himself when he had nothing left at all." },
      { t: "fill", pre: "He was lost, and is", o: ["found", "home", "back"], a: 0, why: "Short." },
      { t: "ask", q: "Who?", o: ["A", "B", "The one person in the whole village who had stayed behind to wait"], a: 2, why: "Because the story says so, in more than thirty characters." },
    ],
  };
  const p = checkLesson(bad).join("\n");
  assert.match(p, /no 'what happens next\?' question/);
  assert.match(p, /answer was just on screen/);
  assert.match(p, /gimme fill-in/);
  assert.match(p, /'why' is missing or too thin/);
  assert.match(p, /much longer than the others/);
});

test("the checker catches a question with no text and a guess the title gives away", () => {
  const L = {
    title: "He climbs a sycamore tree",
    steps: [
      { t: "ask", eb: "what happens next?", predict: true, q: "What does he do?", o: ["Climbs a sycamore tree", "Waits at home", "Sends a servant"], a: 0, why: "He was short, so he climbed a sycamore to see over the crowd." },
      { t: "ask", eb: "why?", o: ["One", "Two", "Three"], a: 1, why: "A long enough explanation to pass the thin-why check." },
    ],
  };
  const p = checkLesson(L).join("\n");
  assert.match(p, /title gives the answer away/);
  assert.match(p, /question text is missing/);
});

test("story lessons follow the question rules", { skip: !fs.existsSync(DIR) && "story lessons not in this checkout" }, () => {
  assert.deepEqual(checkDir(DIR), {});
});
