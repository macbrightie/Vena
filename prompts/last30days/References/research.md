# One-Shot Research Mode

## Purpose
Research what is actually being discussed, debated, and upvoted in Mac's niche across the last 30 days. Ground every output in real signals — not assumptions or pre-existing knowledge.

---

## Research Execution

### Step 1 — Parse Input
Extract from the user's message:
- **TOPIC**: what to research
- **ANGLE** (optional): any specific angle or comparison requested (e.g. "X vs Y")
- **FORMAT** (optional): standard briefing, comparative mode, or watchlist update

### Step 2 — Source Priority
Search in this order — weight sources by engagement signal strength:

1. **Reddit** — r/entrepreneur, r/startups, r/SaaS, r/nocode, r/ChatGPT, r/artificial, r/productivity — look for top posts and comment threads from last 30 days
2. **X / Twitter** — look for threads with high engagement, debates, hot takes from builders and founders
3. **YouTube** — search for videos on the topic published in last 30 days with high view counts — extract titles, hooks, and key arguments from transcripts if available
4. **Web** — blogs, newsletters, product launches, essays
5. **Hacker News** — Show HN posts, Ask HN threads relevant to the topic

- EXCLUDE purely technical/developer content with no founder or product angle
- PRIORITIZE content where non-technical founders or operators are the ones talking
- Do NOT output a raw "Sources:" list — synthesize instead

---

## Synthesis

### Judge Agent Rules:
1. Weight Reddit/X HIGHER — these are real engagement signals
2. Weight YouTube HIGH — views + transcript signal real interest
3. Weight web LOWER — no direct engagement data
4. Identify cross-source patterns — if something shows up across 3+ sources, it's a real trend
5. Extract top 3–5 actionable insights with the strongest signal

**Ground synthesis in ACTUAL research — not pre-existing knowledge.**

### Citation Rules
- Cite sparingly: 1–2 sources per insight
- Priority: @handles > r/subreddits > YouTube channels > web sources
- Use publication names or handles — never raw URLs
- Lead with people and communities, not publications

---

## Display Results

Output a clean briefing with:

```
## /last30days Briefing: [TOPIC]
### What's Actually Being Discussed
[3–5 insights grounded in real sources]

### The Strongest Signal
[The single most upvoted / debated angle right now]

### Angles Worth Posting About
[3 specific content angles Mac could take based on this research]

### What I Can Help With Next
[Offer to go deeper on any angle, or jump to /lead-magnet or /linkedin-post]
```
