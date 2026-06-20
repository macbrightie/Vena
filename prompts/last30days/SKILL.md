---
name: last30days
description: Research trending topics in Mac's niche from the last 30 days
metadata:
  argument-hint: "topic to research (e.g. 'AI coding tools' or 'no-code MVPs')"
  user-invocable: true
---

# /last30days Skill

Research what is actually being discussed, upvoted, and debated in Mac's niche right now.

## How to Use
```
/last30days [topic]
/last30days [X vs Y]  ← comparative mode
```

## What This Skill Does
1. Reads `references/context.md` to understand Mac's niche and filters
2. Reads `references/watchlist.md` for standing topics and communities to check
3. Executes research per `references/research.md` — Reddit, X, YouTube, web
4. Synthesizes findings into a clean briefing per `references/briefing.md`
5. Appends the run to `references/history.md` for future reference
6. Presents 3 specific content angles Mac can act on immediately

## Output
A grounded briefing with real signals, the strongest trend, and 3 ready-to-use content angles.

## What Comes Next
After running this skill, Mac can:
- Jump to `/lead-magnet [angle]` to turn an insight into a lead magnet
- Jump to `/linkedin-post [angle]` to draft a post directly
- Say "go deeper on [angle]" to research further before writing
