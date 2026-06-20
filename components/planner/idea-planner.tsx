"use client"

import React, { useState, useEffect } from "react"
import {
  Sparkles, Loader2, Copy, Search, PenLine, RotateCw,
  Save, AlertCircle, CheckCircle2, Lightbulb, HelpCircle,
  Lock, Unlock, ChevronDown, ChevronUp
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { VoiceDictation } from "@/components/dictation/voice-dictation"
import type { PlannerItem, PlannerState } from "@/types"

interface IdeaPlannerProps {
  onSendToResearch: (query: string) => void
  onSendToWrite: (topic: string) => void
}

type FilterCategory = "all" | "marketing" | "ai-business" | "development" | "productivity"

const CAT_LABELS: Record<Exclude<FilterCategory, "all">, string> = {
  "marketing": "Marketing",
  "ai-business": "AI & Business",
  "development": "Development",
  "productivity": "Productivity"
}

const CAT_STYLES: Record<Exclude<FilterCategory, "all">, { bg: string; text: string; border: string }> = {
  "marketing":   { bg: "rgba(39,166,68,0.08)",   text: "#27a644", border: "rgba(39,166,68,0.2)" },
  "ai-business": { bg: "rgba(94,106,210,0.08)",  text: "#5e6ad2", border: "rgba(94,106,210,0.2)" },
  "development": { bg: "rgba(2,184,204,0.08)",   text: "#02b8cc", border: "rgba(2,184,204,0.2)" },
  "productivity": { bg: "rgba(228,242,34,0.06)",  text: "#b8be0c", border: "rgba(228,242,34,0.15)" }
}

function cleanScheduleItems(items: unknown[]): PlannerItem[] {
  return (items || []).map((rawItem) => {
    const item = rawItem as Record<string, unknown> & { outline?: Record<string, unknown>; slayFocus?: Record<string, unknown> }
    const validCategories = ["marketing", "ai-business", "development", "productivity"]
    const category = item.category && typeof item.category === "string" && validCategories.includes(item.category)
      ? item.category as PlannerItem["category"]
      : "development"
    
    const bucket = item.bucket && typeof item.bucket === "string" && ["growth", "authority", "conversion", "personal"].includes(item.bucket)
      ? item.bucket as PlannerItem["bucket"]
      : "growth"
    
    const framework = item.framework && typeof item.framework === "string" && ["pass", "slay"].includes(item.framework)
      ? item.framework as PlannerItem["framework"]
      : "slay"

    // Extract outline parts, falling back to legacy slayFocus keys if necessary
    const problem = String(item.outline?.problem || "")
    const agitate = String(item.outline?.agitate || "")
    const solution = String(item.outline?.solution || "")
    const rehook = String(item.outline?.rehook || item.slayFocus?.you || item.slayFocus?.Y || "")
    
    const story = String(item.outline?.story || item.slayFocus?.story || item.slayFocus?.S || "")
    const lesson = String(item.outline?.lesson || item.slayFocus?.lessons || item.slayFocus?.L || "")
    const actionable = String(item.outline?.actionable || item.slayFocus?.actionable || item.slayFocus?.A || "")
    const you = String(item.outline?.you || item.slayFocus?.you || item.slayFocus?.Y || "")

    return {
      id: String(item.id || `idea-${Math.random().toString(36).substring(2, 9)}`),
      category,
      bucket,
      framework,
      angle: String(item.angle || "Topic Idea"),
      headline: String(item.headline || item.topic || "Headline Hook"),
      searchQuery: String(item.searchQuery || item.topic || ""),
      outline: {
        problem,
        agitate,
        solution,
        rehook,
        story,
        lesson,
        actionable,
        you
      },
      locked: !!item.locked
    }
  })
}

export function IdeaPlanner({ onSendToResearch, onSendToWrite }: IdeaPlannerProps) {
  const [focus, setFocus] = useState("")
  const [schedule, setSchedule] = useState<PlannerItem[]>([])
  const [dbStateId, setDbStateId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 1. Fetch latest schedule on mount
  useEffect(() => {
    async function loadPlanner() {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const { data, error } = await supabase
          .from("planner_state")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          const state: PlannerState = data[0]
          setFocus(state.focus_context)
          setSchedule(cleanScheduleItems(state.schedule))
          setDbStateId(state.id ?? null)
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem("vena_planner_local_fallback")
          if (stored) {
            const parsed = JSON.parse(stored)
            setFocus(parsed.focus_context || "")
            setSchedule(cleanScheduleItems(parsed.schedule))
            setInfoMessage("Loaded planner from local cache. Save context to sync with database.")
          }
        }
      } catch (err) {
        console.warn("Supabase fetch failed, trying local cache:", err)
        const stored = localStorage.getItem("vena_planner_local_fallback")
        if (stored) {
          const parsed = JSON.parse(stored)
          setFocus(parsed.focus_context || "")
          setSchedule(cleanScheduleItems(parsed.schedule))
        }
        setInfoMessage("Supabase sync currently offline. Operating in local mode.")
      } finally {
        setIsLoading(false)
      }
    }
    loadPlanner()
  }, [])

  // Auto clear messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 6000)
      return () => clearTimeout(t)
    }
  }, [errorMessage])

  // Helper: Save state to Supabase & local storage
  const savePlannerState = async (updatedSchedule: PlannerItem[], updatedFocus: string) => {
    setIsSaving(true)
    const localData = { focus_context: updatedFocus, schedule: updatedSchedule }
    localStorage.setItem("vena_planner_local_fallback", JSON.stringify(localData))

    try {
      if (dbStateId) {
        const { error } = await supabase
          .from("planner_state")
          .update({
            focus_context: updatedFocus,
            schedule: updatedSchedule,
            updated_at: new Date().toISOString()
          })
          .eq("id", dbStateId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("planner_state")
          .insert({
            focus_context: updatedFocus,
            schedule: updatedSchedule,
            updated_at: new Date().toISOString()
          })
          .select()

        if (error) throw error
        if (data && data.length > 0) {
          setDbStateId(data[0].id)
        }
      }
      setSuccessMessage("Planner saved and synced with database.")
      setInfoMessage(null)
    } catch (err) {
      console.error("Supabase save failed:", err)
      setInfoMessage("Planner saved locally. Database sync failed (please verify planner_state table).")
    } finally {
      setIsSaving(false)
    }
  }

  // 2. Generate or Regenerate Timetable (Smart Locking)
  const handleGenerateSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!focus.trim()) return

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Filter out only locked items to send to the generator
    const lockedItems = schedule.filter(item => item.locked)

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: focus.trim(),
          lockedItems
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate schedule")

      const newSchedule: PlannerItem[] = data.schedule || []
      if (newSchedule.length === 0) {
        throw new Error("API returned an empty schedule.")
      }

      const cleaned = cleanScheduleItems(newSchedule)
      setSchedule(cleaned)
      await savePlannerState(cleaned, focus.trim())
    } catch (err) {
      console.error("[generate schedule] error:", err)
      const message = err instanceof Error ? err.message : "Failed to generate schedule."
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle single item lock status
  const toggleLock = async (id: string) => {
    const updated = schedule.map(item => {
      if (item.id === id) {
        return { ...item, locked: !item.locked }
      }
      return item
    })
    setSchedule(updated)
    await savePlannerState(updated, focus)
  }

  // Toggle single item details expansion
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedIds(next)
  }

  // Copy query to clipboard
  const handleCopyQuery = (query: string, id: string) => {
    navigator.clipboard.writeText(query)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter schedule items based on category tabs
  const filteredSchedule = schedule.filter(item => {
    if (activeFilter === "all") return true
    return item.category === activeFilter
  })

  // Get counts per category tab
  const getCategoryCount = (cat: FilterCategory) => {
    if (cat === "all") return schedule.length
    return schedule.filter(item => item.category === cat).length
  }

  const totalLocked = schedule.filter(item => item.locked).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[var(--c-accent)]" />
            Idea Bank
          </h1>
          <p className="text-[12px] mt-1" style={{ color: "var(--c-text-3)" }}>
            A repository of custom content ideas. Lock the concepts you like and regenerate the rest to browse new angles.
          </p>
        </div>
      </div>

      {/* FOCUS INPUT CARD WITH NATIVE DICTATION */}
      <div
        className="rounded-[10px] border p-5 space-y-4"
        style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)" }}
      >
        <form onSubmit={handleGenerateSchedule} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>
              My Writing Focus Context & Niche
            </label>
            <VoiceDictation
              onTranscript={(text) => setFocus(prev => prev ? `${prev} ${text}` : text)}
              placeholder="Listening to focus..."
            />
          </div>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            disabled={isLoading || isSaving}
            rows={3}
            placeholder="e.g. Technical Educator persona. Teaching founders about Postgres query tuning, cloud database tool evaluations, and AI API pricing optimizations using real-world analogies."
            className="w-full text-[13px] rounded-[6px] p-3 transition-all focus:outline-none resize-y disabled:opacity-50"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text)",
              boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px inset"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--c-border-2)"}
            onBlur={(e) => e.target.style.borderColor = "var(--c-border)"}
          />
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-[11px]" style={{ color: "var(--c-text-3)" }}>
              Vena translates this background into distinct categories automatically.
            </div>
            <div className="flex items-center gap-2">
              {schedule.length > 0 && (
                <button
                  type="button"
                  onClick={() => savePlannerState(schedule, focus)}
                  disabled={isLoading || isSaving || !focus.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold border transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    background: "transparent",
                    borderColor: "var(--c-border)",
                    color: "var(--c-text-2)"
                  }}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Context
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || isSaving || !focus.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[12px] font-bold transition-all cursor-pointer disabled:opacity-40"
                style={{
                  background: "var(--c-accent)",
                  color: "var(--c-accent-fg)"
                }}
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {schedule.length > 0 ? "Regenerate All Unlocked" : "Generate Idea Bank"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* NOTIFICATIONS */}
      {infoMessage && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-[6px] text-[13px] text-amber-500">
          <HelpCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{infoMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 bg-[#eb5757]/10 border border-[#eb5757]/20 rounded-[6px] text-[13px] text-[#eb5757]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[6px] text-[13px] text-emerald-500">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* CATEGORY TABS */}
      {schedule.length > 0 && (
        <div
          className="flex border-b overflow-x-auto select-none"
          style={{ borderColor: "var(--c-border)" }}
        >
          {(["all", "marketing", "ai-business", "development", "productivity"] as FilterCategory[]).map((cat) => {
            const label = cat === "all" ? "All Topics" : CAT_LABELS[cat]
            const count = getCategoryCount(cat)
            const isActive = activeFilter === cat

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className="px-4 py-2 text-[12px] font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  borderColor: isActive ? "var(--c-accent)" : "transparent",
                  color: isActive ? "var(--c-text)" : "var(--c-text-3)"
                }}
              >
                {label}
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-[4px] font-mono"
                  style={{
                    background: isActive ? "var(--c-overlay)" : "var(--c-elevated)",
                    color: "var(--c-text-3)"
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* SKELETON / LOADING LOOPS */}
      {isLoading && schedule.length === 0 ? (
        <div className="space-y-3 pt-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[60px] rounded-[6px] border animate-pulse"
              style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)" }}
            />
          ))}
        </div>
      ) : filteredSchedule.length > 0 ? (
        /* TABLE / DIRECTORY VIEW */
        <div
          className="rounded-[10px] border overflow-hidden"
          style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}
        >
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {filteredSchedule.map((item) => {
              const isExpanded = expandedIds.has(item.id)
              const categoryBadge = CAT_STYLES[item.category] || CAT_STYLES["development"]

              return (
                <div key={item.id} className="transition-all hover:bg-[var(--c-surface)]/30">
                  {/* Row Header Block */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 cursor-pointer select-none">
                    {/* Left: Lock, Category, Headline */}
                    <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => toggleExpand(item.id)}>
                      {/* Lock status toggle button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleLock(item.id) }}
                        className="p-1.5 rounded transition-all cursor-pointer border"
                        style={{
                          background: item.locked ? "rgba(228,242,34,0.06)" : "transparent",
                          borderColor: item.locked ? "rgba(228,242,34,0.3)" : "var(--c-border)",
                          color: item.locked ? "var(--c-accent)" : "var(--c-text-4)"
                        }}
                      >
                        {item.locked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Category Label */}
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase shrink-0"
                        style={{
                          background: categoryBadge.bg,
                          color: categoryBadge.text,
                          borderColor: categoryBadge.border
                        }}
                      >
                        {CAT_LABELS[item.category] || "Development"}
                      </span>

                      {/* Headline Text */}
                      <p className="text-[13px] font-bold truncate flex-1" style={{ color: "var(--c-text)" }}>
                        {item.headline}
                      </p>

                      {/* Expand Indicator */}
                      <div className="text-zinc-500 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => onSendToResearch(item.searchQuery)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[11px] font-bold border transition-all cursor-pointer"
                        style={{
                          background: "var(--c-surface)",
                          borderColor: "var(--c-border)",
                          color: "var(--c-text-2)"
                        }}
                      >
                        <Search className="w-3 h-3" />
                        Deep Research
                      </button>
                      <button
                        onClick={() => onSendToWrite(item.headline)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer"
                        style={{
                          background: "var(--c-accent)",
                          color: "var(--c-accent-fg)"
                        }}
                      >
                        <PenLine className="w-3 h-3" />
                        Draft Post
                      </button>
                    </div>
                  </div>

                  {/* Expandable SLAY / Query Details Drawer */}
                  {isExpanded && (
                    <div
                      className="px-5 pb-5 pt-1 space-y-4 border-t transition-all animate-fade-in"
                      style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
                    >
                      {/* Deep Research Query */}
                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          Search Query Anchor
                        </span>
                        <div
                          className="flex items-start justify-between gap-3 p-2.5 rounded border font-mono text-[11px] leading-relaxed break-all"
                          style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)" }}
                        >
                          <span style={{ color: "var(--c-text-2)" }}>{item.searchQuery}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyQuery(item.searchQuery, item.id)}
                            className="p-1 rounded hover:bg-zinc-800 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer shrink-0"
                            title="Copy search query"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Playbook Metadata */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-3)]">
                          Funnel Strategy:
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--c-overlay)] border border-[var(--c-border-2)] text-[var(--c-text)] uppercase tracking-wider">
                          {item.bucket}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-3)]">
                          Framework:
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--c-accent-fg)] bg-[var(--c-accent)] border border-[var(--c-accent)] uppercase tracking-wider">
                          {item.framework}
                        </span>
                      </div>

                      {/* Dynamic PASS / SLAY Outline Rendering */}
                      {item.framework === "pass" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#eb5757" }}>
                                P: Problem
                              </span>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.problem}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#5e6ad2" }}>
                                A: Agitate
                              </span>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.agitate}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#27a644" }}>
                                S: Solution
                              </span>
                              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.solution}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#02b8cc" }}>
                                S: Rehook
                              </span>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.rehook}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#5e6ad2" }}>
                                S: Story Hook
                              </span>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.story}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#02b8cc" }}>
                                L: Key Lessons
                              </span>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.lesson}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#27a644" }}>
                                A: Actionable Steps
                              </span>
                              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.actionable}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded border flex flex-col justify-between" style={{ borderColor: "var(--c-border)", background: "var(--c-elevated)" }}>
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--c-accent)" }}>
                                Y: You Reframe
                              </span>
                              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                                {item.outline.you}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* EMPTY STATE */
        <div
          className="flex flex-col items-center justify-center text-center p-12 rounded-[10px] border space-y-3 select-none"
          style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)" }}
        >
          <Lightbulb className="w-8 h-8 text-zinc-500 animate-pulse" />
          <h3 className="text-[14px] font-bold" style={{ color: "var(--c-text-2)" }}>No ideas generated yet</h3>
          <p className="text-[12px] max-w-md mx-auto" style={{ color: "var(--c-text-3)" }}>
            Enter your niche context above and click &quot;Generate Idea Bank&quot; to see 20 topics (5 per category).
          </p>
        </div>
      )}

      {/* BOTTOM STICKY/TOOLBAR SLATE */}
      {schedule.length > 0 && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-lg w-11/12 rounded-[10px] border p-3 flex items-center justify-between gap-4 shadow-xl z-50 animate-slide-in-right"
          style={{
            background: "rgba(22,23,24,0.85)",
            backdropFilter: "blur(8px)",
            borderColor: "var(--c-border)"
          }}
        >
          <span className="text-[11px] font-semibold" style={{ color: "var(--c-text-2)" }}>
            🔒 {totalLocked} of {schedule.length} topics locked
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateSchedule()}
              disabled={isLoading || isSaving || totalLocked === schedule.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
              style={{
                background: "var(--c-accent)",
                color: "var(--c-accent-fg)"
              }}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
              Regenerate Unlocked
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
