# Editorial Review — AI Analysis (Future Feature)

## Overview

A planned feature to replace the current client-side QA checklist with a Claude-powered
editorial analysis. When triggered from the article detail page, it would send the draft
to Claude and return a structured review report.

## Two implementation options

### Option A — Direct Claude API call (recommended)
- Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel env vars
- New API route: `POST /api/articles/[id]/review`
- Route fetches article from Airtable, builds prompt, calls Claude, streams response back
- Frontend renders the streamed analysis in the right panel
- Completely independent of n8n — read-only, no pipeline changes

### Option B — n8n webhook
- New n8n workflow triggered by webhook from admin site
- Receives record ID → fetches article → calls Claude → returns JSON
- Admin site calls webhook and polls or waits for response
- More setup, consistent with existing architecture

## What Claude should analyse

Fetch from Airtable before sending to Claude:
- `Current Draft HTML` — the full draft
- `Current Draft Plain Text` — for scanning
- `Missing Terms` — NLP terms absent from draft (set by WF1/WF2)
- `Voice` — couples / family / solo / friends / active-hiking
- `Target Word Count` — from NeuronWriter
- `NLP Brief — Body Basic` — high-priority terms with frequency targets
- `NLP Brief — Body Extended` — extended terms

## Analysis Claude should perform

1. **Voice consistency** — scan for words contradicting the Voice field
   - Voice = couples but text contains "solo", "travelling alone", "by yourself"
   - Voice = solo but text contains "your partner", "as a couple", "romantic"
   - Voice = family but text contains "adults only", "no children", "child-free"
   - Voice = active-hiking but contains no hiking/trail/elevation language
   - Flag all instances, not just the first

2. **Factual claims** — read the intro and key claims, flag anything that seems
   implausible, vague, or that requires a source (human or AI judgment required here)

3. **NLP coverage** — cross-reference `Missing Terms` field with the draft;
   suggest natural placements for each missing term

4. **Word count** — actual vs target, percentage off, recommendation

5. **Structure** — count H2 sections, check for tip/note/warning boxes,
   assess paragraph length and flow

6. **Overall quality** — opening hook strength, conclusion effectiveness,
   internal repetition, readability for the target Voice audience

## Suggested prompt structure

```
You are an editorial reviewer for a Croatian tourism website targeting English-speaking visitors.

Article details:
- Voice/audience: {voice}
- Target word count: {targetWordCount}
- Missing NLP terms: {missingTerms}

Draft:
{currentDraftHTML}

Please review this article and provide:
1. Voice consistency check — list any language that contradicts the {voice} audience
2. Factual concerns — flag any claims that seem vague, implausible, or unsourced
3. Missing NLP terms — for each missing term, suggest where it could be naturally placed
4. Word count assessment — current count vs target, what to cut or expand
5. Structure assessment — H2 count, paragraph length, tip boxes, overall flow
6. Overall verdict — approve as-is / minor revision needed / major revision needed

Be specific and actionable. Reference exact phrases from the draft where relevant.
```

## UI placement

- Button in the right panel of the article detail Draft tab (already exists as "Editorial Review")
- Currently runs client-side checks only
- When AI version is built: clicking the button calls `/api/articles/[id]/review`,
  shows a loading state, then renders the streamed response in the right panel
- "← Back to actions" button returns to the action panel

## Current state

The client-side version already runs these checks automatically using regex and
term-matching (no API call):
- Voice mismatch detection (`lib/nlp.ts` — `getAllVoiceMismatches`)
- NLP term coverage (`lib/nlp.ts` — `getTermCoverage`)
- Word count vs target (`lib/nlp.ts` — `countWords`, `getWordCountStatus`)
- H2/H3 count, tip boxes, numbered lists (`lib/nlp.ts` — `checkStructure`)
- Fact verification checkbox status (reads `Fact Verification Complete` from Airtable)
