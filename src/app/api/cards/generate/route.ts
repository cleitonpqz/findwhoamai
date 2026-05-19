import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { Card, ProfileTypeId } from "@/types/domain";
import {
  PROFILE_TYPE_GUIDANCE,
  buildPrompt,
  parseJsonResponse,
  validateCard,
} from "@/lib/card-generation";

// ============================================================
// Anthropic client — initialized once per server instance
// ============================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// Request and response types
// ============================================================

interface GenerateCardRequest {
  profileType: ProfileTypeId;
  cluesPerCard?: number;
  exclusions?: string[];
  locale?: string;
}

// ============================================================
// Route handler — POST /api/cards/generate
// ============================================================

export async function POST(request: Request) {
  let body: GenerateCardRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    profileType,
    cluesPerCard = 10,
    exclusions = [],
    locale = "pt-BR",
  } = body;

  if (!PROFILE_TYPE_GUIDANCE[profileType]) {
    return NextResponse.json(
      { error: `Unknown profile type: ${profileType}` },
      { status: 400 },
    );
  }

  try {
    const card = await generateCard({
      profileType,
      cluesPerCard,
      exclusions,
      locale,
    });
    return NextResponse.json(card);
  } catch (error) {
    console.error("Card generation failed:", error);
    return NextResponse.json(
      { error: "Card generation failed" },
      { status: 500 },
    );
  }
}

// ============================================================
// Generation logic
// ============================================================

async function generateCard(params: {
  profileType: ProfileTypeId;
  cluesPerCard: number;
  exclusions: string[];
  locale: string;
}): Promise<Card> {
  const { profileType, cluesPerCard, exclusions, locale } = params;

  const prompt = buildPrompt({ profileType, cluesPerCard, exclusions, locale });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  // The response is a list of content blocks; we expect a single text block
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const parsed = parseJsonResponse(textBlock.text);
  validateCard(parsed, cluesPerCard);

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    profileType,
    answer: parsed.answer,
    locale,
    clues: parsed.clues.map((text: string, index: number) => ({
      order: index + 1,
      kind: "HINT" as const,
      text,
    })),
  };
}
