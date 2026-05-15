import type { Match } from "@/types/domain";
import { buildMatchSummary } from "./match-stats";

/**
 * Builds shareable text for a finished match.
 * Format is intentionally in English for universal readability.
 */
export function buildShareText(match: Match): string {
  const summary = buildMatchSummary(match);

  // Extract locale code (pt-BR -> pt, en-US -> en)
  const localeCode = match.config.locale.split('-')[0];

  // Title line
  const lines = [
    `FindWhoAmAI · ${summary.totalRounds} rounds · ${localeCode}`,
  ];

  // Player ranking - top 3 with medals
  const medals = ['🥇', '🥈', '🥉'];
  const rankedPlayers = [...summary.playerStats]
    .sort((a, b) => {
      // Sort by wins descending, then by name ascending (tiebreaker)
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.playerName.localeCompare(b.playerName);
    });

  // Group players by wins to handle ties
  const playersByWins = new Map<number, typeof rankedPlayers>();
  for (const player of rankedPlayers) {
    const existing = playersByWins.get(player.wins) ?? [];
    existing.push(player);
    playersByWins.set(player.wins, existing);
  }

  // Assign medals
  let medalIndex = 0;
  const topPlayers = rankedPlayers.slice(0, 3);
  const seenWins = new Set<number>();

  for (const player of topPlayers) {
    // If this win count hasn't been seen, it's a new rank
    if (!seenWins.has(player.wins)) {
      seenWins.add(player.wins);
      // Only increment medal if we're not at the last medal and not in a tie
      if (medalIndex < medals.length - 1 && seenWins.size > 1) {
        medalIndex++;
      }
    }

    const medal = medals[Math.min(medalIndex, medals.length - 1)];
    const winsText = player.wins === 1 ? '1 win' : `${player.wins} wins`;
    lines.push(`${medal} ${player.playerName} — ${winsText}`);
  }

  // Hardest round (only if there were winners)
  if (summary.hardestRound) {
    const cluesText = summary.hardestRound.cluesRevealed === 1
      ? '1 clue'
      : `${summary.hardestRound.cluesRevealed} clues`;
    lines.push(`Hardest: ${summary.hardestRound.answer} (${cluesText})`);
  }

  // Site URL
  lines.push('findwhoamai.com');

  return lines.join('\n');
}
