"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import {
  Loader2, Sparkles, Hash, Copy, Check,
  AlertTriangle, ChevronLeft, ChevronRight, Star, PenLine as PenLineIcon,
  Trash2,
} from "lucide-react"
import { AnglePicker, type Angle } from "@/components/editor/angle-picker"
import { RefineChat, type ChatMessage } from "@/components/editor/refine-chat"
import type { ResearchResult, VoiceDoc, LinkedInPost, GenerationRun } from "@/types"
import { VoiceDictation } from "@/components/dictation/voice-dictation"

/** Read all voice docs from localStorage and concatenate their text */
function getVoiceContext(): string {
  try {
    const stored = localStorage.getItem("vena_voice_docs")
    if (!stored) return ""
    const docs: VoiceDoc[] = JSON.parse(stored)
    if (!docs.length) return ""
    return docs.map(d => `=== ${d.name} ===\n${d.content}`).join("\n\n")
  } catch {
    return ""
  }
}

type Stage = "input" | "angles" | "writing"

interface DraftVersion {
  content: string
  label: string       // e.g. "First draft" / "Refine #1"
  createdAt: Date
}

interface PostEditorProps {
  onDraftChange: (text: string) => void
  onPreviewChange: (text: string) => void
  currentResearch: { synthesis: string; sources: ResearchResult[] } | null
  onResearchChange?: (research: { synthesis: string; sources: ResearchResult[] } | null, query?: string) => void
  referencePost?: LinkedInPost | null
  onClearReference?: () => void
  initialTopic?: string
  activeSubTab?: "editor" | "chat" | "preview"
}

const DEMO_ANGLES: Angle[] = [
  {
    title: "The thing nobody tells you about building in public",
    summary: "A confession-style post that reveals the uncomfortable truth most founders discover too late — that distribution isn't a growth hack, it's a survival skill. Uses a before/after personal story to contrast two launch attempts.",
    angle: "confession",
  },
  {
    title: "I studied 50 top-performing founder posts. Here's the pattern.",
    summary: "A data-driven breakdown of what actually drives LinkedIn reach for founders. Lead with a counter-intuitive finding, then walk through 3 specific tactics with numbers to back them up.",
    angle: "data-driven",
  },
  {
    title: "Most people think marketing is optional. They're wrong.",
    summary: "A contrarian take that challenges the 'build first, sell later' mindset. Reframes distribution as product — not as a separate function — using a sharp analogy and one vivid example.",
    angle: "contrarian",
  },
]

const FALLBACK_DRAFT = `Most people think distribution is a feature.

It's not.

It's the entire product.

When we launched our first product, we spent 90% of our time building.
We assumed users would just show up.

They didn't.

The second launch? We flipped the ratio.
50% building. 50% talking to people, writing, and distributing.

Result: 10× the traction in half the time.

The lesson isn't "marketing beats engineering."
It's that the best product without distribution is a hobby project.

What's your current build-to-distribution ratio?`

