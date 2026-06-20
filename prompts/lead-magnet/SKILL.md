---
name: lead-magnet
description: Create a high-converting lead magnet and 3 LinkedIn post variations
metadata:
  argument-hint: "topic or description of the lead magnet"
  user-invocable: true
---

# Lead Magnet Skill

Create high-converting, story-driven lead magnets for Mac's audience and draft LinkedIn posts to distribute them.

## Workflow
1. **Parse user input** for topic, format, and any special instructions
2. **Fetch YouTube transcript** if a YouTube URL was provided
3. **Research the topic** — mandatory before writing a single word (see `references/voice-and-rules.md` "Research First")
4. **Write the lead magnet** as a clean markdown document
5. **Draft 3 LinkedIn post variations** with different hooks
6. **Present everything** to Mac for review

---

## Step 1: Parse Input

Extract from the user's message:
- **TOPIC**: what the lead magnet is about
- **FORMAT**: one of — `guide`, `playbook`, `framework`, `swipe_file`, `checklist`, `prompt_pack` (default: guide)
- **SPECIAL INSTRUCTIONS**: any constraints, angles, or audience notes

Display your parsing:
```
Creating lead magnet:
- Topic: {TOPIC}
- Format: {FORMAT}
- Notes: {SPECIAL INSTRUCTIONS or "none"}
```

---

## Step 2: Fetch YouTube Transcript (if applicable)
If the user provides a YouTube URL, fetch the transcript and extract:
- Core topic and thesis
- Key frameworks or steps mentioned
- Specific numbers, results, or proof points
- Stories or examples used

---

## Step 3: Research the Topic
Before writing anything, deeply research the topic using the web.
- What are people actually struggling with around this topic?
- What's the conventional wisdom — and where does it fall short?
- What real frameworks or approaches are working right now?
- What would make someone feel like they got something genuinely valuable?

Ground the lead magnet in real research — not generic advice.

---

## Step 4: Write the Lead Magnet

### Hard Constraints
- **Max 1,500 words** — people don't read more than this
- **7th–8th grade reading level** — simple, plain language
- **Story and narrative driven** — open with a real problem or moment, not a definition
- **No jargon** — if a non-technical founder wouldn't know the word, don't use it
- **Practical** — every section should give the reader something actionable
- **End with a soft CTA** — invite them to follow Mac or stay tuned, no hard sell

### Structure
```
# [High-converting title]

## The Problem
[Open with the real pain — make them feel seen]

## Why the Usual Advice Fails
[Reframe — establish Mac's credibility and perspective]

## The Framework / Approach / Playbook
[The meat — clear, practical, story-driven sections]

## What This Looks Like in Practice
[Real example — ideally from Mac's own work or products]

## Where to Go From Here
[Soft close — invite connection, no pressure]
```

---

## Step 5: Draft 3 LinkedIn Post Variations

Write three post options to distribute the lead magnet, each with a different hook style:

**Variation A — Contrarian**
Challenge a common assumption. Open with a statement that makes people stop scrolling.

**Variation B — Pain First**
Open by naming the exact struggle the reader has. Make them feel understood before offering anything.

**Variation C — Results Led**
Open with a real outcome or result. Let the proof create curiosity.

Each post should:
- Be skimmable with white space
- End with "Comment [WORD] and I'll send it over" or similar engagement mechanic
- Sound like Mac — direct, conversational, no hype

---

## Step 6: Present to Mac

Output:
1. The full lead magnet
2. All 3 post variations clearly labelled
3. A recommendation on which post variation to lead with and why
