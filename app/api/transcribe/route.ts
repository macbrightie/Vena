import { NextRequest, NextResponse } from "next/server"
import { openai } from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    })

    return NextResponse.json({ text: response.text })
  } catch (error: unknown) {
    console.error("[transcribe] Error transcribing audio:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}
