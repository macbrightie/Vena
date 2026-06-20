import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { openai, MODEL } from "@/lib/openai"
import { VOICE_SYSTEM_PROMPT } from "@/prompts/system"
import type { GenerateRequest } from "@/types"
import fs from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { topic, research, additionalContext, voiceContext, referencePost, vaultPosts } = body

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    // 1. Fetch style vault posts if not in payload
    let referencePosts = ""
    if (vaultPosts && vaultPosts.length > 0) {
      referencePosts = vaultPosts.join("\n\n---\n\n")
    } else {
      const { data: dbVaultPosts, error } = await supabase
        .from("post_vault")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("[generate] supabase error:", error)
      }
      referencePosts = (dbVaultPosts ?? []).map((p) => p.content).join("\n\n---\n\n")
    }

    // 2. Read writing playbook guides dynamically from prompts directory
    let playbookContent = ""
    try {
      const promptsDir = path.join(process.cwd(), "prompts", "writing-a-good-post")
      const playbookPath = path.join(promptsDir, "LinkedIn_Post_Playbook.md")
      const guidePath = path.join(promptsDir, "LinkedIn_Post_Frameworks_and_Writing_Guide.md")
      
      const playbookText = await fs.readFile(playbookPath, "utf-8")
      const guideText = await fs.readFile(guidePath, "utf-8")
      
      playbookContent = `
---
LINKEDIN POST PLAYBOOK GUIDE:
${playbookText}

---
LINKEDIN POST FRAMEWORKS & WRITING GUIDE:
${guideText}
`.trim()
    } catch (fsErr) {
      console.warn("[generate] Could not load playbook markdown files:", fsErr)
    }

    const systemPrompt = `
${VOICE_SYSTEM_PROMPT}

${playbookContent}
`.trim()

    const userMessage = [
      voiceContext?.trim()
        ? `VOICE REFERENCE DOCUMENTS (study these to understand who the writer is — their style, achievements, and background):\n${voiceContext}`
        : "",
      referencePost?.trim()
        ? `STRUCTURAL REFERENCE POST (write a post with a similar structure, rhythm, and format to this — but about the new topic and in the writer's own voice):\n${referencePost}`
        : "",
      `TOPIC: ${topic}`,
      research?.length
        ? `\nRESEARCH INSIGHTS:\n${research.map((r) => r.content).join("\n")}`
        : "",
      referencePosts
        ? `\nMY VAULT POSTS (study these for voice, pacing, formatting, and style templates):\n${referencePosts}`
        : "",
      additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}` : "",
      "\nNow write the LinkedIn post.",
    ]
      .filter(Boolean)
      .join("\n")

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content ?? ""

    return NextResponse.json({
      content,
      characterCount: content.length,
    })
  } catch (err) {
    console.error("[generate] error:", err)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
