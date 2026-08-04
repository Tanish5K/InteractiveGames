import { useEffect, useState } from "react";
import {
  pickAnswer,
  isValidGuess,
  evaluateGuess,
  type LetterStatus,
} from "../games/wordle/wordleLogic";
import { GlassPanel } from "../ui/GlassPanel";
import { GlassButton } from "../ui/GlassButton";

const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const STATUS_COLOR: Record<LetterStatus, string> = {
  correct: "bg-emerald-500/70 border-emerald-400",
  present: "bg-amber-400/60 border-amber-300",
  absent: "bg-white/10 border-white/20",
  empty: "bg-white/5 border-white/20",
};
const STATUS_PRIORITY: Record<LetterStatus, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

interface Props {
  onBack: () => void;
}

export function WordleGame({ onBack }: Props) {
  const [answer, setAnswer] = useState(() => pickAnswer());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<Record<string, LetterStatus>>({});

  function handleLetter(letter: string) {
    if (status !== "playing" || currentGuess.length >= WORD_LENGTH) return;
    setCurrentGuess((g) => g + letter);
    setMessage(null);
  }

  function handleBackspace() {
    if (status !== "playing") return;
    setCurrentGuess((g) => g.slice(0, -1));
  }

  function handleEnter() {
    if (status !== "playing") return;
    if (currentGuess.length !== WORD_LENGTH)
      return setMessage("Not enough letters");
    if (!isValidGuess(currentGuess)) return setMessage("Not in word list");

    const result = evaluateGuess(currentGuess, answer);
    setKeyStatus((prev) => {
      const next = { ...prev };
      currentGuess.split("").forEach((letter, i) => {
        if (
          STATUS_PRIORITY[result[i]] > STATUS_PRIORITY[next[letter] ?? "empty"]
        )
          next[letter] = result[i];
      });
      return next;
    });

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    if (currentGuess === answer) setStatus("won");
    else if (newGuesses.length >= MAX_GUESSES) setStatus("lost");
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (status !== "playing") return;
      if (e.key === "Enter") return handleEnter();
      if (e.key === "Backspace") {
        e.preventDefault();
        return handleBackspace();
      }
      if (/^[a-zA-Z]$/.test(e.key)) handleLetter(e.key.toUpperCase());
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function restart() {
    setAnswer(pickAnswer());
    setGuesses([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage(null);
    setKeyStatus({});
  }

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length)
      return {
        letters: guesses[i].split(""),
        statuses: evaluateGuess(guesses[i], answer),
      };
    if (i === guesses.length)
      return { letters: currentGuess.split(""), statuses: null };
    return { letters: [], statuses: null };
  });

    return (
    <div className="relative flex h-full w-full items-center justify-center px-6 py-6">
        <div className="flex items-center justify-center gap-8">
        {/* Board */}
        <div className="flex flex-col items-center gap-4 shrink-0">
            <GlassPanel className="flex flex-col gap-2 p-4">
            {rows.map((row, ri) => (
                <div key={ri} className="flex gap-2">
                {Array.from({ length: WORD_LENGTH }, (_, ci) => (
                    <div
                    key={ci}
                    className={`flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold uppercase text-white ${
                        STATUS_COLOR[row.statuses ? row.statuses[ci] : "empty"]
                    }`}
                    >
                    {row.letters[ci] ?? ""}
                    </div>
                ))}
                </div>
            ))}
            </GlassPanel>

            {message && <p className="text-sm text-amber-300">{message}</p>}
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center gap-4 shrink-0">
            {/* Header */}
            <div className="flex flex-col items-center gap-3">
            <h1 className="text-4xl font-bold text-white">Wordle</h1>

            <GlassButton onSelect={onBack} className="h-11 w-28 text-sm">
                ← Back
            </GlassButton>
            </div>

            {/* Keyboard */}
            <div className="flex flex-col items-center gap-2">
            {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1.5">
                {ri === 2 && (
                    <GlassButton
                    onSelect={handleEnter}
                    className="h-12 w-16 text-xs"
                    >
                    Enter
                    </GlassButton>
                )}

                {row.split("").map((letter) => (
                    <GlassButton
                    key={letter}
                    onSelect={() => handleLetter(letter)}
                    className={`h-12 w-9 text-sm font-semibold ${
                        keyStatus[letter] ? STATUS_COLOR[keyStatus[letter]] : ""
                    }`}
                    >
                    {letter}
                    </GlassButton>
                ))}

                {ri === 2 && (
                    <GlassButton
                    onSelect={handleBackspace}
                    className="h-12 w-16 text-xs"
                    >
                    ⌫
                    </GlassButton>
                )}
                </div>
            ))}
            </div>
        </div>
        </div>

        {/* End Screen */}
        {status !== "playing" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <GlassPanel className="flex flex-col items-center gap-4 px-10 py-8">
            <h2 className="text-2xl font-semibold text-white">
                {status === "won" ? "You got it! 🎉" : "Out of guesses"}
            </h2>

            {status === "lost" && (
                <p className="text-white/70">
                The word was: <span className="font-semibold">{answer}</span>
                </p>
            )}

            <GlassButton onSelect={restart} className="h-12 w-36 text-sm">
                Play again
            </GlassButton>
            </GlassPanel>
        </div>
        )}
    </div>
    );
}
