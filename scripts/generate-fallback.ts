import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ProfileType = "PERSON" | "PLACE" | "THING" | "ANIMAL";

const CARDS_PER_TYPE = 8;
const PROFILE_TYPES: ProfileType[] = ["PERSON", "PLACE", "THING", "ANIMAL"];

const GUIDANCE: Record<ProfileType, string> = {
  PERSON:
    "A real or fictional person/character (historical figure, celebrity, fictional character)",
  PLACE:
    "A geographical location (city, country, monument, landmark, natural wonder)",
  THING:
    "An object, invention, or concept (everyday item, technology, food, abstract concept)",
  ANIMAL: "An animal species (mammal, bird, fish, reptile, insect)",
};

async function generateBatch(profileType: ProfileType, count: number) {
  const prompt = `You are generating ${count} cards for a guessing game inspired by the Brazilian board game "Perfil".

Profile type: ${profileType}
Description: ${GUIDANCE[profileType]}

Write the answers and ALL clues in Brazilian Portuguese (pt-BR).

For each card, pick a single answer of this profile type. Use varied, well-known answers — no obscure picks. Then write exactly 10 clues per card, ordered from HARDEST (most obscure) to EASIEST (makes the answer obvious).

Hard rules:
- The answer MUST NOT appear in any clue, in any form.
- Clue 1 should be hard. Clue 10 should be obvious.
- Each clue must be a single sentence under 200 characters.
- No board game actions, no meta-commentary.
- All ${count} answers must be different from each other.

Respond with ONLY a valid JSON array, no markdown:

[
  {"answer": "...", "clues": ["clue 1", "...", "clue 10"]},
  ...
]`;

  console.log(`Generating ${count} ${profileType} cards...`);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in response");
  }

  const cleaned = textBlock.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length !== count) {
    throw new Error(`Expected ${count} cards, got ${parsed.length}`);
  }

  return parsed;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function validate(
  card: { answer: string; clues: string[] },
  profileType: string,
) {
  if (card.clues.length !== 10) {
    throw new Error(`${profileType}/${card.answer}: wrong clue count`);
  }
  const answerNorm = normalize(card.answer);
  card.clues.forEach((clue, i) => {
    if (!clue || clue.length > 200) {
      throw new Error(
        `${profileType}/${card.answer}: clue ${i + 1} invalid length`,
      );
    }
    if (normalize(clue).includes(answerNorm)) {
      throw new Error(
        `${profileType}/${card.answer}: clue ${i + 1} leaks the answer`,
      );
    }
  });
}

async function main() {
  const allCards: Array<{
    profileType: ProfileType;
    answer: string;
    clues: string[];
  }> = [];

  for (const type of PROFILE_TYPES) {
    const batch = await generateBatch(type, CARDS_PER_TYPE);
    for (const card of batch) {
      validate(card, type);
      allCards.push({
        profileType: type,
        answer: card.answer,
        clues: card.clues,
      });
    }
    console.log(`  ✓ ${batch.length} ${type} cards validated`);
  }

  const outputPath = path.join("src", "lib", "fallback-cards.json");
  fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2), "utf-8");
  console.log(`\nWrote ${allCards.length} cards to ${outputPath}`);
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
