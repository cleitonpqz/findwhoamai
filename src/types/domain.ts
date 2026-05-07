export type PlayerId = string;
export type MatchId = string;
export type CardId = string;
export type ProfileTypeId = "PERSON" | "PLACE" | "THING" | "ANIMAL";

export type ClueKind = "HINT" | "ACTION";

export interface Player {
  id: PlayerId;
  name: string;
}

export interface Clue {
  order: number;
  kind: ClueKind;
  text: string;
}

export interface Card {
  id: CardId;
  profileType: ProfileTypeId;
  answer: string;
  clues: Clue[]; // from harderst to easiest
  locale: string; // ex: 'pt-BR', 'en-US'
}

export interface Round {
  index: number;
  card: Card;
  revealedClues: number; // number of clues revealed so far
  winner: PlayerId | null; // player who won this round, null if no winner yet
  ended: boolean; // whether the round has ended
}

export type MatchState = "LOBBY" | "IN_PROGRESS" | "FINISHED";

export interface MatchConfig {
  targetRounds: number; // 0 = endless
  allowedProfileTypes: ProfileTypeId[]; // which profile types are allowed in this match
  cluesPerCard: number; // how many clues to reveal per card
  locale: string; // ex: 'pt-BR', 'en-US'
}

export interface Match {
  id: MatchId;
  players: Player[];
  config: MatchConfig;
  rounds: Round[];
  scores: Record<PlayerId, number>; // player scores
  state: MatchState;
}
