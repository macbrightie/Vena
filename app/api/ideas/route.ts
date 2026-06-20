import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"
import crypto from "crypto"
import type { PlannerItem } from "@/types"

export const maxDuration = 60

const IDEAS_SYSTEM_PROMPT = `
You are a LinkedIn content strategist. Given a user's writing focus (niche, target audience, and specialization), generate a structured schedule of post ideas.

Your writing persona is the "Technical Educator" ghostwriter. You write for professionals, founders, and creators, translating technical concepts into high-value business takeaways.

You must categorize every post idea into one of these 4 specific categories:
1. "marketing": Practical organic growth, LinkedIn outreach hacks, positioning, or correcting common marketing mistakes (e.g., why outbound cold emails fail, how to leverage organic content loops).
2. "ai-business": Real-life comparisons of AI tools (e.g., Claude vs ChatGPT based on building experiences), setting up cloud AI workflows, or calculating ROI of automation.
3. "development": Translating database choice, technical debt, scaling structures, or developer tools into relatable but in-depth concepts for non-technical founders (e.g. database locking, SQL index optimization, choosing between Postgres and DynamoDB).
4. "productivity": Actionable AI cheatsheets, prompt guides, or routine hacks modeled after Ruben Hassid. Must be highly structured, visual, direct, and actionable.

For each generated idea, assign one of the 4 Funnel Buckets:
- "growth": Broad reach, comments/discussion focus.
- "authority": Case studies, client proof, framework breakdowns.
- "conversion": Lead magnets, cohorts, booking links, paid offers.
- "personal": High trust, human updates, fails and business behind-the-scenes.

For the writing framework, pick:
- "pass" for conversion or direct-advice posts (specifically "conversion" bucket).
- "slay" for storytelling or educational posts ("growth", "authority", or "personal" buckets).

Every post concept must formulate:
- headline: A hook structured around the Movie Preview Hook framework: Cast/Setting/Genre (familiar brands/names), Conflict (unexpected tension), and Director's Cut (expert/lived perspective). Maximum 10 words.
- outline:
  - If using PASS framework (conversion/advice):
    - problem: Name a specific problem in the reader's language.
    - agitate: Sharpen the cost of the problem / hint at the fix.
    - solution: Step-by-step solution outline.
    - rehook: Closing rehook that loops back to the opening hook/problem.
  - If using SLAY framework (story/educational):
    - story: Tell a specific mid-action story scene or recent moment (How I shift, not how to).
    - lesson: The general principle or takeaway learned from this story.
    - actionable: 2-3 concrete steps the reader can take (formatted using "1/  ", "2/  " without bold text).
    - you: "what about you?" / direct question to invite comments.

- searchQuery: A clean, sentence-long search query optimized for Google/Tavily semantic search to fetch real-world discussions (e.g. "postgres database lock query optimization lesson" or "saas outbound marketing mistakes case studies").

JSON OUTPUT ONLY. Return a JSON object with this shape:
{
  "newIdeas": [
    {
      "category": "marketing" | "ai-business" | "development" | "productivity",
      "bucket": "growth" | "authority" | "conversion" | "personal",
      "framework": "pass" | "slay",
      "angle": "Punchy title of the angle",
      "headline": "A sharp LinkedIn-ready movie-preview hook (Cast/Setting + Conflict)",
      "searchQuery": "Optimized sentence-long query",
      "outline": {
        "problem": "PASS: The specific problem (leave empty if slay)",
        "agitate": "PASS: The cost of the problem (leave empty if slay)",
        "solution": "PASS: Step-by-step solution outline (leave empty if slay)",
        "rehook": "PASS: Closing rehook looping back to the hook (leave empty if slay)",
        "story": "SLAY: Specific mid-action story scene/moment (leave empty if pass)",
        "lesson": "SLAY: Verifiable lesson or learning (leave empty if pass)",
        "actionable": "SLAY: Concrete step-by-step takeaway for the user (leave empty if pass)",
        "you": "SLAY: Direct invite or question to the reader (leave empty if pass)"
      }
    }
  ]
}
`.trim()

export async function POST(req: NextRequest) {
  try {
    const { focus, lockedItems = [] }: { focus: string; lockedItems: PlannerItem[] } = await req.json()

    if (!focus?.trim()) {
      return NextResponse.json({ error: "Focus context is required" }, { status: 400 })
    }

    // 1. Calculate missing items per category (target: 5 items per category)
    const getLockedCount = (cat: string) => 
      lockedItems.filter((item: PlannerItem) => item.category === cat).length

    const counts = {
      "marketing": Math.max(0, 5 - getLockedCount("marketing")),
      "ai-business": Math.max(0, 5 - getLockedCount("ai-business")),
      "development": Math.max(0, 5 - getLockedCount("development")),
      "productivity": Math.max(0, 5 - getLockedCount("productivity"))
    }

    const totalToGenerate = counts.marketing + counts["ai-business"] + counts.development + counts.productivity

    // If everything is locked, return immediately
    if (totalToGenerate === 0) {
      return NextResponse.json({ schedule: lockedItems })
    }

    const userPrompt = `
Generate exactly the requested number of new ideas.
User Focus Context: "${focus}"

You MUST generate exactly:
- ${counts.marketing} new ideas for category "marketing"
- ${counts["ai-business"]} new ideas for category "ai-business"
- ${counts.development} new ideas for category "development"
- ${counts.productivity} new ideas for category "productivity"

Here are the existing ideas already locked (do NOT duplicate their concepts, angles, or hooks):
${JSON.stringify(lockedItems.map((item: PlannerItem) => ({ category: item.category, headline: item.headline, angle: item.angle })))}

Return the newly generated ideas in the JSON object format requested.
`.trim()

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: IDEAS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0].message.content ?? "{}"
    let parsed: { newIdeas: Partial<PlannerItem>[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error("Failed to parse AI response JSON")
    }

    const newGeneratedList = (parsed.newIdeas || []).map((idea) => ({
      id: `idea-${crypto.randomUUID()}`,
      category: idea.category,
      bucket: idea.bucket || "growth",
      framework: idea.framework || "slay",
      angle: idea.angle || "New Angle",
      headline: idea.headline || "",
      searchQuery: idea.searchQuery || "",
      outline: {
        problem: idea.outline?.problem || "",
        agitate: idea.outline?.agitate || "",
        solution: idea.outline?.solution || "",
        rehook: idea.outline?.rehook || "",
        story: idea.outline?.story || "",
        lesson: idea.outline?.lesson || "",
        actionable: idea.outline?.actionable || "",
        you: idea.outline?.you || ""
      },
      locked: false
    }))

    // Combine locked items and new generated items
    const combinedSchedule = [...lockedItems, ...newGeneratedList]

    return NextResponse.json({ schedule: combinedSchedule })
  } catch (err) {
    console.error("[ideas] error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate ideas"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
