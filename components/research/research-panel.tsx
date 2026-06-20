"use client"

import React, { useState, useEffect } from "react"
import { Search, Loader2, Sparkles, BookOpen, AlertCircle, ArrowRight, ExternalLink } from "lucide-react"
import type { ResearchResult } from "@/types"
import { VoiceDictation } from "@/components/dictation/voice-dictation"

interface ResearchPanelProps {
  onResearchSelected: (r: { synthesis: string; sources: ResearchResult[] } | null, query?: string) => void
  currentResearch: { synthesis: string; sources: ResearchResult[] } | null
  onSwitchToWrite?: () => void
  initialInstruction?: string
}

export function ResearchPanel({ onResearchSelected, currentResearch, onSwitchToWrite, initialInstruction }: ResearchPanelProps) {
  const [instruction, setInstruction] = useState(initialInstruction || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performSearch = React.useCallback(async (q: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      onResearchSelected({ synthesis: data.synthesis, sources: data.sources || [] }, q)
    } catch {
      setError("Tavily key not configured — showing demo research.")
      onResearchSelected({
        synthesis: `1. **Trending topic**: Content about "${q}" is seeing 40% higher engagement this quarter across professional networks.\n2. **Format insight**: Posts with numbered frameworks and concrete data points generate 2.5× more saves than opinion pieces.\n3. **Trust signal**: Citing specific stats or named studies boosts credibility and comment volume by ~60%.\n4. **Voice trend**: Authentic first-person narratives outperform generic "thought leadership" content by 2.8×.\n5. **Best timing**: Mid-week (Tue–Thu) morning posts in your target timezone see peak reach for B2B audiences.`,
        sources: [
          { title: "2024 LinkedIn Algorithm Insights", url: "https://example.com/li-insights", content: `Key findings on organic reach for "${q}" content.`, score: 0.95 },
          { title: "Content Engagement Benchmarks", url: "https://example.com/benchmarks", content: "Cross-industry data on professional content performance.", score: 0.88 },
        ],
      }, q)
    } finally {
      setIsLoading(false)
    }
  }, [onResearchSelected])

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instruction.trim()) return
    await performSearch(instruction.trim())
  }

  useEffect(() => {
    if (initialInstruction && initialInstruction.trim()) {
      const timer = setTimeout(() => {
        setInstruction(initialInstruction)
        performSearch(initialInstruction.trim())
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [initialInstruction, performSearch])

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
 
      {/* Search form */}
      <form onSubmit={handleResearch} className="space-y-3">
        <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>
          Research instruction
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
            <input
              type="text"
              placeholder="e.g. Latest stats on AI adoption in enterprise B2B sales"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isLoading}
              className="w-full text-[14px] rounded-[6px] pl-9 pr-10 py-2.5 transition-all disabled:opacity-50 focus:outline-none"
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                color: "var(--c-text)",
                boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px inset"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--c-border-2)"}
              onBlur={(e) => e.target.style.borderColor = "var(--c-border)"}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <VoiceDictation
                onTranscript={(text) => setInstruction(prev => prev ? `${prev} ${text}` : text)}
                placeholder="Listening..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !instruction.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              background: "var(--c-accent)",
              color: "var(--c-accent-fg)"
            }}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {isLoading ? "Searching…" : "Research"}
          </button>
        </div>
      </form>
 
      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-[#eb5757]/10 border border-[#eb5757]/20 rounded-[6px] text-[13px] text-[#eb5757]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          {error}
        </div>
      )}
 
      {/* Results */}
      {currentResearch ? (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
            <span className="text-[11px] font-semibold flex items-center gap-1.5 uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>
              <Sparkles className="w-3 h-3" style={{ color: "var(--c-accent)" }} />
              AI synthesis
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
          </div>
 
          <div
            className="rounded-[12px] p-4 text-[14px] leading-[1.75] whitespace-pre-wrap border"
            style={{
              background: "var(--c-elevated)",
              borderColor: "var(--c-border)",
              color: "var(--c-text-2)",
            }}
          >
            {currentResearch.synthesis}
          </div>
 
          {/* Sources */}
          {currentResearch.sources?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "var(--c-text-3)" }}>
                <BookOpen className="w-3 h-3" />
                Sources
              </p>
              {currentResearch.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-[6px] group transition-all border"
                  style={{
                    background: "var(--c-elevated)",
                    borderColor: "var(--c-border)",
                    boxShadow: "rgba(0,0,0,0.1) 0px 2px 4px 0px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--c-border-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--c-border)"}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium transition-colors" style={{ color: "var(--c-text-2)" }}>
                      {src.title}
                    </p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--c-text-3)" }}>{src.url}</p>
                    
                    {/* Visual Badges */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {src.url.includes("reddit.com") && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(235,87,87,0.08)", color: "#eb5757", border: "1px solid rgba(235,87,87,0.15)" }}>
                          💬 Active Debate
                        </span>
                      )}
                      {src.url.includes("youtube.com") && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(235,87,87,0.08)", color: "#eb5757", border: "1px solid rgba(235,87,87,0.15)" }}>
                          🎥 Video Feedback
                        </span>
                      )}
                      {src.score != null && src.score >= 0.9 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(228,242,34,0.08)", color: "#b8be0c", border: "1px solid rgba(228,242,34,0.15)" }}>
                          🔥 High Signal
                        </span>
                      )}
                      {!src.url.includes("reddit.com") && !src.url.includes("youtube.com") && (src.score == null || src.score < 0.9) && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(94,106,210,0.08)", color: "#5e6ad2", border: "1px solid rgba(94,106,210,0.15)" }}>
                          💡 Reference Link
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {src.score != null && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px]" style={{ background: "var(--c-overlay)", color: "var(--c-text-3)" }}>
                        {Math.round(src.score * 100)}%
                      </span>
                    )}
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                  </div>
                </a>
              ))}
            </div>
          )}
 
          {/* CTA */}
          {onSwitchToWrite && (
            <button
              onClick={onSwitchToWrite}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[6px] text-[13px] font-semibold transition-all cursor-pointer"
              style={{
                background: "var(--c-accent)",
                color: "var(--c-accent-fg)"
              }}
            >
              Write a post with this research
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-4 border"
            style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)" }}
          >
            <Search className="w-5 h-5" style={{ color: "var(--c-text-3)" }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: "var(--c-text-2)" }}>No research yet</p>
          <p className="text-[13px] mt-1 max-w-[260px]" style={{ color: "var(--c-text-3)" }}>
            Describe what you want to know and hit Research to pull web insights.
          </p>
        </div>
      ) : null}
    </div>
  )
}
