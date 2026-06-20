import { NextRequest, NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 3600 } // cache for 1 hour
    })

    const html = await res.text()

    // Helper function to extract meta tag content
    const getMetaTag = (property: string): string | null => {
      const metaTags = html.match(/<meta[^>]*>/gi) || []
      for (const tag of metaTags) {
        const hasProp = new RegExp(`(property|name)=["']${property}["']`, "i").test(tag)
        if (hasProp) {
          const contentMatch = tag.match(/content="([^"]*)"/i) || tag.match(/content='([^']*)'/i)
          if (contentMatch) {
            return decodeHtmlEntities(contentMatch[1])
          }
        }
      }
      return null
    }

    const title = getMetaTag("og:title") || getMetaTag("twitter:title") || ""
    const description = getMetaTag("og:description") || getMetaTag("twitter:description") || getMetaTag("description") || ""
    const image = getMetaTag("og:image") || getMetaTag("twitter:image") || ""

    // Check if the image exists and is a valid media attachment
    const hasImage = !!image && !image.includes("static.licdn.com") && !image.includes("default")

    // Base cleanup content from meta tags
    let content = description.trim()
    
    // Clean LinkedIn description meta tag content if it starts with the author info
    if (content.includes("on LinkedIn:")) {
      const parts = content.split("on LinkedIn:")
      if (parts[1] && parts[1].trim()) {
        content = parts[1].trim()
      }
    }

    let cleanTitle = title.trim()
    if (cleanTitle.includes(" | ")) {
      const parts = cleanTitle.split(" | ")
      if (parts.length > 1) {
        cleanTitle = parts.slice(0, Math.max(1, parts.length - 2)).join(" | ").trim()
      }
    }
    if (cleanTitle.includes("on LinkedIn:")) {
      const parts = cleanTitle.split("on LinkedIn:")
      if (parts[1] && parts[1].trim()) {
        cleanTitle = parts[1].trim()
      }
    }

    if (cleanTitle.length > content.length && !cleanTitle.includes("LinkedIn")) {
      content = cleanTitle
    }

    // ── ADVANCED FULL-TEXT SCRAPING LAYER ──────────────────────────────────
    let fullText = ""

    // 1. Try JSON-LD script blocks
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let jsonLdMatch
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const rawJsonText = jsonLdMatch[1].trim()
        const parsedJson = JSON.parse(rawJsonText)
        
        const checkObj = (obj: unknown): string | null => {
          if (obj && typeof obj === "object") {
            const record = obj as Record<string, unknown>
            if (record["@type"] === "SocialMediaPosting" || record["@type"] === "NewsArticle" || record["@type"] === "BlogPosting" || record["@type"] === "Article") {
              if (record.articleBody && typeof record.articleBody === "string") return record.articleBody
              if (record.text && typeof record.text === "string") return record.text
            }
            if (record.articleBody && typeof record.articleBody === "string") return record.articleBody
            if (record.text && typeof record.text === "string") return record.text
          }
          return null
        }
        
        if (Array.isArray(parsedJson)) {
          for (const item of parsedJson) {
            const txt = checkObj(item)
            if (txt) { fullText = txt; break }
          }
        } else if (parsedJson["@graph"] && Array.isArray(parsedJson["@graph"])) {
          for (const item of parsedJson["@graph"]) {
            const txt = checkObj(item)
            if (txt) { fullText = txt; break }
          }
        } else {
          const txt = checkObj(parsedJson)
          if (txt) { fullText = txt }
        }
        
        if (fullText) break
      } catch {
        // Silently skip JSON parsing failures
      }
    }

    // 2. Try LinkedIn specific DOM selectors if url contains linkedin.com
    if (url.includes("linkedin.com") && !fullText) {
      const listContentRegex = /class=["'][^"']*attributed-text-segment-list__content[^"']*["'][^>]*>([\s\S]*?)<\/(p|div)>/gi
      const attrMatch = listContentRegex.exec(html)
      if (attrMatch) {
        fullText = attrMatch[1].replace(/<[^>]*>/g, "").trim()
      }
    }

    // 3. Try generic paragraph aggregation for blog posts / other websites
    if (!url.includes("linkedin.com") && !fullText) {
      const cleanedHtml = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
      let pMatch
      const paragraphs: string[] = []
      while ((pMatch = pRegex.exec(cleanedHtml)) !== null) {
        const text = pMatch[1].replace(/<[^>]*>/g, "").trim()
        const decoded = decodeHtmlEntities(text)
        if (decoded.length > 30) {
          paragraphs.push(decoded)
        }
      }
      
      if (paragraphs.length > 0) {
        fullText = paragraphs.join("\n\n")
      }
    }

    // If advanced extraction succeeded, use it in place of the brief description meta tag
    if (fullText && fullText.trim().length > content.length) {
      content = decodeHtmlEntities(fullText.trim())
    }

    // Try to extract author name from Title (e.g. "William Gates on LinkedIn: ...")
    let authorName = "LinkedIn User"
    if (title && title.includes("on LinkedIn")) {
      authorName = title.split("on LinkedIn")[0].trim()
    } else if (title && title.includes(" | ")) {
      const parts = title.split(" | ")
      if (parts[parts.length - 2]) {
        authorName = parts[parts.length - 2].trim()
      } else {
        authorName = parts[0].trim()
      }
    } else if (title) {
      authorName = title.trim()
    }

    // Clean up author if it starts with "See this post by "
    if (authorName.toLowerCase().startsWith("see this post by ")) {
      authorName = authorName.slice(17).trim()
    }

    // Classify category using OpenAI
    let category = "other"
    if (content?.trim()) {
      try {
        const classification = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `You are an AI classifier. Classify the following social media post into one of these exact categories: "story", "education", "news", or "other".
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
          category = detected
        }
      } catch (err) {
        console.error("[embed] OpenAI classification failed:", err)
      }
    }

    return NextResponse.json({
      success: true,
      content,
      author: authorName,
      hasImage,
      imageUrl: hasImage ? image : null,
      title,
      category,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to embed post"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
