"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import {
  awardPoint,
  endMatch,
  getMatch,
  nextRound,
  revealNextClue,
  skipRound,
} from "@/lib/api";
import type { Match, ProfileTypeId } from "@/types/domain";
import { buildMatchSummary } from "@/lib/match-stats";
import type { RoundSummary } from "@/lib/match-stats";
import { useTranslations } from "next-intl";
import ShareResultButton from "./ShareResultButton";

interface MatchViewProps {
  matchId: string;
}

export default function MatchView({ matchId }: MatchViewProps) {
  const t = useTranslations("match");
  const tSummary = useTranslations("matchSummary");
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const PROFILE_TYPE_LABEL: Record<ProfileTypeId, string> = {
    PERSON: t("profileType.person"),
    PLACE: t("profileType.place"),
    THING: t("profileType.thing"),
    ANIMAL: t("profileType.animal"),
  };

  const PROFILE_TYPE_SHORT_LABEL: Record<ProfileTypeId, string> = {
    PERSON: t("profileTypeShort.person"),
    PLACE: t("profileTypeShort.place"),
    THING: t("profileTypeShort.thing"),
    ANIMAL: t("profileTypeShort.animal"),
  };

  // Load the match on mount
  useEffect(() => {
    getMatch(matchId)
      .then(setMatch)
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("errors.loadMatch")),
      );
  }, [matchId, t]);

  async function withPending<T>(
    action: () => Promise<T>,
  ): Promise<T | undefined> {
    if (isPending) return;
    setIsPending(true);
    try {
      return await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setIsPending(false);
    }
  }

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
          {t("backToLobby")}
        </button>
      </div>
    );
  }

  if (!match) {
    return <div className="max-w-md mx-auto p-6">{t("errors.loadMatch")}</div>;
  }

  const currentRound = match.rounds[match.rounds.length - 1];
  const isMatchFinished = match.state === "FINISHED";

  // ============================================================
  // Action handlers — each one updates local state from API result
  // ============================================================

  async function handleRevealNext() {
    await withPending(async () => {
      try {
        const updated = await revealNextClue(matchId);
        setMatch({ ...updated });
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.revealClue"));
      }
    });
  }

  async function handleAward(playerId: string) {
    await withPending(async () => {
      try {
        const updated = await awardPoint(matchId, playerId);
        setMatch({ ...updated });
        setShowAnswer(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.awardPoint"));
      }
    });
  }

  async function handleSkip() {
    await withPending(async () => {
      try {
        const updated = await skipRound(matchId);
        setMatch({ ...updated });
        setShowAnswer(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.skipRound"));
      }
    });
  }

  async function handleNextRound() {
    await withPending(async () => {
      try {
        const updated = await nextRound(matchId);
        setMatch({ ...updated });
        setShowAnswer(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.advanceRound"));
      }
    });
  }

  async function handleEndMatch() {
    await withPending(async () => {
      try {
        const updated = await endMatch(matchId);
        setMatch({ ...updated });
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.endMatch"));
      }
    });
  }

  // ============================================================
  // Final scoreboard
  // ============================================================

  if (isMatchFinished) {
    const summary = buildMatchSummary(match);
    const ranking = [...summary.playerStats].sort((a, b) => b.wins - a.wins);
    const topScore = ranking[0]?.wins ?? 0;

    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">{tSummary("title")}</h1>

        {/* Share Result Button */}
        <ShareResultButton match={match} />

        {/* Ranking */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{tSummary("ranking.heading")}</h2>
          <ul className="space-y-2">
            {ranking.map((player) => {
              const isWinner = player.wins === topScore && topScore > 0;
              return (
                <li
                  key={player.playerId}
                  className={`flex justify-between px-4 py-3 rounded-md ${
                    isWinner ? "bg-yellow-100 font-bold" : "bg-gray-100"
                  }`}
                >
                  <span>
                    {isWinner && "🏆 "}
                    {player.playerName}
                  </span>
                  <span>{t("award.points", { count: player.wins })}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Match overview */}
        <section className="bg-blue-50 px-4 py-3 rounded-md space-y-1 text-sm">
          <h2 className="text-base font-semibold mb-2">{tSummary("overview.heading")}</h2>
          <div className="flex justify-between">
            <span className="text-gray-700">{tSummary("overview.roundsPlayed")}</span>
            <span className="font-medium">{summary.totalRounds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">{tSummary("overview.roundsSkipped")}</span>
            <span className="font-medium">{summary.totalSkips}</span>
          </div>
          {summary.hardestRound && (
            <div className="flex justify-between">
              <span className="text-gray-700">{tSummary("overview.hardestRound")}</span>
              <span className="font-medium">
                {summary.hardestRound.answer} (
                {tSummary("overview.cluesCount", { count: summary.hardestRound.cluesRevealed })})
              </span>
            </div>
          )}
          {summary.easiestRound && (
            <div className="flex justify-between">
              <span className="text-gray-700">{tSummary("overview.easiestRound")}</span>
              <span className="font-medium">
                {summary.easiestRound.answer} (
                {tSummary("overview.cluesCount", { count: summary.easiestRound.cluesRevealed })})
              </span>
            </div>
          )}
          {summary.mostFrequentProfileType && (
            <div className="flex justify-between">
              <span className="text-gray-700">{tSummary("overview.mostFrequentType")}</span>
              <span className="font-medium">
                {
                  PROFILE_TYPE_SHORT_LABEL[
                    summary.mostFrequentProfileType.profileType
                  ]
                }{" "}
                ({summary.mostFrequentProfileType.count})
              </span>
            </div>
          )}
        </section>

        {/* Player stats */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{tSummary("playerStats.heading")}</h2>
          <ul className="space-y-2">
            {summary.playerStats.map((player) => (
              <li
                key={player.playerId}
                className="px-4 py-3 bg-gray-100 rounded-md"
              >
                <div className="font-medium">{player.playerName}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {tSummary("playerStats.wins", { count: player.wins })}
                  {player.averageCluesToWin !== null && (
                    <>
                      {" · "}
                      {tSummary("playerStats.avgClues", { count: player.averageCluesToWin.toFixed(1) })}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Round-by-round */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{tSummary("roundByRound.heading")}</h2>
          <ul className="space-y-2">
            {summary.rounds.map((round) => (
              <RoundSummaryCard key={round.index} round={round} PROFILE_TYPE_SHORT_LABEL={PROFILE_TYPE_SHORT_LABEL} />
            ))}
          </ul>
        </section>

        {/* New match */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700"
        >
          {tSummary("newMatch")}
        </button>
      </div>
    );
  }

  // ============================================================
  // Active round
  // ============================================================

  if (!currentRound) {
    return <div className="max-w-md mx-auto p-6">{t("noActiveRound")}</div>;
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
        <span>{t("header.round", { number: currentRound.index + 1 })}</span>
        <button
          onClick={handleEndMatch}
          disabled={isPending}
          className="text-red-600 hover:text-red-800"
        >
          {t("header.endMatch")}
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
            {t("answer.reveal")}
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
          disabled={isPending}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700"
        >
          {isPending
            ? t("errors.generic")
            : t("clues.nextButton", {
                current: currentRound.revealedClues,
                total: currentRound.card.clues.length
              })}
        </button>
      )}

      {/* Award buttons */}
      {!roundEnded && (
        <section className="space-y-2">
          <h2 className="font-semibold">{t("award.heading")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {match.players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleAward(player.id)}
                disabled={isPending}
                className="px-4 py-3 bg-green-100 hover:bg-green-200 rounded-md text-left"
              >
                <div className="font-medium">{player.name}</div>
                <div className="text-xs text-gray-600">
                  {t("award.points", { count: match.scores[player.id] ?? 0 })}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            disabled={isPending}
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
          >
            {t("award.skipButton")}
          </button>
        </section>
      )}

      {/* Next round */}
      {roundEnded && (
        <button
          onClick={handleNextRound}
          disabled={isPending}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700"
        >
          {isPending ? t("generatingCard") : t("nextRound")}
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

function RoundSummaryCard({
  round,
  PROFILE_TYPE_SHORT_LABEL
}: {
  round: RoundSummary;
  PROFILE_TYPE_SHORT_LABEL: Record<ProfileTypeId, string>;
}) {
  const tSummary = useTranslations("matchSummary");
  const wasSkipped = round.winnerName === null;

  return (
    <li className="px-4 py-3 bg-gray-100 rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {tSummary("roundByRound.roundLabel", { number: round.index + 1 })} ·{" "}
          {PROFILE_TYPE_SHORT_LABEL[round.profileType]}
        </span>
        <span className="text-xs text-gray-500">
          {tSummary("roundByRound.cluesRevealed", {
            revealed: round.cluesRevealed,
            total: round.totalClues
          })}
        </span>
      </div>
      <div className="font-medium mt-1">{round.answer}</div>
      <div
        className={`text-sm mt-1 ${wasSkipped ? "text-gray-500 italic" : "text-green-700"}`}
      >
        {wasSkipped
          ? tSummary("roundByRound.noWinner")
          : tSummary("roundByRound.wonBy", { name: round.winnerName || "" })}
      </div>
    </li>
  );
}
