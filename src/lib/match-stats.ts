import type { Match, PlayerId, ProfileTypeId } from "@/types/domain";

// ============================================================
// Stat types — what the summary screen consumes
// ============================================================

export interface RoundSummary {
  index: number;
  profileType: ProfileTypeId;
  answer: string;
  cluesRevealed: number;
  totalClues: number;
  winnerName: string | null;
}

export interface PlayerStats {
  playerId: PlayerId;
  playerName: string;
  wins: number;
  averageCluesToWin: number | null;
}

export interface ProfileTypeStats {
  profileType: ProfileTypeId;
  count: number;
}

export interface MatchSummary {
  rounds: RoundSummary[];
  totalRounds: number;
  totalSkips: number;
  hardestRound: RoundSummary | null;
  easiestRound: RoundSummary | null;
  playerStats: PlayerStats[];
  mostFrequentProfileType: ProfileTypeStats | null;
  leastFrequentProfileType: ProfileTypeStats | null;
}

// ============================================================
// Main entry — turns a match into a summary
// ============================================================

export function buildMatchSummary(match: Match): MatchSummary {
  const playerNameById = new Map(match.players.map((p) => [p.id, p.name]));

  const rounds: RoundSummary[] = match.rounds.map((round) => ({
    index: round.index,
    profileType: round.card.profileType,
    answer: round.card.answer,
    cluesRevealed: round.revealedClues,
    totalClues: round.card.clues.length,
    winnerName: round.winner
      ? (playerNameById.get(round.winner) ?? null)
      : null,
  }));

  const playedRounds = rounds.filter((r) => r.winnerName !== null);
  const totalSkips = rounds.length - playedRounds.length;

  return {
    rounds,
    totalRounds: rounds.length,
    totalSkips,
    hardestRound: findHardestRound(playedRounds),
    easiestRound: findEasiestRound(playedRounds),
    playerStats: buildPlayerStats(match, rounds),
    mostFrequentProfileType: findMostFrequentProfileType(rounds),
    leastFrequentProfileType: findLeastFrequentProfileType(rounds),
  };
}

// ============================================================
// Internal helpers
// ============================================================

function findHardestRound(rounds: RoundSummary[]): RoundSummary | null {
  if (rounds.length === 0) return null;
  return rounds.reduce((hardest, current) =>
    current.cluesRevealed > hardest.cluesRevealed ? current : hardest,
  );
}

function findEasiestRound(rounds: RoundSummary[]): RoundSummary | null {
  if (rounds.length === 0) return null;
  return rounds.reduce((easiest, current) =>
    current.cluesRevealed < easiest.cluesRevealed ? current : easiest,
  );
}

function buildPlayerStats(match: Match, rounds: RoundSummary[]): PlayerStats[] {
  return match.players.map((player) => {
    const winsByThisPlayer = rounds.filter((r) => r.winnerName === player.name);
    const wins = winsByThisPlayer.length;
    const averageCluesToWin =
      wins > 0
        ? winsByThisPlayer.reduce((sum, r) => sum + r.cluesRevealed, 0) / wins
        : null;

    return {
      playerId: player.id,
      playerName: player.name,
      wins,
      averageCluesToWin,
    };
  });
}

function findMostFrequentProfileType(
  rounds: RoundSummary[],
): ProfileTypeStats | null {
  const counts = countByProfileType(rounds);
  if (counts.length === 0) return null;
  return counts.reduce((max, current) =>
    current.count > max.count ? current : max,
  );
}

function findLeastFrequentProfileType(
  rounds: RoundSummary[],
): ProfileTypeStats | null {
  const counts = countByProfileType(rounds);
  if (counts.length === 0) return null;
  return counts.reduce((min, current) =>
    current.count < min.count ? current : min,
  );
}

function countByProfileType(rounds: RoundSummary[]): ProfileTypeStats[] {
  const counts = new Map<ProfileTypeId, number>();
  for (const round of rounds) {
    counts.set(round.profileType, (counts.get(round.profileType) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([profileType, count]) => ({
    profileType,
    count,
  }));
}
