import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"
import { REFINE_SYSTEM_PROMPT } from "@/prompts/system"
import { supabase } from "@/lib/supabase"
import fs from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const { currentContent, instruction, voiceContext, vaultPosts } = await req.json()

    if (!currentContent?.trim()) {
      return NextResponse.json({ error: "Current content is required" }, { status: 400 })
    }
    if (!instruction?.trim()) {
      return NextResponse.json({ error: "Change instruction is required" }, { status: 400 })
    }

    // 1. Fetch style vault posts if not provided in payload
    let referencePosts = ""
    if (vaultPosts && Array.isArray(vaultPosts) && vaultPosts.length > 0) {
      referencePosts = vaultPosts.join("\n\n---\n\n")
    } else {
      const { data: dbVaultPosts, error } = await supabase
        .from("post_vault")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("[refine] supabase error:", error)
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
      console.warn("[refine] Could not load playbook markdown files:", fsErr)
    }

    const systemPrompt = `
${REFINE_SYSTEM_PROMPT}

${playbookContent}
`.trim()

    const userMessage = [
      voiceContext?.trim()
        ? `VOICE REFERENCE DOCUMENTS (study this style):\n${voiceContext}\n`
        : "",
      referencePosts?.trim()
        ? `MY VAULT POSTS (study these for style, phrasing, structures, hook types, and endings):\n${referencePosts}\n`
        : "",
      `CURRENT DRAFT:\n${currentContent}`,
      `\nCHANGE REQUEST: ${instruction}`,
      `\nINSTRUCTIONS FOR REVISION:
1/ Analyze the change request.
2/ If it refers to changing or improving the hook, CTA, or rehook, search the provided PLAYBOOK guides for the specific rules (e.g., Movie Preview hook structure: Cast/Setting/Genre, Story, Conflict, and Director's Cut; or bucket-based CTA formats) and apply them strictly.
3/ Study "MY VAULT POSTS" to match the user's natural pacing, length, formatting, and style.
4/ Maintain a direct, warm, active, and personal tone. Return the revised draft in the requested JSON structure.`,
    ].filter(Boolean).join("\n")

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0].message.content ?? "{}"
    let result: { content: string; summary: string }

    try {
      result = JSON.parse(raw)
    } catch {
      throw new Error("Failed to parse refine response JSON")
    }

    return NextResponse.json({
      content: result.content ?? "",
      summary: result.summary ?? "Post updated",
    })
  } catch (err) {
    console.error("[refine] error:", err)
    return NextResponse.json({ error: "Failed to refine post" }, { status: 500 })
  }
}
