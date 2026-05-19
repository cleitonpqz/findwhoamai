import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import type { ProfileTypeId } from "../src/types/domain";
import {
  buildPrompt,
  parseJsonResponse,
  validateCard,
  normalize,
} from "../src/lib/card-generation";

config({ path: ".env.local" });

// ============================================================
// Configuration constants
// ============================================================

const PROFILE_TYPE: ProfileTypeId = "ANIMAL";
const NUMBER_OF_CALLS = 50;
const SCENARIO_NAME = "baseline-no-exclusions";
const LOCALE = "pt-BR";

// ============================================================
// Types
// ============================================================

interface CallResult {
  callIndex: number;
  answer: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  error: string;
}

interface Summary {
  scenarioName: string;
  profileType: ProfileTypeId;
  locale: string;
  numberOfCalls: number;
  successfulCalls: number;
  failedCalls: number;
  uniqueAnswers: number;
  topFive: Array<{ answer: string; count: number }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  runAt: string;
}

// ============================================================
// Main execution
// ============================================================

async function main() {
  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY not found in .env.local");
    process.exit(1);
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  console.log(
    `Running scenario: ${SCENARIO_NAME} (${PROFILE_TYPE}, ${LOCALE}, ${NUMBER_OF_CALLS} calls)\n`,
  );

  const results: CallResult[] = [];

  // Execute calls sequentially
  for (let i = 0; i < NUMBER_OF_CALLS; i++) {
    const callIndex = i + 1;
    const result = await executeCall(anthropic, callIndex);
    results.push(result);

    if (result.success) {
      console.log(`  [${callIndex}/${NUMBER_OF_CALLS}] ${result.answer} (${result.latencyMs}ms)`);
      // Sleep 100ms between successful calls to be polite
      await sleep(100);
    } else {
      console.log(
        `  [${callIndex}/${NUMBER_OF_CALLS}] FAILED: ${result.error}`,
      );
    }
  }

  // Compute aggregated metrics
  const summary = computeSummary(results);

  // Print summary to console
  printSummary(summary);

  // Write output files
  const benchmarksDir = path.join(process.cwd(), "benchmarks");
  if (!fs.existsSync(benchmarksDir)) {
    fs.mkdirSync(benchmarksDir, { recursive: true });
  }

  const csvPath = path.join(benchmarksDir, `${SCENARIO_NAME}.csv`);
  const summaryPath = path.join(benchmarksDir, `${SCENARIO_NAME}.summary.json`);

  writeCsv(csvPath, results);
  writeSummaryJson(summaryPath, summary);

  console.log(`\nWritten:`);
  console.log(`  ${csvPath}`);
  console.log(`  ${summaryPath}`);
}

// ============================================================
// Execute a single call with retry logic for 429 errors
// ============================================================

async function executeCall(
  anthropic: Anthropic,
  callIndex: number,
): Promise<CallResult> {
  const startTime = Date.now();
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // For baseline-no-exclusions scenario, always pass empty exclusions array
      const prompt = buildPrompt({
        profileType: PROFILE_TYPE,
        cluesPerCard: 10,
        exclusions: [],
        locale: LOCALE,
      });

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const latencyMs = Date.now() - startTime;

      // Extract text block
      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      // Parse and validate
      const parsed = parseJsonResponse(textBlock.text);
      validateCard(parsed, 10);

      return {
        callIndex,
        answer: parsed.answer,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latencyMs,
        success: true,
        error: "",
      };
    } catch (error: unknown) {
      // Check for rate limiting (429 error)
      if (
        error instanceof Anthropic.APIError &&
        error.status === 429 &&
        attempt < maxRetries - 1
      ) {
        console.log(
          `  [${callIndex}/${NUMBER_OF_CALLS}] Rate limited, waiting 5s...`,
        );
        await sleep(5000);
        continue;
      }

      // Any other error or max retries exhausted
      const latencyMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        callIndex,
        answer: "",
        inputTokens: 0,
        outputTokens: 0,
        latencyMs,
        success: false,
        error: errorMessage,
      };
    }
  }

  // Should never reach here, but TypeScript needs a return
  const latencyMs = Date.now() - startTime;
  return {
    callIndex,
    answer: "",
    inputTokens: 0,
    outputTokens: 0,
    latencyMs,
    success: false,
    error: "Max retries exceeded",
  };
}

// ============================================================
// Compute aggregated metrics
// ============================================================

function computeSummary(results: CallResult[]): Summary {
  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);

  // Count unique answers (case-insensitive, normalized)
  const answerCounts = new Map<string, number>();
  for (const result of successfulResults) {
    const normalized = normalize(result.answer);
    answerCounts.set(normalized, (answerCounts.get(normalized) ?? 0) + 1);
  }

  // Sort by count descending, then take top 5
  const sortedAnswers = Array.from(answerCounts.entries())
    .map(([answer, count]) => {
      // Find the original answer (not normalized) to display
      const original = successfulResults.find(
        (r) => normalize(r.answer) === answer,
      )?.answer ?? answer;
      return { answer: original, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalInputTokens = successfulResults.reduce(
    (sum, r) => sum + r.inputTokens,
    0,
  );
  const totalOutputTokens = successfulResults.reduce(
    (sum, r) => sum + r.outputTokens,
    0,
  );

  // Sonnet 4.5 pricing: $3 per 1M input, $15 per 1M output
  const inputCost = (totalInputTokens / 1_000_000) * 3;
  const outputCost = (totalOutputTokens / 1_000_000) * 15;
  const estimatedCostUsd = inputCost + outputCost;

  return {
    scenarioName: SCENARIO_NAME,
    profileType: PROFILE_TYPE,
    locale: LOCALE,
    numberOfCalls: NUMBER_OF_CALLS,
    successfulCalls: successfulResults.length,
    failedCalls: failedResults.length,
    uniqueAnswers: answerCounts.size,
    topFive: sortedAnswers,
    totalInputTokens,
    totalOutputTokens,
    estimatedCostUsd: parseFloat(estimatedCostUsd.toFixed(3)),
    runAt: new Date().toISOString(),
  };
}

// ============================================================
// Console output
// ============================================================

function printSummary(summary: Summary) {
  console.log(`\nSummary:`);
  console.log(`  Successful: ${summary.successfulCalls}/${summary.numberOfCalls}`);
  console.log(`  Unique answers: ${summary.uniqueAnswers}`);

  const topFiveStr = summary.topFive
    .map((t) => `${t.answer} (${t.count})`)
    .join(", ");
  console.log(`  Top 5: ${topFiveStr}`);
  console.log(`  Total cost: $${summary.estimatedCostUsd.toFixed(2)}`);
}

// ============================================================
// File output
// ============================================================

function writeCsv(filePath: string, results: CallResult[]) {
  const header = "call_index,answer,input_tokens,output_tokens,latency_ms,success,error\n";
  const rows = results.map((r) => {
    // Escape CSV fields (handle commas and quotes)
    const answer = escapeCsvField(r.answer);
    const error = escapeCsvField(r.error);
    return `${r.callIndex},${answer},${r.inputTokens},${r.outputTokens},${r.latencyMs},${r.success},${error}`;
  });

  fs.writeFileSync(filePath, header + rows.join("\n"), "utf-8");
}

function writeSummaryJson(filePath: string, summary: Summary) {
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), "utf-8");
}

function escapeCsvField(field: string): string {
  if (!field) return "";
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// ============================================================
// Utilities
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Entry point
// ============================================================

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
