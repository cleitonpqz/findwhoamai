import type {
  Card,
  Match,
  MatchConfig,
  Player,
  PlayerId,
  ProfileTypeId,
} from "@/types/domain";

import fallbackData from "./fallback-cards.json";

// ============================================================
// Card generation — calls the /api/cards/generate route handler
// ============================================================

async function generateCardFromApi(
  profileType: ProfileTypeId,
  exclusions: string[],
): Promise<Card | null> {
  try {
    const response = await fetch("/api/cards/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileType,
        cluesPerCard: 10,
        locale: "pt-BR",
        exclusions,
      }),
    });

    if (!response.ok) {
      console.warn(
        `Card generation API returned ${response.status}, using fallback`,
      );
      return null;
    }

    return (await response.json()) as Card;
  } catch (error) {
    console.warn("Card generation API failed, using fallback:", error);
    return null;
  }
}

// ============================================================
// FAKE DATA — replaces LLM calls until the real backend is wired up
// ============================================================

const FAKE_CARDS: Card[] = fallbackData.map((entry, index) => ({
  id: `fallback-${index}`,
  profileType: entry.profileType as ProfileTypeId,
  answer: entry.answer,
  locale: "pt-BR",
  clues: entry.clues.map((text, i) => ({
    order: i + 1,
    kind: "HINT" as const,
    text,
  })),
}));

// ============================================================
// Internal helpers — simulate latency and id generation
// ============================================================

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// In-memory "database" — lives while the tab is open
const matchStore = new Map<string, Match>();

async function nextCard(
  allowedTypes: ProfileTypeId[],
  exclusions: string[] = [],
): Promise<Card> {
  // Pick a random allowed profile type — falls back to all types if none specified
  const types =
    allowedTypes.length > 0
      ? allowedTypes
      : (["PERSON", "PLACE", "THING", "ANIMAL"] as ProfileTypeId[]);
  const chosenType = types[Math.floor(Math.random() * types.length)];

  // Try to generate via Claude; fall back to hardcoded cards on failure
  const generated = await generateCardFromApi(chosenType, exclusions);
  if (generated) {
    return generated;
  }

  // Fallback: cycle through hardcoded cards filtered by allowed types
  const eligible = FAKE_CARDS.filter((card) =>
    types.includes(card.profileType),
  );
  const random =
    eligible[Math.floor(Math.random() * eligible.length)] ?? FAKE_CARDS[0];
  return { ...random, id: generateId("card") };
}

// ============================================================
// Public API — signature mirrors the real backend contract
// ============================================================

export async function createMatch(input: {
  players: Pick<Player, "name">[];
  config: MatchConfig;
}): Promise<Match> {
  await delay(200);

  const players: Player[] = input.players.map((p) => ({
    id: generateId("player"),
    name: p.name,
  }));

  const scores: Record<PlayerId, number> = {};
  players.forEach((p) => {
    scores[p.id] = 0;
  });

  const match: Match = {
    id: generateId("match"),
    players,
    config: input.config,
    rounds: [],
    scores,
    state: "LOBBY",
  };

  matchStore.set(match.id, match);
  return match;
}

export async function startMatch(matchId: string): Promise<Match> {
  await delay(300);
  const match = requireMatch(matchId);

  const firstRound = {
    index: 0,
    card: await nextCard(match.config.allowedProfileTypes, []),
    revealedClues: 1,
    winner: null,
    ended: false,
  };

  match.state = "IN_PROGRESS";
  match.rounds = [firstRound];
  return match;
}

export async function getMatch(matchId: string): Promise<Match> {
  await delay(50);
  return requireMatch(matchId);
}

export async function revealNextClue(matchId: string): Promise<Match> {
  await delay(100);
  const match = requireMatch(matchId);
  const round = currentRound(match);

  if (round.revealedClues < round.card.clues.length) {
    round.revealedClues += 1;
  }
  return match;
}

export async function awardPoint(
  matchId: string,
  playerId: PlayerId,
): Promise<Match> {
  await delay(100);
  const match = requireMatch(matchId);
  const round = currentRound(match);

  round.winner = playerId;
  round.ended = true;
  match.scores[playerId] = (match.scores[playerId] ?? 0) + 1;
  return match;
}

export async function skipRound(matchId: string): Promise<Match> {
  await delay(100);
  const match = requireMatch(matchId);
  const round = currentRound(match);
  round.ended = true;
  return match;
}

export async function nextRound(matchId: string): Promise<Match> {
  await delay(200);
  const match = requireMatch(matchId);

  // Check if we've already played all target rounds — finish the match without generating a new card
  if (
    match.config.targetRounds > 0 &&
    match.rounds.length >= match.config.targetRounds
  ) {
    match.state = "FINISHED";
    return match;
  }

  const newRound = {
    index: match.rounds.length,
    card: await nextCard(
      match.config.allowedProfileTypes,
      collectAnswers(match),
    ),
    revealedClues: 1,
    winner: null,
    ended: false,
  };
  match.rounds.push(newRound);

  return match;
}

export async function endMatch(matchId: string): Promise<Match> {
  await delay(100);
  const match = requireMatch(matchId);
  match.state = "FINISHED";
  return match;
}

// ============================================================
// Validation helpers
// ============================================================

function requireMatch(matchId: string): Match {
  const match = matchStore.get(matchId);
  if (!match) throw new Error(`Match not found: ${matchId}`);
  return match;
}

function currentRound(match: Match) {
  const round = match.rounds[match.rounds.length - 1];
  if (!round) throw new Error("No active round");
  return round;
}

function collectAnswers(match: Match): string[] {
  return match.rounds.map((round) => round.card.answer);
}
