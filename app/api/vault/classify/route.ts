import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

async function classifyContent(content: string): Promise<string> {
  try {
    const classification = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI classifier. Classify the following LinkedIn post into one of these exact categories: "story", "education", "news", or "other".
- "story": Personal experiences, case studies, building in public narrative.
- "education": Tips, tutorials, checklists, advice, how-to guides.
- "news": Industry trends, feature releases, product updates, news announcements.
- "other": Anything else.
Output ONLY the category name in lowercase (no punctuation, no markdown, no other text).`
        },
        {
          role: "user",
          content: content.slice(0, 1000)
        }
      ],
      temperature: 0.1,
      max_tokens: 5,
    })
    const detected = classification.choices[0].message.content?.trim().toLowerCase()
    if (detected && ["story", "education", "news", "other"].includes(detected)) {
      return detected
    }
  } catch (err) {
    console.error("[classify] OpenAI classification failed:", err)
  }
  return "other"
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const category = await classifyContent(content)
    return NextResponse.json({ category })
  } catch (err) {
    console.error("[classify route] error:", err)
    const message = err instanceof Error ? err.message : "Classification failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
