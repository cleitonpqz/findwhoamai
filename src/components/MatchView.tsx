"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  awardPoint,
  endMatch,
  getMatch,
  nextRound,
  revealNextClue,
  skipRound,
} from "@/lib/api";
import type { Match, ProfileTypeId } from "@/types/domain";

const PROFILE_TYPE_LABEL: Record<ProfileTypeId, string> = {
  PERSON: "Sou um Personagem ou Pessoa",
  PLACE: "Sou um Lugar",
  THING: "Sou uma Coisa",
  ANIMAL: "Sou um Animal",
};

interface MatchViewProps {
  matchId: string;
}

export default function MatchView({ matchId }: MatchViewProps) {
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the match on mount
  useEffect(() => {
    getMatch(matchId)
      .then(setMatch)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load match."),
      );
  }, [matchId]);

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p role="alert" className="text-red-600">
          {error}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  if (!match) {
    return <div className="max-w-md mx-auto p-6">Loading match…</div>;
  }

  const currentRound = match.rounds[match.rounds.length - 1];
  const isMatchFinished = match.state === "FINISHED";

  // ============================================================
  // Action handlers — each one updates local state from API result
  // ============================================================

  async function handleRevealNext() {
    try {
      const updated = await revealNextClue(matchId);
      setMatch({ ...updated });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reveal clue.");
    }
  }

  async function handleAward(playerId: string) {
    try {
      const updated = await awardPoint(matchId, playerId);
      setMatch({ ...updated });
      setShowAnswer(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to award point.");
    }
  }

  async function handleSkip() {
    try {
      const updated = await skipRound(matchId);
      setMatch({ ...updated });
      setShowAnswer(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to skip round.");
    }
  }

  async function handleNextRound() {
    try {
      const updated = await nextRound(matchId);
      setMatch({ ...updated });
      setShowAnswer(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to advance round.");
    }
  }

  async function handleEndMatch() {
    try {
      const updated = await endMatch(matchId);
      setMatch({ ...updated });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to end match.");
    }
  }

  // ============================================================
  // Final scoreboard
  // ============================================================

  if (isMatchFinished) {
    const ranking = [...match.players].sort(
      (a, b) => (match.scores[b.id] ?? 0) - (match.scores[a.id] ?? 0),
    );
    const topScore = match.scores[ranking[0]?.id] ?? 0;

    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">Match finished</h1>
        <ul className="space-y-2">
          {ranking.map((player) => {
            const score = match.scores[player.id] ?? 0;
            const isWinner = score === topScore && score > 0;
            return (
              <li
                key={player.id}
                className={`flex justify-between px-4 py-3 rounded-md ${
                  isWinner ? "bg-yellow-100 font-bold" : "bg-gray-100"
                }`}
              >
                <span>
                  {isWinner && "🏆 "}
                  {player.name}
                </span>
                <span>{score} pts</span>
              </li>
            );
          })}
        </ul>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700"
        >
          New match
        </button>
      </div>
    );
  }

  // ============================================================
  // Active round
  // ============================================================

  if (!currentRound) {
    return <div className="max-w-md mx-auto p-6">No active round.</div>;
  }

  const visibleClues = currentRound.card.clues.slice(
    0,
    currentRound.revealedClues,
  );
  const hasMoreClues =
    currentRound.revealedClues < currentRound.card.clues.length;
  const roundEnded = currentRound.ended;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between text-sm text-gray-600">
        <span>Round {currentRound.index + 1}</span>
        <button
          onClick={handleEndMatch}
          className="text-red-600 hover:text-red-800"
        >
          End match
        </button>
      </header>

      {/* Profile type */}
      <div className="bg-blue-100 px-4 py-3 rounded-md text-center text-lg font-semibold">
        {PROFILE_TYPE_LABEL[currentRound.card.profileType]}
      </div>

      {/* Answer (hidden by default) */}
      <div className="text-center">
        {showAnswer ? (
          <p className="text-2xl font-bold text-green-700">
            {currentRound.card.answer}
          </p>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            className="text-sm text-gray-500 underline"
          >
            Reveal answer (moderator only)
          </button>
        )}
      </div>

      {/* Clues */}
      <ol className="space-y-2">
        {visibleClues.map((clue) => (
          <li key={clue.order} className="px-4 py-3 bg-gray-100 rounded-md">
            <span className="font-bold mr-2">{clue.order}.</span>
            {clue.text}
          </li>
        ))}
      </ol>

      {/* Reveal next clue */}
      {!roundEnded && hasMoreClues && (
        <button
          onClick={handleRevealNext}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700"
        >
          Next clue ({currentRound.revealedClues}/
          {currentRound.card.clues.length})
        </button>
      )}

      {/* Award buttons */}
      {!roundEnded && (
        <section className="space-y-2">
          <h2 className="font-semibold">Award point to:</h2>
          <div className="grid grid-cols-2 gap-2">
            {match.players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleAward(player.id)}
                className="px-4 py-3 bg-green-100 hover:bg-green-200 rounded-md text-left"
              >
                <div className="font-medium">{player.name}</div>
                <div className="text-xs text-gray-600">
                  {match.scores[player.id] ?? 0} pts
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
          >
            Skip round (no winner)
          </button>
        </section>
      )}

      {/* Next round */}
      {roundEnded && (
        <button
          onClick={handleNextRound}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700"
        >
          Next round →
        </button>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
