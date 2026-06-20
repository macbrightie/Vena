import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

const MOCK_LINKEDIN_POSTS = [
  {
    content: "We spent 6 months building a feature we thought our users would love.\n\nWe launched it last week.\n\nTotal usage: 3% of our active base.\n\nThe lesson? Never assume you know what users want. Build a prototype in 3 days, validate it, and only then write the production code.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:1",
    date: new Date().toISOString()
  },
  {
    content: "If your SaaS is struggling to get traction, look at your landing page copy.\n\nIs it clear what you do within 3 seconds? Or is it filled with generic AI descriptions like 'optimize your efficiency'?\n\nDirect, clear hooks win. Jargon kills conversion.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:2",
    date: new Date(Date.now() - 86400000).toISOString()
  },
  {
    content: "The single best marketing strategy for developers is building in public.\n\nShare your learnings, share your database metrics, share your errors.\n\nAuthenticity builds an audience that actually trusts your product.",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:3",
    date: new Date(Date.now() - 172800000).toISOString()
  }
]

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
    const { profileUrl, limit = 5 } = await req.json()
    if (!profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 })
    }

    const token = process.env.APIFY_API_TOKEN
    const actorId = process.env.APIFY_ACTOR_ID || "helova/linkedin-posts-scraper"
    const isMock = !token || token === "your-apify-token"

    let scrapedPosts: { content: string; url: string; date: string }[] = []
    let source = ""

    if (isMock) {
      scrapedPosts = MOCK_LINKEDIN_POSTS.slice(0, limit)
      source = "LinkedIn (Mock Fallback)"
    } else {
      try {
        const apifyRes = await fetch(
          `https://api.apify.com/v2/acts/${actorId}/run-sync?token=${token}&timeout=60`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              urls: [profileUrl.trim()],
              limit: Number(limit)
            })
          }
        )

        if (!apifyRes.ok) {
          throw new Error(`Apify request failed: ${apifyRes.statusText}`)
        }

        const data = await apifyRes.json()
        const datasetId = data.defaultDatasetId
        if (!datasetId) {
          throw new Error("Dataset ID missing in Apify run result")
        }

        const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`)
        if (!itemsRes.ok) {
          throw new Error("Failed to retrieve Apify dataset items")
        }

        const items = (await itemsRes.json()) as Record<string, unknown>[]
        scrapedPosts = items.map((item) => ({
          content: String(item.text || item.content || item.description || ""),
          url: String(item.url || item.postUrl || profileUrl),
          date: String(item.createdTime || item.publishedAt || new Date().toISOString())
        })).filter((p) => p.content && p.content.trim().length > 0)

        source = `Apify LinkedIn Scraper (${actorId})`
      } catch (err) {
        console.warn("[linkedin-sync] Apify run failed, falling back to mock posts:", err)
        scrapedPosts = MOCK_LINKEDIN_POSTS.slice(0, limit)
        source = "LinkedIn (Mock Fallback - API error)"
      }
    }

    // Classify all posts in parallel
    const postsWithCategories = await Promise.all(
      scrapedPosts.map(async (post) => {
        const category = await classifyContent(post.content)
        return {
          ...post,
          category
        }
      })
    )

    return NextResponse.json({
      success: true,
      source,
      posts: postsWithCategories
    })

  } catch (err) {
    console.error("[linkedin-sync] error:", err)
    const message = err instanceof Error ? err.message : "Failed to sync LinkedIn posts"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
