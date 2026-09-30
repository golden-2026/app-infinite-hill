// A word that slipped, asked again: "<word> — which line is it?", its own line among two other lines from the same
// door. Used inside a later lesson ("one from before") and by the review round. See lib/missed.ts for the schedule.
import { knownSoFar, wrongAnswers } from "@ih/content";
import { t } from "@/i18n";
import type { Card } from "@/lib/missed";

export type Recall = { prompt: string; options: string[]; answer: string; word: string; day: number };

/** The question for one card, or null when the door has too few lines yet to make two wrong answers. */
export function recallQuestion(card: Card, uptoDay: number, seed: number): Recall | null {
  const lines = knownSoFar(card.door, Math.max(uptoDay, card.day)).map((k) => k.carry);
  const wrong = wrongAnswers(card.carry, lines, { n: 2, level: 1, seed });
  if (wrong.length < 2) return null;
  const options = [card.carry, ...wrong];
  const turn = Math.abs(seed) % options.length; // the right line isn't always first
  return { prompt: t("session.recall.prompt", { word: card.word }), options: [...options.slice(turn), ...options.slice(0, turn)], answer: card.carry, word: card.word, day: card.day };
}
