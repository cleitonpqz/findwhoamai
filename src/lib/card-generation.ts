import type { ProfileTypeId } from "@/types/domain";

// ============================================================
// Prompt configuration per profile type
// ============================================================

export const PROFILE_TYPE_GUIDANCE: Record<ProfileTypeId, string> = {
  PERSON:
    "A real or fictional person/character (historical figure, celebrity, fictional character from books/movies, etc.)",
  PLACE:
    "A geographical location (city, country, monument, landmark, natural wonder)",
  THING:
    "An object, invention, or concept (everyday item, technology, food, abstract concept)",
  ANIMAL: "An animal species (mammal, bird, fish, reptile, insect, etc.)",
};

// ============================================================
// Types
// ============================================================

export interface ClaudeCardResponse {
  answer: string;
  clues: string[];
}

// ============================================================
// Prompt builder
// ============================================================

export function buildPrompt(params: {
  profileType: ProfileTypeId;
  cluesPerCard: number;
  exclusions: string[];
  locale: string;
}): string {
  const { profileType, cluesPerCard, exclusions, locale } = params;
  const guidance = PROFILE_TYPE_GUIDANCE[profileType];

  const exclusionText = exclusions.length
    ? `\n\nDo NOT pick any of these (already used in this match): ${exclusions.join(", ")}.`
    : "";

  const languageInstruction =
    locale === "pt-BR"
      ? "Write the answer and ALL clues in Brazilian Portuguese (pt-BR)."
      : `Write the answer and ALL clues in ${locale}.`;

  return `You are generating a card for a guessing game inspired by the Brazilian board game "Perfil".

Profile type: ${profileType}
Description: ${guidance}

${languageInstruction}

Pick a single answer of this profile type. Then write exactly ${cluesPerCard} clues, ordered from HARDEST (most obscure, abstract, indirect) to EASIEST (most revealing, makes the answer obvious).

Hard rules:
- The answer MUST NOT appear in any clue, in any form (no inflections, no synonyms, no direct references that give it away before the last clue).
- Clues must be progressively easier. Clue 1 should be hard to guess from. The final clue should make the answer obvious.
- Each clue must be a single sentence under 200 characters.
- Do not include any board game actions, instructions, or meta-commentary in the clues. Only descriptive hints about the answer.${exclusionText}

Respond with ONLY a valid JSON object in this exact format, no markdown, no preamble:

{
  "answer": "the answer",
  "clues": ["clue 1 (hardest)", "clue 2", "...", "clue ${cluesPerCard} (easiest)"]
}`;
}

// ============================================================
// Response parsing and validation
// ============================================================

export function parseJsonResponse(text: string): ClaudeCardResponse {
  // Strip possible markdown fences (```json ... ```) defensively
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Claude response was not valid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as ClaudeCardResponse).answer !== "string" ||
    !Array.isArray((parsed as ClaudeCardResponse).clues)
  ) {
    throw new Error("Claude response did not match expected schema");
  }

  return parsed as ClaudeCardResponse;
}

export function validateCard(
  card: ClaudeCardResponse,
  expectedClueCount: number,
): void {
  if (card.clues.length !== expectedClueCount) {
    throw new Error(
      `Expected ${expectedClueCount} clues, got ${card.clues.length}`,
    );
  }

  const answerNormalized = normalize(card.answer);

  for (const [index, clue] of card.clues.entries()) {
    if (typeof clue !== "string" || clue.trim().length === 0) {
      throw new Error(`Clue ${index + 1} is empty`);
    }
    if (clue.length > 200) {
      throw new Error(`Clue ${index + 1} exceeds 200 chars`);
    }
    if (normalize(clue).includes(answerNormalized)) {
      throw new Error(`Clue ${index + 1} leaks the answer`);
    }
  }
}

// ============================================================
// Normalization — lower-case + strip diacritics
// ============================================================

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
