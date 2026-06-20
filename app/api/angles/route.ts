import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"
import { ANGLES_SYSTEM_PROMPT } from "@/prompts/system"

export interface Angle {
  title: string
  summary: string
  angle: string
}

export async function POST(req: NextRequest) {
  try {
    const { topic, notes, research } = await req.json()

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const userMessage = [
      `TOPIC: ${topic}`,
      notes?.trim() ? `NOTES: ${notes}` : "",
      research?.length
        ? `RESEARCH CONTEXT:\n${research.map((r: { content: string }) => r.content).join("\n")}`
        : "",
      "Generate 3 distinct angles as a JSON array.",
    ]
      .filter(Boolean)
      .join("\n\n")

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: ANGLES_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0].message.content ?? "[]"

    // The model may return { angles: [...] } or just [...]
    let angles: Angle[]
    try {
      const parsed = JSON.parse(raw)
      angles = Array.isArray(parsed) ? parsed : (parsed.angles ?? [])
    } catch {
      throw new Error("Failed to parse angles JSON")
    }

    return NextResponse.json({ angles: angles.slice(0, 3) })
  } catch (err) {
    console.error("[angles] error:", err)
    return NextResponse.json({ error: "Failed to generate angles" }, { status: 500 })
  }
}
