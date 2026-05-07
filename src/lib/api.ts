import type {
  Card,
  Match,
  MatchConfig,
  Player,
  PlayerId,
  ProfileTypeId,
} from "@/types/domain";

// ============================================================
// Card generation — calls the /api/cards/generate route handler
// ============================================================

async function generateCardFromApi(
  profileType: ProfileTypeId,
): Promise<Card | null> {
  try {
    const response = await fetch("/api/cards/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileType,
        cluesPerCard: 10,
        locale: "pt-BR",
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

const FAKE_CARDS: Card[] = [
  {
    id: "card-1",
    profileType: "ANIMAL",
    answer: "Elefante",
    locale: "pt-BR",
    clues: [
      { order: 1, kind: "HINT", text: "Sou um mamífero terrestre." },
      {
        order: 2,
        kind: "HINT",
        text: "Vivo em manadas lideradas por uma fêmea.",
      },
      { order: 3, kind: "HINT", text: "Posso viver mais de 60 anos." },
      { order: 4, kind: "HINT", text: "Tenho uma memória excepcional." },
      {
        order: 5,
        kind: "HINT",
        text: "Existem espécies em dois continentes diferentes.",
      },
      { order: 6, kind: "HINT", text: "Minha pele é grossa e enrugada." },
      {
        order: 7,
        kind: "HINT",
        text: "Uso minhas orelhas grandes para regular a temperatura.",
      },
      { order: 8, kind: "HINT", text: "Tenho presas de marfim." },
      {
        order: 9,
        kind: "HINT",
        text: "Sou o maior animal terrestre do mundo.",
      },
      {
        order: 10,
        kind: "HINT",
        text: "Tenho uma tromba longa que uso pra beber água.",
      },
    ],
  },
  {
    id: "card-2",
    profileType: "PLACE",
    answer: "Paris",
    locale: "pt-BR",
    clues: [
      { order: 1, kind: "HINT", text: "Sou uma capital europeia." },
      { order: 2, kind: "HINT", text: "Tenho mais de 2 mil anos de história." },
      { order: 3, kind: "HINT", text: "Um rio famoso me corta ao meio." },
      { order: 4, kind: "HINT", text: "Sou conhecida como a cidade-luz." },
      {
        order: 5,
        kind: "HINT",
        text: "Sou famosa pela minha gastronomia e moda.",
      },
      {
        order: 6,
        kind: "HINT",
        text: "Abrigo um dos museus mais visitados do mundo.",
      },
      {
        order: 7,
        kind: "HINT",
        text: "Tenho uma avenida famosa chamada Champs-Élysées.",
      },
      { order: 8, kind: "HINT", text: "Em mim fica o museu do Louvre." },
      { order: 9, kind: "HINT", text: "Sou a capital da França." },
      {
        order: 10,
        kind: "HINT",
        text: "Tenho uma torre de ferro de 330 metros como meu símbolo.",
      },
    ],
  },
];

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
let cardCursor = 0;

async function nextCard(allowedTypes: ProfileTypeId[]): Promise<Card> {
  // Pick a random allowed profile type — falls back to all types if none specified
  const types =
    allowedTypes.length > 0
      ? allowedTypes
      : (["PERSON", "PLACE", "THING", "ANIMAL"] as ProfileTypeId[]);
  const chosenType = types[Math.floor(Math.random() * types.length)];

  // Try to generate via Claude; fall back to hardcoded cards on failure
  const generated = await generateCardFromApi(chosenType);
  if (generated) {
    return generated;
  }

  // Fallback: cycle through hardcoded cards filtered by allowed types
  const eligibleFallbacks = FAKE_CARDS.filter((card) =>
    types.includes(card.profileType),
  );
  const fallback =
    eligibleFallbacks[cardCursor % eligibleFallbacks.length] ?? FAKE_CARDS[0];
  cardCursor += 1;
  return { ...fallback, id: generateId("card") };
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
    card: await nextCard(match.config.allowedProfileTypes),
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

  const newRound = {
    index: match.rounds.length,
    card: await nextCard(match.config.allowedProfileTypes),
    revealedClues: 1,
    winner: null,
    ended: false,
  };
  match.rounds.push(newRound);

  if (
    match.config.targetRounds > 0 &&
    match.rounds.length > match.config.targetRounds
  ) {
    match.state = "FINISHED";
  }

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
