import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.cz",
  "https://nitter.privacydev.net",
  "https://nitter.projectsegfaut.im",
  "https://nitter.no-logs.com"
]

const MOCK_TWEETS = [
  {
    content: "If you are building a product, spend 50% of your time on distribution.\n\nCode is not marketing.\n\nIf you don't talk to customers, you are just building in the dark. Shipping fast only works if you listen faster.",
    url: "https://twitter.com/creator/status/1",
    date: new Date().toISOString()
  },
  {
    content: "The best onboarding flow is the one you completely remove.\n\nAsk for email, password, and drop them in.\n\nEvery field you add costs you 10% signup conversion.",
    url: "https://twitter.com/creator/status/2",
    date: new Date(Date.now() - 3600000).toISOString()
  },
  {
    content: "Stop over-engineering. Your first 100 users do not need a scalable Kubernetes cluster.\n\nThey need a database that works and a product that solves their primary pain point.\n\nKeep it simple, validate.",
    url: "https://twitter.com/creator/status/3",
    date: new Date(Date.now() - 7200000).toISOString()
  }
]

async function classifyContent(content: string): Promise<string> {
  try {
    const classification = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI classifier. Classify the following post/tweet into one of these exact categories: "story", "education", "news", or "other".
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

function parseNitterRss(xmlText: string) {
  const items: { content: string; url: string; date: string }[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1]
    
    let description = ""
    const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i)
    if (descMatch) {
      description = descMatch[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") // strip CDATA wrapper
        .replace(/<[^>]*>/g, "") // strip HTML tags
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
    }
 
    let link = ""
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i)
    if (linkMatch) {
      link = linkMatch[1].trim()
    }
 
    let pubDate = ""
    const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
    if (dateMatch) {
      pubDate = dateMatch[1].trim()
    }
 
    if (description) {
      items.push({
        content: description,
        url: link || "https://twitter.com",
        date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
      })
    }
  }
  return items
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Clean username (remove leading @)
    const cleanUsername = username.trim().replace(/^@/, "")

    let xmlText = ""
    let successInstance = ""

    // Try multiple public instances in sequence to ensure high uptime
    for (const instance of NITTER_INSTANCES) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000) // 6s timeout per request
        
        const res = await fetch(`${instance}/${cleanUsername}/rss`, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
          }
        })
        
        clearTimeout(timeoutId)
        
        if (res.ok) {
          xmlText = await res.text()
          successInstance = instance
          break
        }
      } catch (e) {
        console.warn(`[twitter] Failed to fetch feed from ${instance}:`, e)
      }
    }

    let retrievedTweets: { content: string; url: string; date: string }[] = []
    let source = ""

    if (!xmlText) {
      console.warn("[twitter] All Nitter feeds failed, falling back to mock tweets.")
      retrievedTweets = MOCK_TWEETS
      source = "Twitter (Mock Fallback)"
    } else {
      const tweets = parseNitterRss(xmlText)
      if (tweets.length === 0) {
        retrievedTweets = MOCK_TWEETS
        source = "Twitter (Mock Fallback - Empty Feed)"
      } else {
        retrievedTweets = tweets
        source = `Nitter RSS (${successInstance})`
      }
    }

    // Classify all tweets in parallel
    const tweetsWithCategories = await Promise.all(
      retrievedTweets.map(async (t) => {
        const category = await classifyContent(t.content)
        return {
          ...t,
          category
        }
      })
    )

    return NextResponse.json({
      success: true,
      source,
      username: cleanUsername,
      tweets: tweetsWithCategories
    })

  } catch (err) {
    console.error("[twitter] error:", err)
    const message = err instanceof Error ? err.message : "Failed to fetch Twitter posts"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
