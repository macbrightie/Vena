import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

function extractYoutubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

const MOCK_COMMENTS = [
  {
    author: "SaaSFriend",
    text: "This onboarding is exactly what I needed. We noticed a 20% drop-off in our product's signup flow last week and couldn't pinpoint why. Simplifying the fields as you showed is a game-changer.",
    likes: 42,
    publishedAt: new Date().toISOString()
  },
  {
    author: "GrowthMarketer",
    text: "The distribution ideas you highlighted here are spot on. Most founders spend too much time building and not enough time talking to customers. What is your go-to channel for the first 100 users?",
    likes: 27,
    publishedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    author: "DevBuilder",
    text: "Great video. Quick question: how do you balance adding custom integrations versus keeping the codebase clean early on? We are struggling with feature creep.",
    likes: 15,
    publishedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    author: "ProductLead",
    text: "Fully agree on point #2. Customer development is sales, and sales is customer development. If you are not charging on day one, you are just building a hobby project.",
    likes: 9,
    publishedAt: new Date(Date.now() - 86400000).toISOString()
  }
]

async function classifyContent(content: string): Promise<string> {
  try {
    const classification = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI classifier. Classify the following social media post/comment into one of these exact categories: "story", "education", "news", or "other".
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
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const videoId = extractYoutubeVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL format. Please provide a valid watch link." }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    const isMockKey = !apiKey || apiKey === "your-youtube-api-key"

    let retrievedComments: { author: string; text: string; likes: number; publishedAt: string }[] = []
    let source = ""

    if (isMockKey) {
      retrievedComments = MOCK_COMMENTS
      source = "YouTube (Mock Fallback)"
    } else {
      const apiRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=15`,
        { headers: { "Accept": "application/json" } }
      )

      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => ({}))
        console.warn("[youtube] API call failed, falling back to mock comments. Details:", errData)
        retrievedComments = MOCK_COMMENTS
        source = "YouTube (Mock Fallback - API error)"
      } else {
        const data = await apiRes.json()
        const items = (data.items || []) as Record<string, unknown>[]

        retrievedComments = items.map((item) => {
          const snippetObj = item.snippet as Record<string, unknown> | undefined
          const commentSnippet = (snippetObj?.topLevelComment as Record<string, unknown> | undefined)?.snippet as Record<string, unknown> | undefined
          return {
            author: String(commentSnippet?.authorDisplayName || "Anonymous"),
            text: String(commentSnippet?.textDisplay || ""),
            likes: Number(commentSnippet?.likeCount || 0),
            publishedAt: String(commentSnippet?.publishedAt || new Date().toISOString())
          }
        })
        source = "YouTube API"
      }
    }

    // Classify all comments in parallel
    const commentsWithCategories = await Promise.all(
      retrievedComments.map(async (c) => {
        const category = await classifyContent(c.text)
        return {
          ...c,
          category
        }
      })
    )

    return NextResponse.json({
      success: true,
      source,
      videoId,
      comments: commentsWithCategories
    })

  } catch (err) {
    console.error("[youtube] error:", err)
    const message = err instanceof Error ? err.message : "Failed to fetch YouTube comments"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
