# Optimizations & Roadmap

This file tracks intentional decisions to defer optimizations until they matter.
The principle: optimize for things that have real users, not hypothetical ones.

## Current cost profile

Card generation via Claude Sonnet 4.5:

- ~520 input tokens + ~500 output tokens per card
- ~$0.01 per card
- A 10-round match costs ~$0.10

This is sustainable for development and demos but does not scale linearly with traffic.

## Public demo limit

The live demo at findwhoamai.com runs on a fixed Anthropic credit allowance.
When the credit runs out, card generation falls back to a small bundled set
(see `src/lib/api.ts`, `FAKE_CARDS`). Players will still be able to play, but
will see the same handful of cards repeating until the credit is topped up.

The yellow banner at the top of the site signals this to users.

## Optimizations to apply when needed

### 1. Switch to Claude Haiku 4.5

- 3-5x cheaper than Sonnet for similar quality on bounded tasks like card generation
- Trigger: when daily cost exceeds ~$5
- Effort: change one string in the model name

### 2. Persistent card cache

- Cache generated cards keyed by `(profileType, answer, locale)`
- Reuse cards across matches and across users
- Trigger: when the same answers start repeating across matches anyway
- Effort: add KV or Redis layer in front of the route handler

### 3. Anthropic prompt caching

- The fixed parts of the prompt (rules, profile type description) are identical
  across calls and can be cached server-side by Anthropic
- Reduces input token cost by up to 90% on cached portions
- Trigger: when input tokens dominate the cost
- Effort: add `cache_control` markers in the messages payload

### 4. Batch generation

- Ask Claude for 5 cards in a single request
- Amortizes the fixed prompt overhead across multiple cards
- Trigger: when we need pre-generated card pools (e.g., for a Daily Challenge feature)
- Effort: medium — requires schema and validator changes

### 5. Expand the fallback bundle ✅ DONE (Day 2)

- Bundle now contains 32 validated cards (8 per profile type)
- Generated once via `scripts/generate-fallback.ts` and committed to the repo
- Same validator the API uses ensured no answer leakage
- Demo remains fully playable when the Anthropic credit runs out
