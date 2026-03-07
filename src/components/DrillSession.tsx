"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateSM2 } from "@/lib/sm2";
import type { DrillMode } from "@/lib/constants";
import type { Database } from "@/types/database";

type Verse = Database["public"]["Tables"]["verses"]["Row"];
type UserVerse = Database["public"]["Tables"]["user_verses"]["Row"];

interface DrillVerse {
  userVerse: UserVerse;
  verse: Verse;
}

interface DrillSessionProps {
  mode: DrillMode;
  verses: DrillVerse[];
  userId: string;
  onEnd: () => void;
}

export default function DrillSession({
  mode,
  verses,
  userId,
  onEnd,
}: DrillSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [blankedWords, setBlankedWords] = useState<boolean[]>([]);
  const [filledWords, setFilledWords] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [completed, setCompleted] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const supabase = createClient();
  const currentVerse = verses[currentIndex];
  const words = currentVerse?.verse.text.split(/\s+/) || [];

  useEffect(() => {
    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStartTime(Date.now());
    setShowResult(false);
    setUserInput("");
    setScore(0);

    if (mode === "fill_blank") {
      setupBlanks();
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const createSession = async () => {
    const { data } = await supabase
      .from("drill_sessions")
      .insert({ user_id: userId, mode })
      .select()
      .single();
    if (data) setSessionId(data.id);
  };

  const setupBlanks = () => {
    const mastery = currentVerse.userVerse.repetitions;
    // Blank percentage increases with mastery: 20% → 40% → 60% → 80%
    const blankPercentage = Math.min(0.8, 0.2 + mastery * 0.1);
    const blanks = words.map(() => Math.random() < blankPercentage);
    // Ensure at least some words are shown
    if (blanks.every((b) => b)) {
      blanks[0] = false;
      blanks[blanks.length - 1] = false;
    }
    setBlankedWords(blanks);
    setFilledWords(new Array(words.length).fill(""));
  };

  const compareWords = (original: string, typed: string): boolean => {
    const clean = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return clean(original) === clean(typed);
  };

  const calculateAccuracy = (original: string, typed: string): number => {
    const origWords = original.split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const typedWords = typed.split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""));

    let correct = 0;
    const maxLen = Math.max(origWords.length, typedWords.length);
    for (let i = 0; i < maxLen; i++) {
      if (origWords[i] && typedWords[i] && origWords[i] === typedWords[i]) {
        correct++;
      }
    }

    return maxLen > 0 ? correct / maxLen : 0;
  };

  const handleConfidence = async (confidence: number) => {
    setScore(confidence);
    await saveResult(confidence);
    setShowResult(true);
  };

  const handleSubmit = async () => {
    let accuracy: number;

    if (mode === "fill_blank") {
      let correct = 0;
      let total = 0;
      blankedWords.forEach((isBlank, i) => {
        if (isBlank) {
          total++;
          if (compareWords(words[i], filledWords[i])) correct++;
        }
      });
      accuracy = total > 0 ? correct / total : 1;
    } else {
      accuracy = calculateAccuracy(currentVerse.verse.text, userInput);
    }

    // Convert accuracy to 0-5 score
    const calculatedScore = Math.round(accuracy * 5);
    setScore(calculatedScore);
    await saveResult(calculatedScore);
    setShowResult(true);
  };

  const saveResult = async (resultScore: number) => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // Save drill result
    if (sessionId) {
      await supabase.from("drill_results").insert({
        session_id: sessionId,
        verse_id: currentVerse.verse.id,
        score: resultScore,
        time_taken: timeTaken,
      });
    }

    // Update SM-2 schedule
    const sm2Result = calculateSM2(resultScore, {
      interval: currentVerse.userVerse.interval,
      ease_factor: currentVerse.userVerse.ease_factor,
      repetitions: currentVerse.userVerse.repetitions,
      due_date: currentVerse.userVerse.due_date,
      mastered: currentVerse.userVerse.mastered,
    });

    await supabase
      .from("user_verses")
      .update({
        interval: sm2Result.interval,
        ease_factor: sm2Result.ease_factor,
        repetitions: sm2Result.repetitions,
        due_date: sm2Result.due_date,
        mastered: sm2Result.mastered,
      })
      .eq("id", currentVerse.userVerse.id);

    setTotalScore((prev) => prev + resultScore);
    setCompleted((prev) => prev + 1);
  };

  const nextVerse = () => {
    if (currentIndex < verses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    if (sessionId) {
      await supabase
        .from("drill_sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // Update streak
    await supabase.rpc("update_streak", { p_user_id: userId });
    onEnd();
  };

  const renderWordComparison = () => {
    if (mode === "fill_blank") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {words.map((word, i) => {
            if (!blankedWords[i]) {
              return <span key={i} className="text-ink dark:text-[#E8D5B8]">{word}</span>;
            }
            const isCorrect = compareWords(word, filledWords[i] || "");
            return (
              <span key={i}>
                <span className={isCorrect ? "word-correct" : "word-incorrect"}>
                  {filledWords[i] || "___"}
                </span>
                {!isCorrect && (
                  <span className="word-missing text-xs ml-1">[{word}]</span>
                )}
              </span>
            );
          })}
        </div>
      );
    }

    const origWords = currentVerse.verse.text.split(/\s+/);
    const typedWords = userInput.split(/\s+/);

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs text-ink/50 dark:text-[#E8D5B8]/50 mb-1">Your answer:</p>
          <div className="flex flex-wrap gap-1">
            {typedWords.map((word, i) => {
              const isCorrect = origWords[i] && compareWords(origWords[i], word);
              return (
                <span key={i} className={isCorrect ? "word-correct" : "word-incorrect"}>
                  {word}
                </span>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs text-ink/50 dark:text-[#E8D5B8]/50 mb-1">Correct verse:</p>
          <div className="flex flex-wrap gap-1">
            {origWords.map((word, i) => {
              const isCorrect = typedWords[i] && compareWords(word, typedWords[i]);
              return (
                <span
                  key={i}
                  className={isCorrect ? "word-correct" : "word-missing"}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!currentVerse) {
    return (
      <div className="verse-card flex-col gap-4 py-12">
        <p className="font-serif text-lg">No verses to practice!</p>
        <button onClick={onEnd} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink/50 dark:text-[#E8D5B8]/50">
          {currentIndex + 1} / {verses.length}
        </span>
        <button onClick={finishSession} className="text-sm text-ink/50 hover:text-ink">
          End Session
        </button>
      </div>
      <div className="w-full bg-accent/10 rounded-full h-2">
        <div
          className="bg-accent h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / verses.length) * 100}%` }}
        />
      </div>

      {/* Verse card */}
      <div className="verse-card flex-col gap-6 p-8">
        <span className="text-sm font-semibold text-accent">
          {currentVerse.verse.reference} ({currentVerse.verse.translation})
        </span>

        {/* READ MODE */}
        {mode === "read" && !showResult && (
          <>
            <p className="verse-text text-xl leading-relaxed text-center">
              {currentVerse.verse.text}
            </p>
            <div className="space-y-2 w-full">
              <p className="text-sm text-center text-ink/50 dark:text-[#E8D5B8]/50">
                How well do you know this verse?
              </p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleConfidence(n)}
                    className="w-12 h-12 rounded-xl border-2 border-accent/20 hover:border-accent hover:bg-accent/10 font-semibold transition-all"
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-ink/40 dark:text-[#E8D5B8]/40 px-2">
                <span>Don&apos;t know</span>
                <span>Perfect</span>
              </div>
            </div>
          </>
        )}

        {/* PROMPT MODE */}
        {mode === "prompt" && !showResult && (
          <>
            <p className="verse-text text-lg text-center text-ink/40 dark:text-[#E8D5B8]/40 italic">
              Type the verse from memory...
            </p>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="input-field min-h-[120px] verse-text resize-y"
              placeholder="Type the verse..."
            />
            <button onClick={handleSubmit} className="btn-primary">
              Check Answer
            </button>
          </>
        )}

        {/* FILL IN THE BLANK MODE */}
        {mode === "fill_blank" && !showResult && (
          <>
            <div className="flex flex-wrap gap-2 items-center justify-center">
              {words.map((word, i) => {
                if (!blankedWords[i]) {
                  return (
                    <span key={i} className="verse-text">
                      {word}
                    </span>
                  );
                }
                return (
                  <input
                    key={i}
                    type="text"
                    value={filledWords[i] || ""}
                    onChange={(e) => {
                      const updated = [...filledWords];
                      updated[i] = e.target.value;
                      setFilledWords(updated);
                    }}
                    className="border-b-2 border-accent/40 bg-transparent text-center verse-text outline-none focus:border-accent px-1"
                    style={{ width: `${Math.max(word.length * 10, 40)}px` }}
                    placeholder="___"
                  />
                );
              })}
            </div>
            <button onClick={handleSubmit} className="btn-primary">
              Check Answer
            </button>
          </>
        )}

        {/* FIRST LETTERS MODE */}
        {mode === "first_letters" && !showResult && (
          <>
            <p className="verse-text text-lg text-center tracking-widest">
              {words.map((word) => word.charAt(0)).join(" ")}...
            </p>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="input-field min-h-[120px] verse-text resize-y"
              placeholder="Type the full verse..."
            />
            <button onClick={handleSubmit} className="btn-primary">
              Check Answer
            </button>
          </>
        )}

        {/* RECITE MODE */}
        {mode === "recite" && !showResult && (
          <>
            <p className="text-sm text-ink/40 dark:text-[#E8D5B8]/40 italic text-center">
              Type the entire verse from memory
            </p>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="input-field min-h-[150px] verse-text resize-y"
              placeholder="Begin typing..."
              autoFocus
            />
            <button onClick={handleSubmit} className="btn-primary">
              Check Answer
            </button>
          </>
        )}

        {/* RESULT */}
        {showResult && (
          <div className="space-y-4 w-full">
            <div className="text-center">
              <span
                className={`text-4xl font-serif font-bold ${
                  score >= 4 ? "text-green-600" : score >= 3 ? "text-amber-600" : "text-red-600"
                }`}
              >
                {score}/5
              </span>
              <p className="text-sm text-ink/50 dark:text-[#E8D5B8]/50 mt-1">
                {score >= 4 ? "Excellent!" : score >= 3 ? "Good progress!" : "Keep practicing!"}
              </p>
            </div>

            {mode !== "read" && renderWordComparison()}

            <div className="border-t border-accent/10 pt-4">
              <p className="text-xs text-ink/40 dark:text-[#E8D5B8]/40 mb-1">Original verse:</p>
              <p className="verse-text text-sm leading-relaxed">
                {currentVerse.verse.text}
              </p>
            </div>

            <button onClick={nextVerse} className="btn-primary w-full">
              {currentIndex < verses.length - 1 ? "Next Verse" : "Finish Session"}
            </button>
          </div>
        )}
      </div>

      {/* Session stats */}
      <div className="flex justify-center gap-8 text-sm text-ink/50 dark:text-[#E8D5B8]/50">
        <span>Completed: {completed}/{verses.length}</span>
        <span>Avg Score: {completed > 0 ? (totalScore / completed).toFixed(1) : "-"}/5</span>
      </div>
    </div>
  );
}
