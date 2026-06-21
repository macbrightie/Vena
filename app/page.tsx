"use client"

import React, { useState, useEffect, useRef } from "react"
import { ResearchPanel } from "@/components/research/research-panel"
import { PostEditor } from "@/components/editor/post-editor"
import { LinkedInPreview } from "@/components/preview/linkedin-preview"
import { VaultManager } from "@/components/post-vault/vault-manager"
import { IdeaPlanner } from "@/components/planner/idea-planner"
import { useTheme } from "@/lib/theme"
import {
  PenLine as PenLineIcon,
  Search as SearchIcon,
  Database,
  Settings,
  Sun,
  Moon,
  Trash2,
  Lightbulb,
} from "lucide-react"
import type { LinkedInPost, ResearchResult } from "@/types"

type ActiveTab = "research" | "generate" | "vault" | "planner"

export default function VenaApp() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [previewContent, setPreviewContent] = useState("")
  const [currentResearch, setCurrentResearch] = useState<{
    synthesis: string
    sources: ResearchResult[]
  } | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("research")
  const [writeSubTab, setWriteSubTab] = useState<"editor" | "chat" | "preview">("editor")
  const [referencePost, setReferencePost] = useState<LinkedInPost | null>(null)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [activeResearchQuery, setActiveResearchQuery] = useState("")
  const [activeWriteTopic, setActiveWriteTopic] = useState("")
  const [workspaceWidth, setWorkspaceWidth] = useState(60)
  const [isMobile, setIsMobile] = useState(false)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleWorkspaceResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return
      const widthPct = (moveEvent.clientX / window.innerWidth) * 100
      const clampedPct = Math.max(30, Math.min(75, widthPct))
      setWorkspaceWidth(clampedPct)
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

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    localStorage.setItem("vena_active_tab", tab)
  }

  const handleSendToResearch = (query: string) => {
    setActiveResearchQuery(query)
    handleTabChange("research")
  }

  const handleSendToWrite = (topic: string) => {
    setActiveWriteTopic(topic)
    handleTabChange("generate")
  }

  interface ResearchHistoryItem {
    id: string
    topic: string
    synthesis: string
    sources: ResearchResult[]
    timestamp: string
  }

  const [researchHistory, setResearchHistory] = useState<ResearchHistoryItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vena_research_history")
      if (stored) {
        const parsed = JSON.parse(stored)
        const timer = setTimeout(() => {
          setResearchHistory(parsed)
        }, 0)
        return () => clearTimeout(timer)
      }
    } catch (err) {
      console.error("Failed to load research history:", err)
    }
  }, [])

  useEffect(() => {
    try {
      const storedTab = localStorage.getItem("vena_active_tab") as ActiveTab | null
      if (storedTab && ["research", "generate", "planner", "vault"].includes(storedTab)) {
        const timer = setTimeout(() => {
          setActiveTab(storedTab)
        }, 0)
        return () => clearTimeout(timer)
      }
    } catch (err) {
      console.error("Failed to load active tab:", err)
    }
  }, [])

  const handleResearchSelected = (
    res: { synthesis: string; sources: ResearchResult[] } | null,
    query?: string
  ) => {
    setCurrentResearch(res)
    if (res && query) {
      setResearchHistory((prev) => {
        const filtered = prev.filter((item) => item.topic.toLowerCase() !== query.toLowerCase())
        const newItem: ResearchHistoryItem = {
          id: `res-${Date.now()}`,
          topic: query,
          synthesis: res.synthesis,
          sources: res.sources,
          timestamp: new Date().toISOString(),
        }
        const next = [newItem, ...filtered].slice(0, 20)
        localStorage.setItem("vena_research_history", JSON.stringify(next))
        return next
      })
    }
  }

  const handleDeleteHistory = (id: string) => {
    setResearchHistory((prev) => {
      const next = prev.filter((item) => item.id !== id)
      localStorage.setItem("vena_research_history", JSON.stringify(next))
      return next
    })
  }

  const handleWriteLikeThis = (post: LinkedInPost) => {
    setReferencePost(post)
    handleTabChange("generate")
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "var(--c-bg)", color: "var(--c-text)" }}
    >
      {/* ── SIDEBAR (Hidden on mobile) ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[188px] shrink-0 h-full select-none"
        style={{ background: "var(--c-surface)", borderRight: "1px solid var(--c-border)" }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-7 flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0"
            style={{ background: "var(--c-accent)" }}
          >
            <PenLineIcon className="w-3.5 h-3.5" style={{ color: "var(--c-accent-fg)" }} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[15px] tracking-[-0.3px]" style={{ color: "var(--c-text)" }}>
            Vena
          </span>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          <NavItem icon={SearchIcon}   label="Research"    active={activeTab === "research"} onClick={() => handleTabChange("research")} />
          <NavItem icon={PenLineIcon}  label="Write"       active={activeTab === "generate"} onClick={() => handleTabChange("generate")} />
          <NavItem icon={Lightbulb}    label="Idea Planner" active={activeTab === "planner"}   onClick={() => handleTabChange("planner")} />
          <NavItem icon={Database}     label="Style Vault" active={activeTab === "vault"}    onClick={() => handleTabChange("vault")} />
        </nav>

        <div
          className="px-2 pb-4 pt-3 space-y-0.5"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          <NavItem icon={Settings} label="Settings" active={false} onClick={() => {}} />
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">

        {/* Top bar */}
        <header
          className="h-[52px] shrink-0 flex items-center justify-between px-5"
          style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
        >
          {/* Logo showing only on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <div
              className="w-5.5 h-5.5 rounded-[4px] flex items-center justify-center shrink-0"
              style={{ background: "var(--c-accent)" }}
            >
              <PenLineIcon className="w-3.5 h-3.5" style={{ color: "var(--c-accent-fg)" }} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[14px] tracking-[-0.3px]" style={{ color: "var(--c-text)" }}>
              Vena
            </span>
          </div>

          {/* Tab buttons showing only on desktop */}
          <div className="hidden md:flex items-center gap-1">
            {(["research", "generate", "planner", "vault"] as ActiveTab[]).map((tab) => {
              const labels: Record<ActiveTab, string> = {
                research: "Research",
                generate: "Write Post",
                planner: "Idea Planner",
                vault: "Style Vault",
              }
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-all cursor-pointer"
                  style={{
                    background: activeTab === tab ? "var(--c-overlay)" : "transparent",
                    color: activeTab === tab ? "var(--c-text)" : "var(--c-text-3)",
                  }}
                >
                  {labels[tab]}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {currentResearch && activeTab === "generate" && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[6px]"
                style={{ color: "#27a644", background: "rgba(39,166,68,0.10)", border: "1px solid rgba(39,166,68,0.2)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#27a644] animate-pulse" />
                Research active
              </span>
            )}
            {referencePost && activeTab === "generate" && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[6px]"
                style={{ color: "#5e6ad2", background: "rgba(94,106,210,0.10)", border: "1px solid rgba(94,106,210,0.2)" }}
              >
                <PenLineIcon className="w-3 h-3" />
                Reference active
                <button
                  onClick={() => setReferencePost(null)}
                  className="ml-1 opacity-60 hover:opacity-100 cursor-pointer"
                >×</button>
              </span>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-[6px] cursor-pointer transition-all"
              style={{ color: "var(--c-text-3)" }}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-overlay)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer"
              style={{
                background: "var(--c-overlay)",
                border: "1px solid var(--c-border-2)",
                color: "var(--c-text-2)",
              }}
            >
              YO
            </div>
          </div>
        </header>

        {/* ── Page body (Added mobile pb padding space for mobile nav) ── */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden pb-16 md:pb-0">

          {/* Research */}
          {activeTab === "research" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
              {/* Left Side: Main Research panel */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="px-6 py-5 shrink-0" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
                  <h1 className="text-[15px] font-semibold tracking-[-0.2px]" style={{ color: "var(--c-text)" }}>
                    Web Research
                  </h1>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                    Pull insights from the web before you write
                  </p>
                </div>
                <div className="p-6 flex-1 max-w-2xl w-full">
                  <ResearchPanel
                    onResearchSelected={handleResearchSelected}
                    currentResearch={currentResearch}
                    onSwitchToWrite={() => setActiveTab("generate")}
                    initialInstruction={activeResearchQuery}
                  />
                </div>
              </div>

              {/* Right Side: History sidebar */}
              <div
                className="w-full md:w-[280px] shrink-0 h-auto md:h-full border-t md:border-t-0 md:border-l flex flex-col select-none"
                style={{ borderColor: "var(--c-border)", background: "var(--c-surface)" }}
              >
                <div className="px-4 py-4 border-b shrink-0" style={{ borderColor: "var(--c-border)" }}>
                  <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--c-text)" }}>Research History</h2>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-3)" }}>Select past search to restore results</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {researchHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[11px]" style={{ color: "var(--c-text-3)" }}>No past research runs.</p>
                    </div>
                  ) : (
                    researchHistory.map((item) => {
                      const isActive = currentResearch?.synthesis === item.synthesis
                      return (
                        <div
                          key={item.id}
                          className="group relative flex flex-col p-2.5 rounded-[6px] border cursor-pointer transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
                          style={{
                            background: isActive ? "var(--c-overlay)" : "var(--c-elevated)",
                            borderColor: isActive ? "var(--c-accent)" : "var(--c-border)",
                          }}
                          onClick={() => {
                            setCurrentResearch({ synthesis: item.synthesis, sources: item.sources })
                          }}
                        >
                          <span className="text-[12px] font-semibold line-clamp-2 pr-6 leading-normal" style={{ color: "var(--c-text)" }}>
                            {item.topic}
                          </span>
                          <span className="text-[9px] mt-1" style={{ color: "var(--c-text-3)" }}>
                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteHistory(item.id)
                            }}
                            className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer text-stone-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Write — 50/50 on desktop, sub-tab panels on mobile */}
          {activeTab === "generate" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Segmented Switcher for Mobile */}
              <div className="flex md:hidden items-center justify-center p-2 border-b shrink-0" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                <div className="flex bg-[var(--c-elevated)] border border-[var(--c-border)] rounded-[8px] p-0.5 w-full max-w-sm">
                  {(["editor", "chat", "preview"] as const).map((subTab) => (
                    <button
                      key={subTab}
                      onClick={() => setWriteSubTab(subTab)}
                      className="flex-1 text-center py-1.5 rounded-[6px] text-[11px] font-semibold transition-all capitalize cursor-pointer animate-fade-in"
                      style={{
                        background: writeSubTab === subTab ? "var(--c-surface)" : "transparent",
                        color: writeSubTab === subTab ? "var(--c-text)" : "var(--c-text-3)",
                        boxShadow: writeSubTab === subTab ? "rgba(0,0,0,0.1) 0px 1px 3px" : "none",
                      }}
                    >
                      {subTab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Workspace Column */}
              <div
                className={`flex-col overflow-hidden ${
                  writeSubTab === "preview" ? "hidden md:flex" : "flex flex-1 min-w-0"
                }`}
                style={!isMobile ? {
                  width: writeSubTab === "preview" ? "0%" : `${workspaceWidth}%`,
                  flex: "none",
                  borderRight: "1px solid var(--c-border)"
                } : {
                  borderRight: "1px solid var(--c-border)"
                }}
              >
                <PostEditor
                  onDraftChange={() => {}}
                  onPreviewChange={setPreviewContent}
                  currentResearch={currentResearch}
                  onResearchChange={(res, query) => handleResearchSelected(res, query)}
                  referencePost={referencePost}
                  onClearReference={() => setReferencePost(null)}
                  initialTopic={activeWriteTopic}
                  activeSubTab={writeSubTab}
                />
              </div>

              {/* Draggable Divider Handle (Desktop Only) */}
              {writeSubTab !== "preview" && (
                <div
                  onMouseDown={handleWorkspaceResizeStart}
                  className="hidden md:block w-[7px] -mx-[3.5px] z-30 cursor-col-resize hover:bg-[var(--c-accent)] transition-colors relative self-stretch"
                  title="Drag to resize columns"
                >
                  <div
                    className="absolute inset-y-0 left-[3px] w-[1px] pointer-events-none"
                    style={{ background: "var(--c-border)" }}
                  />
                </div>
              )}

              {/* Preview Column */}
              <div
                className={`flex-col overflow-hidden ${
                  writeSubTab === "preview" ? "flex flex-1 min-w-0" : "hidden md:flex"
                }`}
                style={!isMobile ? {
                  background: "var(--c-surface)",
                  flex: "1 1 0%",
                  width: writeSubTab === "preview" ? "100%" : "auto"
                } : {
                  background: "var(--c-surface)"
                }}
              >
                <div
                  className="px-5 py-2.5 shrink-0 flex items-center justify-between"
                  style={{ borderBottom: "1px solid var(--c-border)" }}
                >
                  <div>
                    <p className="text-[13px] font-semibold tracking-[-0.2px]" style={{ color: "var(--c-text)" }}>
                      LinkedIn Preview
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      {previewContent ? "Hover a chat version to compare" : "Generate a post to see the preview"}
                    </p>
                  </div>
                  
                  {/* Desktop / Mobile switcher tabs */}
                  <div
                    className="flex gap-1 p-0.5 rounded-[6px]"
                    style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
                  >
                    {(["desktop", "mobile"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className="px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer"
                        style={{
                          background: previewMode === mode ? "var(--c-surface)" : "transparent",
                          color: previewMode === mode ? "var(--c-text)" : "var(--c-text-3)",
                          boxShadow: previewMode === mode ? "rgba(0,0,0,0.1) 0px 1px 3px" : "none",
                        }}
                      >
                        {mode === "desktop" ? "Desktop" : "Mobile"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <LinkedInPreview content={previewContent} viewMode={previewMode} />
                  {!previewContent && (
                    <div
                      className="mt-5 rounded-[12px] p-4"
                      style={{ border: "1px solid var(--c-border)", background: "var(--c-elevated)" }}
                    >
                      <p
                        className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                        style={{ color: "var(--c-text-3)" }}
                      >
                        Writing Tips
                      </p>
                      <ul className="space-y-2.5">
                        {[
                          "Start with a bold, specific claim",
                          "One blank line between each paragraph",
                          "Under 1,200 chars for best reach",
                          "End with a question or clear CTA",
                        ].map((tip, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-[12px] leading-relaxed"
                            style={{ color: "var(--c-text-2)" }}
                          >
                            <span className="font-bold shrink-0" style={{ color: "var(--c-accent)" }}>·</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vault — full page */}
          {activeTab === "vault" && (
            <VaultManager onWriteLikeThis={handleWriteLikeThis} />
          )}

          {/* Idea Planner — full page */}
          {activeTab === "planner" && (
            <IdeaPlanner
              onSendToResearch={handleSendToResearch}
              onSendToWrite={handleSendToWrite}
            />
          )}
        </div>

        {/* ── MOBILE BOTTOM NAVIGATION ────────────────────────── */}
        <nav
          className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 shrink-0 z-50 items-center justify-around px-2 border-t"
          style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
        >
          <MobileNavItem icon={SearchIcon} label="Research" active={activeTab === "research"} onClick={() => handleTabChange("research")} />
          <MobileNavItem icon={PenLineIcon} label="Write" active={activeTab === "generate"} onClick={() => handleTabChange("generate")} />
          <MobileNavItem icon={Lightbulb} label="Planner" active={activeTab === "planner"} onClick={() => handleTabChange("planner")} />
          <MobileNavItem icon={Database} label="Vault" active={activeTab === "vault"} onClick={() => handleTabChange("vault")} />
        </nav>
      </div>
    </div>
  )
}

function NavItem({
  icon: Icon, label, active, onClick,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all cursor-pointer"
      style={{
        background: active ? "var(--c-overlay)" : "transparent",
        color: active ? "var(--c-text)" : "var(--c-text-3)",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--c-elevated)" }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "var(--c-overlay)" : "transparent" }}
    >
      <Icon
        className="w-4 h-4 shrink-0"
        style={{ color: active ? "var(--c-accent)" : "inherit" }}
        strokeWidth={active ? 2.5 : 2}
      />
      {label}
    </button>
  )
}

function MobileNavItem({
  icon: Icon, label, active, onClick,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-1 text-center cursor-pointer transition-all"
      style={{
        color: active ? "var(--c-accent)" : "var(--c-text-3)",
      }}
    >
      <Icon
        className="w-5 h-5 shrink-0"
        style={{ color: active ? "var(--c-accent)" : "inherit" }}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className="text-[10px] font-semibold tracking-[-0.2px]">{label}</span>
    </button>
  )
}
