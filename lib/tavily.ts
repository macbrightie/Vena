import type { ResearchResult } from "@/types"

if (!process.env.TAVILY_API_KEY) {
  throw new Error("Missing TAVILY_API_KEY environment variable")
}

const TAVILY_API_URL = "https://api.tavily.com/search"

export async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<ResearchResult[]> {
  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: "advanced",
      include_raw_content: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return (data.results ?? []).map((r: Record<string, unknown>) => ({
    title: r.title as string,
    url: r.url as string,
    content: r.content as string,
    score: r.score as number | undefined,
  }))
}
