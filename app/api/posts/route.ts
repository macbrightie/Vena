import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET — list all vault posts
export async function GET() {
  const { data, error } = await supabase
    .from("post_vault")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}

// POST — add a post to the vault
export async function POST(req: NextRequest) {
  const { content, topic, url, category, author, hasImage, has_image } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: "Post content is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("post_vault")
    .insert({
      content: content.trim(),
      topic: topic?.trim() ?? null,
      url: url?.trim() ?? null,
      category: category?.trim() ?? null,
      author: author?.trim() ?? null,
      has_image: !!(hasImage ?? has_image),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data }, { status: 201 })
}

// DELETE — remove a post from the vault
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  const { error } = await supabase.from("post_vault").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH — update category of a post in the vault
export async function PATCH(req: NextRequest) {
  const { id, category } = await req.json()

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("post_vault")
    .update({ category })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}