// ── Version tab strip ──────────────────────────────────────────
function VersionStrip({
  versions,
  activeIdx,
  onSelect,
}: {
  versions: DraftVersion[]
  activeIdx: number
  onSelect: (idx: number) => void
}) {
  if (versions.length === 0) return null

  const isFirst = activeIdx === 0
  const isLast = activeIdx === versions.length - 1

  // Build visible pill indices — always show first, last, and window around active
  const buildVisible = (): (number | "gap")[] => {
    if (versions.length <= 7) return versions.map((_, i) => i)
    const indices = new Set<number>()
    indices.add(0)
    indices.add(versions.length - 1)
    for (let i = Math.max(0, activeIdx - 1); i <= Math.min(versions.length - 1, activeIdx + 1); i++) {
      indices.add(i)
    }
    const sorted = Array.from(indices).sort((a, b) => a - b)
    const result: (number | "gap")[] = []
    sorted.forEach((idx, pos) => {
      if (pos > 0 && idx - sorted[pos - 1] > 1) result.push("gap")
      result.push(idx)
    })
    return result
  }

  const visible = buildVisible()

  return (
    <div
      className="shrink-0 flex items-center gap-1.5 px-4 py-2.5"
      style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-bg)" }}
    >
      {/* Prev */}
      <button
        onClick={() => onSelect(activeIdx - 1)}
        disabled={isFirst}
        className="flex items-center gap-0.5 px-2 py-1 rounded-[4px] text-[11px] font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        style={{ color: "var(--c-text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--c-elevated)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>

      {/* Pills */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        {visible.map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="text-[11px] px-0.5" style={{ color: "var(--c-text-4)" }}>…</span>
          ) : (
            <button
              key={item}
              onClick={() => onSelect(item)}
              title={versions[item].label}
              className="relative flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer"
              style={item === activeIdx
                ? { background: "var(--c-accent)", color: "var(--c-accent-fg)" }
                : item === versions.length - 1
                ? { background: "var(--c-overlay)", color: "var(--c-text-2)" }
                : { color: "var(--c-text-3)" }
              }
            >
              {item === versions.length - 1 && item !== activeIdx && (
                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--c-accent)" }} />
              )}
              v{item + 1}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => onSelect(activeIdx + 1)}
        disabled={isLast}
        className="flex items-center gap-0.5 px-2 py-1 rounded-[4px] text-[11px] font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        style={{ color: "var(--c-text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--c-elevated)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export function PostEditor({
  onDraftChange,
  onPreviewChange,
  currentResearch,
  onResearchChange,
  referencePost,
  onClearReference,
  initialTopic,
  activeSubTab,
}: PostEditorProps) {
  const [stage, setStage] = useState<Stage>("input")
  const [topic, setTopic] = useState("")
  const [canvasWidth, setCanvasWidth] = useState(58)
  const [isMobile, setIsMobile] = useState(false)
  const isDraggingRef = useRef(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleCanvasResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!editorContainerRef.current) return
    isDraggingRef.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const container = editorContainerRef.current
    const containerRect = container.getBoundingClientRect()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return
      const relativeX = moveEvent.clientX - containerRect.left
      const widthPct = (relativeX / containerRect.width) * 100
      const clampedPct = Math.max(35, Math.min(80, widthPct))
      setCanvasWidth(clampedPct)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  useEffect(() => {
    if (initialTopic && initialTopic !== topic) {
      const timer = setTimeout(() => {
        setTopic(initialTopic)
        setStage("input")
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [initialTopic, topic])
  const [notes, setNotes] = useState("")
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false)
  const [angles, setAngles] = useState<Angle[]>([])
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null)
  const [isGeneratingPost, setIsGeneratingPost] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isResearching, setIsResearching] = useState(false)
  const [localResearch, setLocalResearch] = useState<{ synthesis: string; sources: ResearchResult[] } | null>(null)

  // ── Generation history state ──────────────────────────────────
  const [generationRuns, setGenerationRuns] = useState<GenerationRun[]>([])
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null)

  // Load generation runs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vena_generation_history")
      if (stored) {
        const parsed = JSON.parse(stored)
        const timer = setTimeout(() => {
          setGenerationRuns(parsed)
        }, 0)
        return () => clearTimeout(timer)
      }
    } catch (err) {
      console.error("Failed to load generation history:", err)
    }
  }, [])

  const saveOrUpdateRun = useCallback((
    runId: string,
    updates: Partial<Omit<GenerationRun, "id" | "created_at">> & {
      topic: string
      angles: Angle[]
    }
  ) => {
    setGenerationRuns((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === runId)
      let nextRuns = [...prev]

      if (existingIdx > -1) {
        const existing = prev[existingIdx]
        const updatedRun: GenerationRun = {
          ...existing,
          ...updates,
          selectedAngle: updates.selectedAngle !== undefined ? updates.selectedAngle : existing.selectedAngle,
          versions: updates.versions !== undefined ? updates.versions : existing.versions,
          activeVersionIdx: updates.activeVersionIdx !== undefined ? updates.activeVersionIdx : existing.activeVersionIdx,
          chatMessages: updates.chatMessages !== undefined ? updates.chatMessages : existing.chatMessages,
          notes: updates.notes !== undefined ? updates.notes : existing.notes,
        }
        nextRuns[existingIdx] = updatedRun
      } else {
        const newRun: GenerationRun = {
          id: runId,
          topic: updates.topic,
          notes: updates.notes,
          selectedAngle: updates.selectedAngle || null,
          angles: updates.angles,
          versions: updates.versions || [],
          activeVersionIdx: updates.activeVersionIdx || 0,
          chatMessages: updates.chatMessages || [],
          created_at: new Date().toISOString(),
        }
        nextRuns = [newRun, ...nextRuns]
      }

      localStorage.setItem("vena_generation_history", JSON.stringify(nextRuns))
      return nextRuns
    })
  }, [])

  function handleRestoreGenerationRun(run: GenerationRun) {
    setActiveGenerationId(run.id)
    setTopic(run.topic)
    setNotes(run.notes ?? "")
    setAngles(run.angles)
    setSelectedAngle(run.selectedAngle)

    const restoredVersions = run.versions.map((v) => ({
      content: v.content,
      label: v.label,
      createdAt: new Date(v.createdAt),
    }))
    setVersions(restoredVersions)
    setActiveVersionIdx(run.activeVersionIdx)

    const restoredMessages = run.chatMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      text: m.text,
      snapshot: m.snapshot,
      timestamp: new Date(m.timestamp),
    }))
    setChatMessages(restoredMessages)

    setStage("writing")

    const activeContent = restoredVersions[run.activeVersionIdx]?.content ?? ""
    onPreviewChange(activeContent)
    onDraftChange(activeContent)
  }

  function handleDeleteGenerationRun(e: React.MouseEvent, runId: string) {
    e.stopPropagation()
    setGenerationRuns((prev) => {
      const next = prev.filter((r) => r.id !== runId)
      localStorage.setItem("vena_generation_history", JSON.stringify(next))
      return next
    })
    if (activeGenerationId === runId) {
      handleStartNewPost()
    }
  }

  // ── Version state ───────────────────────────────────────────
  const [versions, setVersions] = useState<DraftVersion[]>([])
  const [activeVersionIdx, setActiveVersionIdx] = useState(0)

  const activeDraft = versions[activeVersionIdx]?.content ?? ""
  const isLatestVersion = activeVersionIdx === versions.length - 1

  /** Navigate to a version — preview it on the right */
  const handleSelectVersion = useCallback((idx: number) => {
    setActiveVersionIdx(idx)
    const content = versions[idx]?.content ?? ""
    onPreviewChange(content)
    onDraftChange(content)

    if (activeGenerationId) {
      setGenerationRuns((prev) => {
        const rIdx = prev.findIndex((r) => r.id === activeGenerationId)
        if (rIdx === -1) return prev
        const next = [...prev]
        next[rIdx] = { ...next[rIdx], activeVersionIdx: idx }
        localStorage.setItem("vena_generation_history", JSON.stringify(next))
        return next
      })
    }
  }, [versions, onPreviewChange, onDraftChange, activeGenerationId])

  /** Live-edit the currently active version */
  const handleTextChange = (text: string) => {
    setVersions((prev) => {
      const next = [...prev]
      if (next[activeVersionIdx]) next[activeVersionIdx] = { ...next[activeVersionIdx], content: text }
      return next
    })
    onDraftChange(text)
    onPreviewChange(text)

    if (activeGenerationId) {
      setGenerationRuns((prev) => {
        const rIdx = prev.findIndex((r) => r.id === activeGenerationId)
        if (rIdx === -1) return prev
        const next = [...prev]
        const runVersions = [...next[rIdx].versions]
        if (runVersions[activeVersionIdx]) {
          runVersions[activeVersionIdx] = { ...runVersions[activeVersionIdx], content: text }
        }
        next[rIdx] = { ...next[rIdx], versions: runVersions }
        localStorage.setItem("vena_generation_history", JSON.stringify(next))
        return next
      })
    }
  }

  /** Set this version as the "current" (duplicate it to the end) */
  const handleUseThisVersion = () => {
    const content = versions[activeVersionIdx]?.content ?? ""
    const restoreLabel = `Restored v${activeVersionIdx + 1}`
    const newVerObj: DraftVersion = { content, label: restoreLabel, createdAt: new Date() }

    setVersions((prev) => {
      const next = [...prev, newVerObj]
      setActiveVersionIdx(next.length - 1)
      return next
    })
    onDraftChange(content)
    onPreviewChange(content)

    if (activeGenerationId) {
      setGenerationRuns((prev) => {
        const rIdx = prev.findIndex((r) => r.id === activeGenerationId)
        if (rIdx === -1) return prev
        const next = [...prev]
        const nextVersions = [...next[rIdx].versions, {
          content,
          label: restoreLabel,
          createdAt: newVerObj.createdAt.toISOString()
        }]
        next[rIdx] = {
          ...next[rIdx],
          versions: nextVersions,
          activeVersionIdx: nextVersions.length - 1,
        }
        localStorage.setItem("vena_generation_history", JSON.stringify(next))
        return next
      })
    }
  }

  // ── Stage 1 → 2 ────────────────────────────────────────────
  const handleRunResearch = async (depth: "basic" | "deep") => {
    if (!topic.trim()) return null
    setIsResearching(true)
    setError(null)
    setLocalResearch(null)
    onResearchChange?.(null)

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: topic.trim(),
          depth,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Research failed")
      
      const newResearch = {
        synthesis: data.synthesis,
        sources: data.sources,
      }
      setLocalResearch(newResearch)
      onResearchChange?.(newResearch, topic.trim())
      return newResearch
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run research."
      setError(message)
      return null
    } finally {
      setIsResearching(false)
    }
  }

  const handleGenerateAngles = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!topic.trim()) return
    setIsGeneratingAngles(true)
    setError(null)

    const activeResearchSources = localResearch?.sources ?? currentResearch?.sources ?? []

    try {
      const res = await fetch("/api/angles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          notes: notes.trim(),
          research: activeResearchSources,
          referencePost: referencePost?.content,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAngles(data.angles)
    } catch {
      setError("API not configured — showing demo angles.")
      setAngles(DEMO_ANGLES)
    } finally {
      setIsGeneratingAngles(false)
      setStage("angles")
    }
  }

  // ── Stage 2 → 3 ────────────────────────────────────────────
  const handlePickAngle = useCallback(async (angle?: Angle, forcedResearchSources?: ResearchResult[]) => {
    const newId = "gen-" + (typeof window !== "undefined" ? window.crypto.randomUUID() : "ssr")
    setActiveGenerationId(newId)
    if (angle) setSelectedAngle(angle)
    setStage("writing")
    setIsGeneratingPost(true)
    setError(null)
    setChatMessages([])
    setVersions([])
    setActiveVersionIdx(0)

    const activeResearchSources = forcedResearchSources ?? localResearch?.sources ?? currentResearch?.sources ?? []

    let localVaultContent: string[] = []
    try {
      const stored = localStorage.getItem("vena_post_vault")
      if (stored) {
        const posts: LinkedInPost[] = JSON.parse(stored)
        localVaultContent = posts.map(p => p.content).filter(Boolean)
      }
    } catch {}

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: angle ? `${topic}: ${angle.title}` : topic,
          additionalContext: angle ? `Angle: ${angle.angle}. Approach: ${angle.summary}${notes ? `. Additional notes: ${notes}` : ""}` : notes,
          research: activeResearchSources,
          voiceContext: getVoiceContext(),
          referencePost: referencePost?.content,
          vaultPosts: localVaultContent,
        }),

      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      const content = data.content
      const firstVer = { content, label: "First draft", createdAt: new Date() }
      setVersions([firstVer])
      setActiveVersionIdx(0)
      onDraftChange(content)
      onPreviewChange(content)

      saveOrUpdateRun(newId, {
        topic: topic.trim(),
        notes: notes.trim(),
        selectedAngle: angle,
        angles: angles,
        versions: [{ content, label: "First draft", createdAt: firstVer.createdAt.toISOString() }],
        activeVersionIdx: 0,
        chatMessages: [],
      })
    } catch {
      setError("API not configured — loaded a demo post.")
      const content = FALLBACK_DRAFT
      const firstVer = { content, label: "First draft (demo)", createdAt: new Date() }
      setVersions([firstVer])
      setActiveVersionIdx(0)
      onDraftChange(content)
      onPreviewChange(content)

      saveOrUpdateRun(newId, {
        topic: topic.trim(),
        notes: notes.trim(),
        selectedAngle: angle,
        angles: angles,
        versions: [{ content, label: "First draft (demo)", createdAt: firstVer.createdAt.toISOString() }],
        activeVersionIdx: 0,
        chatMessages: [],
      })
    } finally {
      setIsGeneratingPost(false)
    }
  }, [topic, notes, referencePost, onDraftChange, onPreviewChange, saveOrUpdateRun, angles, localResearch, currentResearch])

  function handleStartNewPost() {
    setStage("input")
    setSelectedAngle(null)
    setTopic("")
    setNotes("")
    setAngles([])
    setActiveGenerationId(null)
    setVersions([])
    setChatMessages([])
    onPreviewChange("")
    onDraftChange("")
  }

  // ── Stage 3: Refine ─────────────────────────────────────────
  const handleSendRefinement = useCallback(async (instruction: string) => {
    const currentContent = activeDraft
    const refineLabel = `Refine #${chatMessages.filter(m => m.role === "user").length + 1}`

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: instruction,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setIsSending(true)

    try {
      // Load local vault content fallback
      let localVaultContent: string[] = []
      try {
        const stored = localStorage.getItem("vena_post_vault")
        if (stored) {
          const posts = JSON.parse(stored)
          localVaultContent = posts.map((p: any) => p.content).filter(Boolean)
        }
      } catch {}

      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentContent,
          instruction,
          voiceContext: getVoiceContext(),
          vaultPosts: localVaultContent,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: data.summary,
        snapshot: data.content,
        timestamp: new Date(),
        variations: data.variations || undefined,
      }
      
      const newVerObj: DraftVersion = { content: data.content, label: refineLabel, createdAt: new Date() }

      setChatMessages((prev) => [...prev, assistantMsg])
      setVersions((prev) => {
        const next = [...prev, newVerObj]
        setActiveVersionIdx(next.length - 1)
        return next
      })
      onDraftChange(data.content)
      onPreviewChange(data.content)

      if (activeGenerationId) {
        setGenerationRuns((prev) => {
          const rIdx = prev.findIndex((r) => r.id === activeGenerationId)
          if (rIdx === -1) return prev
          const next = [...prev]
          const nextVersions = [...next[rIdx].versions, {
            content: data.content,
            label: refineLabel,
            createdAt: newVerObj.createdAt.toISOString()
          }]
          const nextChat = [...next[rIdx].chatMessages, {
            id: userMsg.id,
            role: userMsg.role,
            text: userMsg.text,
            timestamp: userMsg.timestamp.toISOString(),
          }, {
            id: assistantMsg.id,
            role: assistantMsg.role,
            text: assistantMsg.text,
            snapshot: assistantMsg.snapshot,
            variations: assistantMsg.variations,
            timestamp: assistantMsg.timestamp.toISOString(),
          }]
          next[rIdx] = {
            ...next[rIdx],
            versions: nextVersions,
            activeVersionIdx: nextVersions.length - 1,
            chatMessages: nextChat,
          }
          localStorage.setItem("vena_generation_history", JSON.stringify(next))
          return next
        })
      }
    } catch {
      // Offline/Demo mock generator for visual feedback
      const isHookOrCta = /hook|cta|intro|ending|rehook/i.test(instruction)
      let mockVariations = undefined
      if (isHookOrCta) {
        mockVariations = [
          {
            label: "Option 1: Movie Preview Style",
            content: `The hardest thing about building isn't the code.\n\nIt's showing up when the screen is blank.\n\nMost founders spend 90% of their time building and 10% on distribution.\n\n${currentContent}`
          },
          {
            label: "Option 2: Pain-Point Opener",
            content: `9 out of 10 SaaS founders fail for one reason:\n\nZero distribution.\n\nThey build in silence, hoping users will magically appear.\n\n${currentContent}`
          },
          {
            label: "Option 3: Direct Contrast Style",
            content: `Build it and they will come is a lie.\n\nBuild it and distribute it relentlessly is the truth.\n\n${currentContent}`
          }
        ]
      }

      const mockContent = mockVariations ? mockVariations[0].content : currentContent + "\n\nSharing this because most people never make the switch. The ones who do? They don't look back.\n\nWhat shifted things for you?"
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: "Added a more personal CTA to the ending (demo mode)",
        snapshot: mockContent,
        timestamp: new Date(),
        variations: mockVariations,
      }
      
      const newVerObj: DraftVersion = { content: mockContent, label: `${refineLabel} (demo)`, createdAt: new Date() }

      setChatMessages((prev) => [...prev, assistantMsg])
      setVersions((prev) => {
        const next = [...prev, newVerObj]
        setActiveVersionIdx(next.length - 1)
        return next
      })
      onDraftChange(mockContent)
      onPreviewChange(mockContent)

      if (activeGenerationId) {
        setGenerationRuns((prev) => {
          const rIdx = prev.findIndex((r) => r.id === activeGenerationId)
          if (rIdx === -1) return prev
          const next = [...prev]
          const nextVersions = [...next[rIdx].versions, {
            content: mockContent,
            label: `${refineLabel} (demo)`,
            createdAt: newVerObj.createdAt.toISOString()
          }]
          const nextChat = [...next[rIdx].chatMessages, {
            id: userMsg.id,
            role: userMsg.role,
            text: userMsg.text,
            timestamp: userMsg.timestamp.toISOString(),
          }, {
            id: assistantMsg.id,
            role: assistantMsg.role,
            text: assistantMsg.text,
            snapshot: assistantMsg.snapshot,
            variations: assistantMsg.variations,
            timestamp: assistantMsg.timestamp.toISOString(),
          }]
          next[rIdx] = {
            ...next[rIdx],
            versions: nextVersions,
            activeVersionIdx: nextVersions.length - 1,
            chatMessages: nextChat,
          }
          localStorage.setItem("vena_generation_history", JSON.stringify(next))
          return next
        })
      }
    } finally {
      setIsSending(false)
    }
  }, [activeDraft, chatMessages, onDraftChange, onPreviewChange, activeGenerationId, setGenerationRuns])

  const handleRestore = (snapshot: string, label?: string) => {
    const restoreLabel = label ?? `Restored from chat`
    const newVerObj: DraftVersion = { content: snapshot, label: restoreLabel, createdAt: new Date() }

    setVersions((prev) => {
      const next = [...prev, newVerObj]
      setActiveVersionIdx(next.length - 1)
      return next
    })
    onDraftChange(snapshot)
    onPreviewChange(snapshot)

    if (activeGenerationId) {
      setGenerationRuns((prev) => {
        const rIdx = prev.findIndex((r) => r.id === activeGenerationId)
        if (rIdx === -1) return prev
        const next = [...prev]
        const nextVersions = [...next[rIdx].versions, {
          content: snapshot,
          label: restoreLabel,
          createdAt: newVerObj.createdAt.toISOString()
        }]
        next[rIdx] = {
          ...next[rIdx],
          versions: nextVersions,
          activeVersionIdx: nextVersions.length - 1,
        }
        localStorage.setItem("vena_generation_history", JSON.stringify(next))
        return next
      })
    }
  }

  const handleHoverVersion = (content: string | null) => {
    onPreviewChange(content ?? activeDraft)
  }

  const handleCopy = async () => {
    if (!activeDraft) return
    await navigator.clipboard.writeText(activeDraft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const charLimit = 3000
  const charCount = activeDraft.length
  const pct = Math.min((charCount / charLimit) * 100, 100)
  const isOverLimit = charCount > charLimit

  // ══════════════════════════════════════════════════════════
  // STAGE 1
  // ══════════════════════════════════════════════════════════
  if (stage === "input") {
    const activeResearch = localResearch ?? currentResearch

    return (
      <div className="flex flex-col items-center justify-center h-full px-6 overflow-y-auto py-10 animate-fade-in">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h2 className="text-[20px] font-semibold tracking-[-0.3px]" style={{ color: "var(--c-text)" }}>
              What do you want to write about?
            </h2>
            <p className="text-[13px] mt-2" style={{ color: "var(--c-text-3)" }}>
              We&apos;ll generate 3 angles — pick the one that fits, then write the post.
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); referencePost ? handlePickAngle() : handleGenerateAngles() }} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-text-3)" }}>Topic *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Why most founders underestimate distribution"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  autoFocus
                  disabled={isGeneratingAngles || isResearching}
                  className="w-full text-[14px] rounded-[6px] pl-4 pr-10 py-3 transition-all disabled:opacity-50 focus:outline-none"
                  style={{
                    background: "var(--c-elevated)",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text)",
                    boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px inset",
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <VoiceDictation
                    onTranscript={(text) => setTopic(prev => prev ? `${prev} ${text}` : text)}
                    placeholder="Listening..."
                  />
                </div>
              </div>
            </div>
            {!referencePost && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-text-3)" }}>
                  Notes <span className="normal-case font-normal tracking-normal" style={{ color: "var(--c-text-4)" }}>(optional)</span>
                </label>
                <textarea
                  placeholder="Audience, tone, key point, story you want to tell, data you have…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isGeneratingAngles || isResearching}
                  rows={3}
                  className="w-full text-[14px] rounded-[6px] px-4 py-3 transition-all resize-none disabled:opacity-50 focus:outline-none"
                  style={{
                    background: "var(--c-elevated)",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text)",
                    boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px inset",
                  }}
                />
              </div>
            )}
            {referencePost && (
              <div
                className="flex items-start justify-between gap-3 p-3 rounded-[6px]"
                style={{
                  background: "var(--c-overlay)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold mb-1 flex items-center gap-1.5" style={{ color: "var(--c-accent)" }}>
                    <PenLineIcon className="w-3 h-3" /> Writing like this post
                  </p>
                  <p className="text-[12px] line-clamp-2 leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                    {referencePost.content.slice(0, 120)}{referencePost.content.length > 120 ? "…" : ""}
                  </p>
                </div>
                <button
                  onClick={onClearReference}
                  className="text-[11px] shrink-0 cursor-pointer"
                  style={{ color: "var(--c-text-3)" }}
                >✕</button>
              </div>
            )}
 
            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-[6px] text-[12px] border"
                style={{
                  background: "rgba(235,87,87,0.06)",
                  borderColor: "rgba(235,87,87,0.15)",
                  color: "#eb5757",
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />{error}
              </div>
            )}

            {referencePost ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await handleRunResearch("deep")
                    if (res) handlePickAngle(undefined, res.sources)
                  }}
                  disabled={isResearching || isGeneratingPost || !topic.trim()}
                  className="flex flex-col items-center justify-center p-4 border rounded-[6px] cursor-pointer disabled:opacity-40 transition-all font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  style={{
                    borderColor: "var(--c-border)",
                    background: "var(--c-elevated)",
                    color: "var(--c-text)",
                  }}
                >
                  {isResearching ? (
                    <><Loader2 className="w-5 h-5 animate-spin mb-1 text-[var(--c-text-3)]" /><span className="text-[13px] font-bold">Researching...</span></>
                  ) : (
                    <><span className="text-[13px] font-bold">Deep Research</span><span className="text-[10.5px] opacity-70 mt-1 font-normal">Fetch facts then write</span></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handlePickAngle()}
                  disabled={isResearching || isGeneratingPost || !topic.trim()}
                  className="flex flex-col items-center justify-center p-4 rounded-[6px] cursor-pointer disabled:opacity-40 transition-all font-semibold hover:opacity-90"
                  style={{
                    background: "var(--c-accent)",
                    color: "var(--c-accent-fg)",
                  }}
                >
                  <span className="text-[13px] font-bold">Write Directly</span>
                  <span className="text-[10.5px] opacity-80 mt-1 font-normal">Use provided structure</span>
                </button>
              </div>
            ) : isResearching ? (
              <div
                className="flex flex-col items-center justify-center py-6 px-4 space-y-2 border border-dashed rounded-[6px]"
                style={{
                  borderColor: "var(--c-border)",
                  background: "var(--c-overlay)",
                }}
              >
                <Loader2 className="w-5 h-5 animate-spin text-[var(--c-text)]" />
                <span className="text-[12px] font-semibold" style={{ color: "var(--c-text)" }}>Running research on &quot;{topic}&quot;...</span>
                <span className="text-[11px] text-center" style={{ color: "var(--c-text-3)" }}>
                  Crawling target niche communities & synthesizing briefing
                </span>
              </div>
            ) : activeResearch ? (
              <div className="space-y-3">
                <div
                  className="flex flex-col rounded-[6px] overflow-hidden border"
                  style={{
                    borderColor: "var(--c-border)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 border-b"
                    style={{
                      background: "var(--c-overlay)",
                      borderColor: "var(--c-border)",
                    }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>
                      Research Briefing
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLocalResearch(null)
                        onResearchChange?.(null)
                      }}
                      className="text-[11px] font-semibold hover:underline cursor-pointer"
                      style={{ color: "var(--c-text-3)" }}
                    >
                      Clear
                    </button>
                  </div>
                  <div
                    className="p-4 text-[13px] leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto font-sans"
                    style={{
                      background: "var(--c-surface)",
                      color: "var(--c-text-2)",
                    }}
                  >
                    {activeResearch.synthesis}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAngles()}
                  disabled={isGeneratingAngles}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[6px] text-[14px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    background: "var(--c-accent)",
                    color: "var(--c-accent-fg)",
                    opacity: isGeneratingAngles ? 0.4 : 1,
                  }}
                >
                  {isGeneratingAngles ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating angles…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Angles with Research</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRunResearch("deep")}
                    disabled={isGeneratingAngles || !topic.trim()}
                    className="flex flex-col items-center justify-center p-4 border rounded-[6px] cursor-pointer disabled:opacity-40 transition-all font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    style={{
                      borderColor: "var(--c-border)",
                      background: "var(--c-elevated)",
                      color: "var(--c-text)",
                    }}
                  >
                    <span className="text-[13px] font-bold">Deep Research</span>
                    <span className="text-[10.5px] opacity-70 mt-1 font-normal">Analyze SaaS watchlist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateAngles()}
                    disabled={isGeneratingAngles || !topic.trim()}
                    className="flex flex-col items-center justify-center p-4 rounded-[6px] cursor-pointer disabled:opacity-40 transition-all font-semibold hover:opacity-90"
                    style={{
                      background: "var(--c-accent)",
                      color: "var(--c-accent-fg)",
                    }}
                  >
                    <span className="text-[13px] font-bold">Write Directly</span>
                    <span className="text-[10.5px] opacity-80 mt-1 font-normal">Skip web lookup</span>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Draft History Section */}
          {generationRuns.length > 0 && (
            <div className="mt-10 pt-8 border-t border-dashed animate-fade-in" style={{ borderColor: "var(--c-border)" }}>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--c-text-3)" }}>
                Draft History
              </h3>
              <div className="space-y-2.5">
                {generationRuns.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => handleRestoreGenerationRun(run)}
                    className="group relative flex flex-col p-3.5 rounded-[6px] border cursor-pointer transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
                    style={{
                      background: "var(--c-elevated)",
                      borderColor: "var(--c-border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[13px] font-semibold line-clamp-1 pr-6" style={{ color: "var(--c-text)" }}>
                        {run.topic}
                      </span>
                      <span className="text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded-[4px]" style={{ background: "var(--c-overlay)", color: "var(--c-text-3)" }}>
                        {run.versions.length} {run.versions.length === 1 ? "version" : "versions"}
                      </span>
                    </div>
                    {run.selectedAngle && (
                      <p className="text-[11px] mt-1.5 line-clamp-1" style={{ color: "var(--c-text-2)" }}>
                        <span className="font-semibold text-[var(--c-accent)] uppercase text-[9px] tracking-wider mr-1">Angle:</span>
                        {run.selectedAngle.title}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[10px]" style={{ color: "var(--c-text-4)" }}>
                        {new Date(run.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGenerationRun(e, run.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer text-stone-400 hover:text-red-500"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // STAGE 2
  // ══════════════════════════════════════════════════════════
  if (stage === "angles") {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-[#eb5757]/10 border border-[#eb5757]/20 rounded-[6px] text-[12px] text-[#eb5757] max-w-2xl">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />{error}
          </div>
        )}
        <AnglePicker
          topic={topic}
          angles={angles}
          onPick={handlePickAngle}
          onBack={() => { setStage("input"); setError(null) }}
        />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // STAGE 3 — Write & Refine
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">

      {/* Breadcrumb */}
      <div
        className="shrink-0 px-5 py-2.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
      >
        <button
          onClick={() => { setStage("angles"); setError(null) }}
          className="flex items-center gap-1 text-[12px] transition-colors cursor-pointer"
          style={{ color: "var(--c-text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--c-text-2)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text-3)" )}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Angles
        </button>
        <span className="text-[12px]" style={{ color: "var(--c-text-4)" }}>/</span>
        <span className="text-[12px] font-medium truncate max-w-[260px]" style={{ color: "var(--c-text-2)" }}>
          {selectedAngle?.title ?? topic}
        </span>
        {selectedAngle && (
          <>
            <span className="text-[12px]" style={{ color: "var(--c-text-4)" }}>·</span>
            <span className="text-[11px] capitalize" style={{ color: "var(--c-text-3)" }}>{selectedAngle.angle.replace("-", " ")}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {error && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--c-text-3)" }}>
              <AlertTriangle className="w-3 h-3 text-[#eb5757]" /> Demo
            </span>
          )}
          <button
            onClick={handleStartNewPost}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer border"
            style={{ background: "var(--c-surface)", borderColor: "var(--c-border)", color: "var(--c-text-2)" }}
          >
            New Post
          </button>
          {activeDraft && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-all cursor-pointer"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text-2)" }}
            >
              {copied
                ? <><Check className="w-3 h-3 text-[#27a644]" /><span className="text-[#27a644]">Copied</span></>
                : <><Copy className="w-3 h-3" style={{ color: "var(--c-text-2)" }} /><span style={{ color: "var(--c-text-2)" }}>Copy</span></>
              }
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isGeneratingPost ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-8 h-8 text-[#e4f222] animate-spin" />
          <div>
            <p className="text-[14px] font-medium" style={{ color: "var(--c-text)" }}>Writing your post…</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--c-text-3)" }}>Studying your angle and voice</p>
          </div>
        </div>
      ) : (
        <div ref={editorContainerRef} className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
          {/* ── Zone 1: Textarea + version strip ─────────────── */}
          <div
            className={`flex-col ${activeSubTab === "chat" ? "hidden md:flex" : "flex flex-1 md:flex-initial"}`}
            style={!isMobile && !activeSubTab ? {
              width: `${canvasWidth}%`,
              flex: "none",
            } : activeSubTab ? {
              flex: "1 1 auto"
            } : {
              flex: "0 0 58%"
            }}
          >

            {/* "Not on latest" banner */}
            {!isLatestVersion && versions.length > 1 && (
              <div className="shrink-0 flex items-center justify-between px-5 py-2 bg-[#5e6ad2]/10 border-b border-[#5e6ad2]/20">
                <span className="text-[12px] text-[#5e6ad2] flex items-center gap-1.5">
                  <Star className="w-3 h-3" />
                  Viewing v{activeVersionIdx + 1} — previewing on the right
                </span>
                <button
                  onClick={handleUseThisVersion}
                  className="text-[11px] font-semibold text-[#e4f222] hover:text-[#f7f8f8] transition-colors cursor-pointer"
                >
                  Use this version →
                </button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={activeDraft}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Your post will appear here…"
              className="flex-1 w-full text-[14px] leading-[1.8] px-5 py-4 focus:outline-none resize-none border-none"
              style={{ background: "var(--c-surface)", color: "var(--c-text)" }}
            />

            {/* ── Version strip ──────────────────────────────── */}
            <VersionStrip
              versions={versions}
              activeIdx={activeVersionIdx}
              onSelect={handleSelectVersion}
            />

            {/* Char count */}
            <div
              className="shrink-0 px-5 py-2 flex items-center gap-3"
              style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface)" }}
            >
              <div className="flex-1">
                <div
                  className="h-0.5 w-full rounded-full overflow-hidden"
                  style={{ background: "var(--c-overlay)" }}
                >
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${isOverLimit ? "bg-[#eb5757]" : pct > 80 ? "bg-[#02b8cc]" : "bg-[#e4f222]"}`}
                  />
                </div>
              </div>
              <span
                className="text-[11px] flex items-center gap-1 shrink-0"
                style={{ color: isOverLimit ? "#eb5757" : "var(--c-text-3)" }}
              >
                <Hash className="w-2.5 h-2.5" />
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Draggable Divider Handle between Canvas and Chat */}
          {!isMobile && !activeSubTab && (
            <div
              onMouseDown={handleCanvasResizeStart}
              className="hidden md:block w-[7px] -mx-[3.5px] z-30 cursor-col-resize hover:bg-[var(--c-accent)] transition-colors relative self-stretch"
              title="Drag to resize panels"
            >
              <div
                className="absolute inset-y-0 left-[3px] w-[1px] pointer-events-none"
                style={{ background: "var(--c-border)" }}
              />
            </div>
          )}

          {/* ── Zone 2: Chat ──────────────────────────────────── */}
          <div
            className={`flex-col min-h-0 ${activeSubTab === "editor" ? "hidden md:flex" : "flex flex-1 md:flex-initial"}`}
            style={!isMobile && !activeSubTab ? {
              flex: "1 1 0%",
            } : activeSubTab ? {
              flex: "1 1 auto"
            } : {
              flex: "1 1 42%"
            }}
          >
            <RefineChat
              messages={chatMessages}
              onSend={handleSendRefinement}
              onRestore={handleRestore}
              onHoverVersion={handleHoverVersion}
              isSending={isSending}
              draft={activeDraft}
            />
          </div>
        </div>
      )}
    </div>
  )
}
