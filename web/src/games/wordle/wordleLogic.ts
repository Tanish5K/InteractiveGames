export type LetterStatus = "correct" | "present" | "absent" | "empty";

//Small list of answers (also the only valid guesses)
const WORD_LIST = [
  "APPLE",
  "BRAVE",
  "CRANE",
  "DOUBT",
  "EAGLE",
  "FAITH",
  "GRAPE",
  "HOUSE",
  "IVORY",
  "JOKER",
  "KNEEL",
  "LEMON",
  "MANGO",
  "NIGHT",
  "OCEAN",
  "PEARL",
  "QUIET",
  "RIVER",
  "STONE",
  "TIGER",
];

export function pickAnswer(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

export function isValidGuess(word: string): boolean {
  return WORD_LIST.includes(word.toUpperCase());
}

export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const result: LetterStatus[] = new Array(guess.length).fill("absent");
  const answerLetters = answer.split("");
  const used = new Array(answer.length).fill(false);

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const idx = answerLetters.findIndex((l, j) => l === guess[i] && !used[j]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }
  return result;
}
