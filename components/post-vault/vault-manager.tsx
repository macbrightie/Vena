"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Plus, Trash2, Search, Loader2, AlertCircle,
  BookOpen, ExternalLink, Link2, FileText,
  Upload, Tag, Filter, LayoutGrid, PenLine,
  User, Trophy, HelpCircle,
  Video, CheckCircle2,
} from "lucide-react"
import type { LinkedInPost, PostCategory, VoiceDoc, VoiceDocType } from "@/types"

// Custom SVG components for Twitter and LinkedIn since brand icons are deprecated/removed in some lucide versions
const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

interface VaultManagerProps {
  onWriteLikeThis?: (post: LinkedInPost) => void
}

type VaultTab = "wall" | "voice"

const CATEGORIES: { id: PostCategory | "all"; label: string; dot: string }[] = [
  { id: "all",       label: "All",       dot: "var(--c-text-3)" },
  { id: "story",     label: "Story",     dot: "#5e6ad2" },
  { id: "education", label: "Education", dot: "#27a644" },
  { id: "news",      label: "News",      dot: "#02b8cc" },
  { id: "other",     label: "Other",     dot: "var(--c-text-3)" },
]

const CAT: Record<PostCategory, { bg: string; text: string; border: string; label: string }> = {
  story:     { bg: "rgba(94,106,210,0.10)",  text: "#5e6ad2", border: "rgba(94,106,210,0.25)", label: "Story" },
  education: { bg: "rgba(39,166,68,0.10)",   text: "#27a644", border: "rgba(39,166,68,0.25)",  label: "Education" },
  news:      { bg: "rgba(2,184,204,0.10)",   text: "#02b8cc", border: "rgba(2,184,204,0.25)",  label: "News" },
  other:     { bg: "rgba(138,143,152,0.10)", text: "#8a8f98", border: "rgba(138,143,152,0.25)",label: "Other" },
}

const VOICE_TYPES: { id: VoiceDocType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "writing-style", label: "Writing Style",  icon: PenLine,    desc: "Sample posts, tone guide, vocab I use" },
  { id: "achievements",  label: "Achievements",   icon: Trophy,     desc: "Awards, milestones, results, numbers" },
  { id: "background",    label: "Background",     icon: User,       desc: "Bio, career history, expertise" },
  { id: "other",         label: "Other Context",  icon: HelpCircle, desc: "Anything else Vena should know" },
]

const VOICE_COLORS: Record<VoiceDocType, { bg: string; text: string; border: string }> = {
  "writing-style": { bg: "rgba(94,106,210,0.08)",  text: "#5e6ad2", border: "rgba(94,106,210,0.2)" },
  "achievements":  { bg: "rgba(228,242,34,0.08)",  text: "#b8be0c", border: "rgba(228,242,34,0.2)" },
  "background":    { bg: "rgba(39,166,68,0.08)",   text: "#27a644", border: "rgba(39,166,68,0.2)" },
  "other":         { bg: "rgba(138,143,152,0.08)", text: "#8a8f98", border: "rgba(138,143,152,0.2)" },
}

function isUrl(s: string) { try { new URL(s); return true } catch { return false } }
function getDomain(url: string) { try { return new URL(url).hostname.replace("www.", "") } catch { return url } }

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post, onDelete, isDeleting, onWriteLikeThis, onUpdateCategory }: {
  post: LinkedInPost
  onDelete: () => void
  isDeleting: boolean
  onWriteLikeThis: () => void
  onUpdateCategory: (newCat: PostCategory) => void
}) {
  const badge = post.category ? CAT[post.category] : CAT.other
  const hasUrl = !!post.url
  const hasContent = !!post.content.trim()

  return (
    <div
      className="group flex flex-col rounded-[10px] border overflow-hidden transition-all hover:shadow-lg"
      style={{
        background: "var(--c-elevated)",
        borderColor: "var(--c-border)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <select
            value={post.category ?? "other"}
            onChange={(e) => onUpdateCategory(e.target.value as PostCategory)}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] cursor-pointer border focus:outline-none transition-all shrink-0"
            style={{
              background: badge.bg,
              color: badge.text,
              borderColor: badge.border,
            }}
          >
            <option value="story" className="bg-[var(--c-surface)] text-[var(--c-text)]">Story</option>
            <option value="education" className="bg-[var(--c-surface)] text-[var(--c-text)]">Education</option>
            <option value="news" className="bg-[var(--c-surface)] text-[var(--c-text)]">News</option>
            <option value="other" className="bg-[var(--c-surface)] text-[var(--c-text)]">Other</option>
          </select>
          {post.author && (
            <span
              className="text-[10.5px] font-medium truncate"
              style={{ color: "var(--c-text-2)" }}
              title={post.author}
            >
              👤 {post.author}
            </span>
          )}
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-[4px] transition-all cursor-pointer shrink-0"
          style={{ color: "var(--c-text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#eb5757")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text-3)")}
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Content preview — the main thing */}
      <div className="px-3.5 pb-2 flex-1 min-h-0">
        {hasContent ? (
          <div className="relative">
            <p
              className="text-[12.5px] leading-[1.65] break-words"
              style={{
                color: "var(--c-text-2)",
                display: "-webkit-box",
                WebkitLineClamp: 8,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {post.content}
            </p>
            {/* Fade at bottom if truncated */}
            {(post.content.split("\n").length > 8 || post.content.length > 380) && (
              <div
                className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent, var(--c-elevated))" }}
              />
            )}
          </div>
        ) : (
          /* No content — prompt user to add it */
          <div
            className="flex flex-col items-center justify-center py-4 rounded-[6px] text-center"
            style={{ background: "var(--c-overlay)", border: "1px dashed var(--c-border-2)" }}
          >
            <FileText className="w-5 h-5 mb-1.5" style={{ color: "var(--c-text-4)" }} />
            <p className="text-[11px] font-medium" style={{ color: "var(--c-text-3)" }}>No preview</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-4)" }}>
              Paste the post text to see it here
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 pb-3.5 pt-1 space-y-2">
        {/* Topic tag */}
        {post.topic && (
          <div className="flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" style={{ color: "var(--c-text-4)" }} />
            <span className="text-[10px]" style={{ color: "var(--c-text-3)" }}>{post.topic}</span>
          </div>
        )}

        {/* Image indicator */}
        {(post.hasImage || post.has_image) && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-[3px] border" style={{ background: "var(--c-overlay)", borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
              📷 Image Attached
            </span>
          </div>
        )}

        {/* URL pill (secondary — below content) */}
        {hasUrl && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-[4px] border transition-all hover:opacity-80"
            style={{
              background: "var(--c-overlay)",
              borderColor: "var(--c-border)",
              textDecoration: "none",
            }}
          >
            <img
              src={`https://www.google.com/s2/favicons?sz=14&domain=${getDomain(post.url!)}`}
              alt=""
              className="w-3.5 h-3.5 rounded-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
            <span className="text-[11px] truncate flex-1" style={{ color: "var(--c-text-3)" }}>
              {getDomain(post.url!)}
            </span>
            <ExternalLink className="w-3 h-3 shrink-0" style={{ color: "var(--c-text-3)" }} />
          </a>
        )}

        {/* Write like this */}
        <button
          onClick={onWriteLikeThis}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] border text-[11px] font-semibold transition-all cursor-pointer"
          style={{ background: "transparent", borderColor: "var(--c-border-2)", color: "var(--c-text-2)" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--c-accent)"
            e.currentTarget.style.color = "var(--c-accent-fg)"
            e.currentTarget.style.borderColor = "var(--c-accent)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "var(--c-text-2)"
            e.currentTarget.style.borderColor = "var(--c-border-2)"
          }}
        >
          <PenLine className="w-3 h-3" />
          Write like this
        </button>
      </div>
    </div>
  )
}

// ── Voice doc card ─────────────────────────────────────────────
function VoiceDocCard({ doc, onDelete }: { doc: VoiceDoc; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const vtype = VOICE_TYPES.find(t => t.id === doc.docType) ?? VOICE_TYPES[3]
  const colors = VOICE_COLORS[doc.docType]
  const Icon = vtype.icon
  return (
    <div
      className="group p-4 rounded-[10px] border transition-all"
      style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
          >
            <Icon className="w-4 h-4" style={{ color: colors.text }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--c-text)" }}>{doc.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px]"
                style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
              >
                {vtype.label}
              </span>
              <span className="text-[10px]" style={{ color: "var(--c-text-3)" }}>
                {doc.charCount.toLocaleString()} chars
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-[4px] transition-all cursor-pointer mt-0.5"
          style={{ color: "var(--c-text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#eb5757")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text-3)")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] font-medium cursor-pointer"
        style={{ color: "#5e6ad2" }}
      >
        {expanded ? "Hide preview" : "Preview content"}
      </button>
      {expanded && (
        <div
          className="mt-2 p-3 rounded-[6px] text-[12px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap"
          style={{ background: "var(--c-overlay)", border: "1px solid var(--c-border)", color: "var(--c-text-3)" }}
        >
          {doc.content.slice(0, 800)}{doc.content.length > 800 ? "…" : ""}
        </div>
      )}
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e4f222]" />
        <span className="text-[10px]" style={{ color: "var(--c-text-3)" }}>
          Vena reads this on every generation & refinement
        </span>
      </div>
    </div>
  )
}

function getDefaultPosts(): LinkedInPost[] {
  return [
    {
      id: "demo-1",
      content: "The hardest thing about building a startup isn't the product.\n\nIt's staying consistent when nothing seems to be working.\n\nMost people quit 6 months before the breakthrough.\n\nI almost did.\n\nThree months of zero traction. Then one post. Then everything changed.",
      category: "story",
      topic: "Mindset",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      content: "3 things I wish I knew before my first B2B sales call:\n\n1. Listen more than you talk\n2. The budget conversation happens earlier than you think\n3. A 'no' today is often a 'not yet'\n\nWhich one do you struggle with most?",
      category: "education",
      topic: "Sales",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "demo-3",
      url: "https://www.linkedin.com/posts/example",
      content: "OpenAI just released a feature that will change how founders use AI forever.\n\nHere's what it means for your workflow:\n\n→ 10x faster research\n→ Better synthesis\n→ More context in fewer tokens\n\nThread below.",
      category: "news",
      topic: "AI",
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ]
}

// ── Main ───────────────────────────────────────────────────────
export function VaultManager({ onWriteLikeThis }: VaultManagerProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("wall")
  const [now, setNow] = useState<number>(0)

  // Wall
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [filterCat, setFilterCat] = useState<PostCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newCategory, setNewCategory] = useState<PostCategory>("story")
  const [newTopic, setNewTopic] = useState("")
  const [newAuthor, setNewAuthor] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [isFetchingUrl, setIsFetchingUrl] = useState(false)

  // Social Import States
  type ImportMode = "manual" | "social"
  const [importMode, setImportMode] = useState<ImportMode>("manual")
  type SocialPlatform = "linkedin" | "youtube" | "twitter"
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>("linkedin")
  const [socialInput, setSocialInput] = useState("")
  const [socialLimit, setSocialLimit] = useState(5)
  const [isImportingSocial, setIsImportingSocial] = useState(false)
  const [socialError, setSocialError] = useState<string | null>(null)
  const [socialSuccess, setSocialSuccess] = useState<string | null>(null)
  
  interface CreatorSyncLog {
    [key: string]: string // key: profileUrl or username, val: ISO timestamp
  }
  const [syncLog, setSyncLog] = useState<CreatorSyncLog>({})

  // Load sync log from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vena_creator_sync_log")
      if (stored) {
        const parsed = JSON.parse(stored)
        const timer1 = setTimeout(() => {
          setSyncLog(parsed)
        }, 0)
        const timer2 = setTimeout(() => {
          setNow(Date.now())
        }, 0)
        return () => {
          clearTimeout(timer1)
          clearTimeout(timer2)
        }
      } else {
        const timer = setTimeout(() => {
          setNow(Date.now())
        }, 0)
        return () => clearTimeout(timer)
      }
    } catch {
      const timer = setTimeout(() => {
        setNow(Date.now())
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const checkCooldown = (key: string): { locked: boolean; daysRemaining: number } => {
    const lastSyncStr = syncLog[key]
    if (!lastSyncStr || !now) return { locked: false, daysRemaining: 0 }
    
    const lastSync = new Date(lastSyncStr)
    const diffTime = Math.abs(now - lastSync.getTime())
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    
    if (diffDays < 7) {
      return { locked: true, daysRemaining: Math.ceil(7 - diffDays) }
    }
    return { locked: false, daysRemaining: 0 }
  }

  const handleSocialImport = async (e: React.FormEvent) => {
    e.preventDefault()
    const inputVal = socialInput.trim()
    if (!inputVal) return

    setSocialError(null)
    setSocialSuccess(null)

    // Cooldown check for LinkedIn paid API protection
    if (socialPlatform === "linkedin") {
      const { locked, daysRemaining } = checkCooldown(inputVal)
      if (locked) {
        setSocialError(`LinkedIn sync is on cooldown for this profile. Please wait ${daysRemaining} more days.`)
        return
      }
    }

    setIsImportingSocial(true)

    try {
      if (socialPlatform === "linkedin") {
        const res = await fetch("/api/vault/import-linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileUrl: inputVal, limit: socialLimit })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to import from LinkedIn")

        // Helper to extract a friendly name from profile URL
        const getAuthorFromUrl = (url: string, fallback: string) => {
          try {
            const parts = new URL(url).pathname.split("/").filter(Boolean)
            if (parts[0] === "in" && parts[1]) {
              return parts[1]
                .split("-")
                .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ")
            }
            return fallback
          } catch {
            return fallback
          }
        }
        const profileAuthor = getAuthorFromUrl(inputVal, "LinkedIn Creator")

        const importedPosts: LinkedInPost[] = (data.posts || []).map((pObj: unknown, idx: number) => {
          const p = pObj as Record<string, unknown>
          return {
            id: `linkedin-${Date.now()}-${idx}`,
            content: String(p.content || ""),
            url: String(p.url || ""),
            category: (p.category as PostCategory) || "other",
            author: profileAuthor,
            topic: "LinkedIn Import",
            created_at: String(p.date || new Date().toISOString())
          }
        })

        if (importedPosts.length === 0) {
          throw new Error("No posts found or retrieved from this profile.")
        }

        const nextPosts = [...importedPosts, ...posts]
        setPosts(nextPosts)
        localStorage.setItem("vena_post_vault", JSON.stringify(nextPosts))
        
        // Save to server database if not local mode
        if (!isLocalMode) {
          for (const post of importedPosts) {
            try {
              await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: post.content,
                  topic: post.topic,
                  url: post.url,
                  category: post.category,
                  author: post.author
                })
              })
            } catch {}
          }
          await loadPosts()
        }

        // Update sync log
        const nextLog = { ...syncLog, [inputVal]: new Date().toISOString() }
        setSyncLog(nextLog)
        localStorage.setItem("vena_creator_sync_log", JSON.stringify(nextLog))

        setSocialSuccess(`Successfully imported ${importedPosts.length} posts from LinkedIn (${data.source})`)
        setSocialInput("")
      } else if (socialPlatform === "youtube") {
        const res = await fetch("/api/vault/import-youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputVal })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to import YouTube comments")

        const importedComments: LinkedInPost[] = (data.comments || []).map((cObj: unknown, idx: number) => {
          const c = cObj as Record<string, unknown>
          return {
            id: `youtube-${Date.now()}-${idx}`,
            content: `YouTube Comment by @${c.author || "Anonymous"} (👍 ${c.likes || 0}):\n\n${c.text || ""}`,
            url: inputVal,
            category: (c.category as PostCategory) || "other",
            author: String(c.author || "YouTube Commenter"),
            topic: "YouTube Comments",
            created_at: String(c.publishedAt || new Date().toISOString())
          }
        })

        if (importedComments.length === 0) {
          throw new Error("No comments found for this video.")
        }

        const nextPosts = [...importedComments, ...posts]
        setPosts(nextPosts)
        localStorage.setItem("vena_post_vault", JSON.stringify(nextPosts))

        if (!isLocalMode) {
          for (const post of importedComments) {
            try {
              await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: post.content,
                  topic: post.topic,
                  url: post.url,
                  category: post.category,
                  author: post.author
                })
              })
            } catch {}
          }
          await loadPosts()
        }

        setSocialSuccess(`Successfully imported ${importedComments.length} YouTube comments (${data.source})`)
        setSocialInput("")
      } else if (socialPlatform === "twitter") {
        const res = await fetch("/api/vault/import-twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: inputVal })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to import Twitter posts")

        const twitterUsername = data.username || inputVal.replace(/^@/, "")
        const importedTweets: LinkedInPost[] = (data.tweets || []).map((tObj: unknown, idx: number) => {
          const t = tObj as Record<string, unknown>
          return {
            id: `twitter-${Date.now()}-${idx}`,
            content: String(t.content || ""),
            url: String(t.url || ""),
            category: (t.category as PostCategory) || "other",
            author: `@${twitterUsername}`,
            topic: "Twitter Import",
            created_at: String(t.date || new Date().toISOString())
          }
        })

        if (importedTweets.length === 0) {
          throw new Error("No tweets found for this handle.")
        }

        const nextPosts = [...importedTweets, ...posts]
        setPosts(nextPosts)
        localStorage.setItem("vena_post_vault", JSON.stringify(nextPosts))

        if (!isLocalMode) {
          for (const post of importedTweets) {
            try {
              await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: post.content,
                  topic: post.topic,
                  url: post.url,
                  category: post.category,
                  author: post.author
                })
              })
            } catch {}
          }
          await loadPosts()
        }

        setSocialSuccess(`Successfully imported ${importedTweets.length} tweets (${data.source})`)
        setSocialInput("")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed."
      setSocialError(message)
    } finally {
      setIsImportingSocial(false)
    }
  }

  const triggerAutoFetch = async (urlVal: string) => {
    if (!urlVal) return
    setIsFetchingUrl(true)
    setPostError(null)
    try {
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlVal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch post details")
      if (data.content) {
        setNewContent(data.content)
        if (data.category) {
          setNewCategory(data.category)
        }
        if (data.author) {
          setNewAuthor(data.author)
        }
      } else {
        setPostError("Could not extract content from URL. Please paste it manually.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse LinkedIn URL. Please paste content manually."
      setPostError(message)
    } finally {
      setIsFetchingUrl(false)
    }
  }

  const handleFetchUrl = () => {
    triggerAutoFetch(newUrl.trim())
  }

  // Voice
  const [voiceDocs, setVoiceDocs] = useState<VoiceDoc[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newDocType, setNewDocType] = useState<VoiceDocType>("writing-style")
  const [docError, setDocError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPosts = async () => {
    try {
      const res = await fetch("/api/posts")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPosts(data.posts || [])
      setIsLocalMode(false)
    } catch {
      setIsLocalMode(true)
      const stored = localStorage.getItem("vena_post_vault")
      if (stored) {
        setPosts(JSON.parse(stored))
      } else {
        const defaults = getDefaultPosts()
        localStorage.setItem("vena_post_vault", JSON.stringify(defaults))
        setPosts(defaults)
      }
    }
  }

  const loadVoiceDocs = () => {
    const stored = localStorage.getItem("vena_voice_docs")
    if (stored) setVoiceDocs(JSON.parse(stored))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts()
      loadVoiceDocs()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault()
    const urlVal = newUrl.trim()
    let contentVal = newContent.trim()
    let hasImg = false

    if (!contentVal && urlVal) {
      setIsSaving(true)
      setPostError(null)
      try {
        const res = await fetch("/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlVal }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch post details")
        if (data.content) {
          contentVal = data.content
          hasImg = !!data.hasImage
          if (data.category) {
            setNewCategory(data.category)
          }
        } else {
          throw new Error("Could not extract content from URL. Please paste it manually.")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to parse LinkedIn URL. Please paste content manually."
        setPostError(message)
        setIsSaving(false)
        return
      }
    }

    if (!contentVal) {
      setPostError("Paste post content or provide a valid LinkedIn URL to fetch")
      return
    }

    setIsSaving(true); setPostError(null)

    let detectedCategory: PostCategory = "other"
    try {
      const classRes = await fetch("/api/vault/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentVal })
      })
      const classData = await classRes.json()
      if (classRes.ok && classData.category) {
        detectedCategory = classData.category as PostCategory
      }
    } catch (err) {
      console.warn("AI post classification failed, defaulting to other:", err)
    }

    const post: LinkedInPost = {
      id: `local-${Date.now()}`,
      content: contentVal,
      url: urlVal && isUrl(urlVal) ? urlVal : undefined,
      category: detectedCategory,
      topic: newTopic.trim() || undefined,
      author: newAuthor.trim() || undefined,
      hasImage: hasImg,
      created_at: new Date().toISOString(),
    }
    const updated = [post, ...posts]
    localStorage.setItem("vena_post_vault", JSON.stringify(updated))
    setPosts(updated)
    if (!isLocalMode) {
      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: post.content,
            topic: post.topic,
            url: post.url,
            category: post.category,
            author: post.author,
            hasImage: post.hasImage,
          }),
        })
        const data = await res.json()
        if (res.ok && data.post) {
          // Replace the local-ID post with the real DB post having the uuid
          setPosts(prev => prev.map(p => p.id === post.id ? data.post : p))
          const currentStored = localStorage.getItem("vena_post_vault")
          if (currentStored) {
            const parsed: LinkedInPost[] = JSON.parse(currentStored)
            const updatedStored = parsed.map(p => p.id === post.id ? data.post : p)
            localStorage.setItem("vena_post_vault", JSON.stringify(updatedStored))
          }
        }
      } catch (err) {
        console.error("Failed to save post to database:", err)
      }
    }
    setNewUrl(""); setNewContent(""); setNewTopic(""); setNewAuthor("")
    setIsSaving(false)
  }

  const handleDeletePost = (id: string) => {
    setIsDeletingId(id)
    const updated = posts.filter(p => p.id !== id)
    localStorage.setItem("vena_post_vault", JSON.stringify(updated))
    setPosts(updated)
    setIsDeletingId(null)
  }

  const handleUpdatePostCategory = async (id: string, category: PostCategory) => {
    const updated = posts.map(p => p.id === id ? { ...p, category } : p)
    localStorage.setItem("vena_post_vault", JSON.stringify(updated))
    setPosts(updated)

    if (!isLocalMode) {
      try {
        await fetch("/api/posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, category }),
        })
      } catch (err) {
        console.error("Failed to update post category on server:", err)
      }
    }
  }

  const processFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!["txt", "md", "csv"].includes(ext ?? "")) {
      setDocError("Only .txt, .md, and .csv files are supported."); return
    }
    setIsUploading(true); setDocError(null)
    try {
      const text = await file.text()
      const doc: VoiceDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        docType: newDocType,
        content: text,
        charCount: text.length,
        uploadedAt: new Date().toISOString(),
      }
      const updated = [doc, ...voiceDocs]
      localStorage.setItem("vena_voice_docs", JSON.stringify(updated))
      setVoiceDocs(updated)
    } catch { setDocError("Failed to read the file.") }
    finally { setIsUploading(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDeleteDoc = (id: string) => {
    const updated = voiceDocs.filter(d => d.id !== id)
    localStorage.setItem("vena_voice_docs", JSON.stringify(updated))
    setVoiceDocs(updated)
  }

  const filtered = posts.filter(p => {
    const matchesCat = filterCat === "all" || p.category === filterCat
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || 
      p.content.toLowerCase().includes(q) || 
      p.url?.toLowerCase().includes(q) || 
      p.topic?.toLowerCase().includes(q) ||
      p.author?.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: "var(--c-bg)" }}>

      {/* Page header */}
      <div
        className="shrink-0 px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
      >
        <div>
          <h1 className="text-[15px] font-semibold tracking-[-0.2px]" style={{ color: "var(--c-text)" }}>
            Style Vault
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
            {isLocalMode ? "⚠ Local storage" : "● Synced"} · {posts.length} posts · {voiceDocs.length} voice docs
          </p>
        </div>

        {/* Inner tab switcher */}
        <div
          className="flex gap-1 p-1 rounded-[8px]"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          {(["wall", "voice"] as VaultTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all cursor-pointer"
              style={{
                background: activeTab === tab ? "var(--c-surface)" : "transparent",
                color: activeTab === tab ? "var(--c-text)" : "var(--c-text-3)",
                boxShadow: activeTab === tab ? "rgba(0,0,0,0.1) 0px 1px 3px" : "none",
              }}
            >
              {tab === "wall" ? <LayoutGrid className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              {tab === "wall" ? "Post Wall" : "My Voice"}
              {tab === "voice" && voiceDocs.length > 0 && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded-[2px]"
                  style={{ background: "var(--c-accent)", color: "var(--c-accent-fg)" }}
                >
                  {voiceDocs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ═══ POST WALL ════════════════════════════════════ */}
        {activeTab === "wall" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Left: add form */}
            <div
              className="w-[300px] shrink-0 flex flex-col overflow-y-auto"
              style={{ borderRight: "1px solid var(--c-border)", background: "var(--c-surface)" }}
            >
              {/* Import Mode Switcher */}
              <div className="px-5 pt-5 pb-2 shrink-0">
                <div className="flex gap-1 p-0.5 rounded-[6px] bg-[var(--c-elevated)] border border-[var(--c-border)]">
                  <button
                    onClick={() => { setImportMode("manual"); setSocialError(null); setSocialSuccess(null) }}
                    className="flex-1 py-1 rounded-[4px] text-[11px] font-bold transition-all cursor-pointer text-center"
                    style={{
                      background: importMode === "manual" ? "var(--c-surface)" : "transparent",
                      color: importMode === "manual" ? "var(--c-text)" : "var(--c-text-3)",
                      boxShadow: importMode === "manual" ? "rgba(0,0,0,0.1) 0px 1px 3px" : "none",
                    }}
                  >
                    Manual Add
                  </button>
                  <button
                    onClick={() => { setImportMode("social"); setPostError(null) }}
                    className="flex-1 py-1 rounded-[4px] text-[11px] font-bold transition-all cursor-pointer text-center"
                    style={{
                      background: importMode === "social" ? "var(--c-surface)" : "transparent",
                      color: importMode === "social" ? "var(--c-text)" : "var(--c-text-3)",
                      boxShadow: importMode === "social" ? "rgba(0,0,0,0.1) 0px 1px 3px" : "none",
                    }}
                  >
                    Social Import
                  </button>
                </div>
              </div>

              {importMode === "manual" ? (
                <div className="p-5 pt-3 space-y-3">
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--c-text)" }}>Add a post</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      Paste content from LinkedIn posts you like.
                    </p>
                  </div>

                  <form onSubmit={handleAddPost} className="space-y-2.5">
                    {/* Content — primary */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-3)" }}>
                        Post content
                      </label>
                      <textarea
                        placeholder="Paste the full post text here (or paste a LinkedIn URL here to auto-fetch content)"
                        value={newContent}
                        onChange={(e) => {
                          const val = e.target.value.trim()
                          if (isUrl(val)) {
                            setNewUrl(val)
                            setNewContent("")
                            triggerAutoFetch(val)
                          } else {
                            setNewContent(e.target.value)
                          }
                        }}
                        rows={7}
                        className="w-full text-[13px] rounded-[6px] px-3 py-2.5 focus:outline-none transition-all resize-none"
                        style={{
                          background: "var(--c-elevated)",
                          border: "1px solid var(--c-border)",
                          color: "var(--c-text)",
                        }}
                      />
                    </div>

                    {/* URL — secondary */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-3)" }}>
                        LinkedIn URL
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-2.5 top-2.5 w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                          <input
                            type="text"
                            placeholder="https://linkedin.com/posts/…"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            className="w-full text-[12px] rounded-[6px] pl-8 pr-3 py-2 focus:outline-none transition-all"
                            style={{
                              background: "var(--c-elevated)",
                              border: "1px solid var(--c-border)",
                              color: "var(--c-text)",
                            }}
                          />
                        </div>
                        {newUrl.trim() && (
                          <button
                            type="button"
                            onClick={handleFetchUrl}
                            disabled={isFetchingUrl}
                            className="px-3 py-1.5 text-[11px] font-semibold rounded-[6px] border cursor-pointer transition-all shrink-0"
                            style={{
                              background: "var(--c-overlay)",
                              borderColor: "var(--c-border-2)",
                              color: "var(--c-text-2)",
                            }}
                          >
                            {isFetchingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Fetch"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tag / Topic (optional) */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-3)" }}>
                        Tag / Topic <span className="normal-case font-normal tracking-normal" style={{ color: "var(--c-text-4)" }}>(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sales, Career, Tutorial..."
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        className="w-full text-[12px] rounded-[6px] px-3 py-2 focus:outline-none"
                        style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
                      />
                    </div>

                    {postError && (
                      <div className="flex items-start gap-2 text-[11px] text-[#eb5757]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {postError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSaving || (!newContent.trim() && !newUrl.trim())}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[6px] text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "var(--c-accent)", color: "var(--c-accent-fg)" }}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {isSaving ? "Adding…" : "Add to Wall"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 pt-3 space-y-4">
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--c-text)" }}>Auto Import Feed</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      Automatically sync posts or comment threads into your Vault.
                    </p>
                  </div>

                  {/* Platforms */}
                  <div className="flex gap-1.5 shrink-0">
                    {(["linkedin", "youtube", "twitter"] as SocialPlatform[]).map((platform) => {
                      const labels: Record<SocialPlatform, string> = {
                        linkedin: "LinkedIn",
                        youtube: "YouTube",
                        twitter: "X / Twitter"
                      }
                      const Icons: Record<SocialPlatform, React.ElementType> = {
                        linkedin: Linkedin,
                        youtube: Video,
                        twitter: Twitter
                      }
                      const IconComponent = Icons[platform]
                      const isActive = socialPlatform === platform
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => { setSocialPlatform(platform); setSocialError(null); setSocialSuccess(null) }}
                          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[6px] border cursor-pointer transition-all"
                          style={{
                            background: isActive ? "var(--c-overlay)" : "var(--c-surface)",
                            borderColor: isActive ? "var(--c-accent)" : "var(--c-border)",
                            color: isActive ? "var(--c-text)" : "var(--c-text-3)"
                          }}
                        >
                          <IconComponent className="w-4 h-4 mb-1 shrink-0" />
                          <span className="text-[9px] font-semibold">{labels[platform]}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Social Form */}
                  <form onSubmit={handleSocialImport} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-3)" }}>
                        {socialPlatform === "linkedin" && "LinkedIn Profile URL"}
                        {socialPlatform === "youtube" && "YouTube Video URL"}
                        {socialPlatform === "twitter" && "Twitter (X) Handle"}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          socialPlatform === "linkedin" ? "https://linkedin.com/in/username" :
                          socialPlatform === "youtube" ? "https://youtube.com/watch?v=..." :
                          "@username"
                        }
                        value={socialInput}
                        onChange={(e) => setSocialInput(e.target.value)}
                        className="w-full text-[12.5px] rounded-[6px] px-3 py-2 focus:outline-none"
                        style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
                      />
                    </div>

                    {socialPlatform === "linkedin" && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-3)" }}>
                          Scrape Limit <span className="normal-case tracking-normal text-[10px]" style={{ color: "var(--c-text-4)" }}>(1 to 10 posts)</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={socialLimit}
                          onChange={(e) => setSocialLimit(Number(e.target.value))}
                          className="w-full text-[12.5px] rounded-[6px] px-3 py-1.5 focus:outline-none"
                          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
                        />
                      </div>
                    )}

                    {socialError && (
                      <div className="flex items-start gap-2 p-2.5 bg-[#eb5757]/10 border border-[#eb5757]/15 rounded-[6px] text-[11px] text-[#eb5757]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{socialError}</span>
                      </div>
                    )}

                    {socialSuccess && (
                      <div className="flex items-start gap-2 p-2.5 bg-[#27a644]/10 border border-[#27a644]/15 rounded-[6px] text-[11px] text-[#27a644]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{socialSuccess}</span>
                      </div>
                    )}

                    {/* Cooldown Lock Visual Warning */}
                    {socialPlatform === "linkedin" && socialInput.trim() && checkCooldown(socialInput.trim()).locked && (
                      <div className="p-2.5 rounded-[6px] border text-[11.5px] leading-relaxed" style={{ background: "var(--c-overlay)", borderColor: "var(--c-border)" }}>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">⚡ Apify Budget Lock:</span> Sync is locked until 7 days since last run to save credits.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isImportingSocial || !socialInput.trim() || (socialPlatform === "linkedin" && checkCooldown(socialInput.trim()).locked)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[6px] text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "var(--c-accent)", color: "var(--c-accent-fg)" }}
                    >
                      {isImportingSocial ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Fetching Feed…</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Import Feed</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right: grid */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Filter bar */}
              <div
                className="shrink-0 flex items-center gap-3 px-5 py-2.5"
                style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
              >
                <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--c-text-3)" }} />
                <div className="flex items-center gap-1 flex-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCat(cat.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-all cursor-pointer"
                      style={{
                        background: filterCat === cat.id ? "var(--c-overlay)" : "transparent",
                        color: filterCat === cat.id ? "var(--c-text)" : "var(--c-text-3)",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.dot }} />
                      {cat.label}
                      {cat.id !== "all" && (
                        <span style={{ color: "var(--c-text-4)", fontSize: 10 }}>
                          {posts.filter(p => p.category === cat.id).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative w-28 shrink-0">
                  <Search className="absolute left-2 top-1.5 w-3 h-3" style={{ color: "var(--c-text-3)" }} />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-[11px] rounded-[6px] pl-6 pr-2 py-1.5 focus:outline-none"
                    style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {filtered.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-full text-center py-16 rounded-[12px] border border-dashed"
                    style={{ borderColor: "var(--c-border)" }}
                  >
                    <LayoutGrid className="w-8 h-8 mb-3" style={{ color: "var(--c-text-4)" }} />
                    <p className="text-[13px] font-medium" style={{ color: "var(--c-text-3)" }}>No posts yet</p>
                    <p className="text-[11px] mt-1 max-w-[200px]" style={{ color: "var(--c-text-3)" }}>
                      Paste post content on the left to start building your wall.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {filtered.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onDelete={() => handleDeletePost(post.id)}
                        isDeleting={isDeletingId === post.id}
                        onWriteLikeThis={() => onWriteLikeThis?.(post)}
                        onUpdateCategory={(newCat) => handleUpdatePostCategory(post.id, newCat)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ MY VOICE ══════════════════════════════════════ */}
        {activeTab === "voice" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: upload */}
            <div
              className="w-[320px] shrink-0 overflow-y-auto p-5 space-y-4"
              style={{ borderRight: "1px solid var(--c-border)", background: "var(--c-surface)" }}
            >
              <div>
                <p className="text-[12px] font-semibold" style={{ color: "var(--c-text)" }}>Upload a document</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--c-text-3)" }}>
                  These docs teach Vena <em>who you are</em> — your writing style, achievements, background — so it never writes a generic AI post.
                </p>
              </div>

              {/* Type picker */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>Doc type</p>
                {VOICE_TYPES.map((vt) => {
                  const Icon = vt.icon
                  const colors = VOICE_COLORS[vt.id]
                  const isActive = newDocType === vt.id
                  return (
                    <button
                      key={vt.id}
                      onClick={() => setNewDocType(vt.id)}
                      className="flex items-start gap-2.5 w-full p-3 rounded-[8px] border text-left cursor-pointer transition-all"
                      style={{
                        background: isActive ? colors.bg : "var(--c-elevated)",
                        borderColor: isActive ? colors.border : "var(--c-border)",
                      }}
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: isActive ? colors.text : "var(--c-text-3)" }} />
                      <div>
                        <p className="text-[12px] font-semibold" style={{ color: isActive ? colors.text : "var(--c-text)" }}>{vt.label}</p>
                        <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--c-text-3)" }}>{vt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2.5 py-8 rounded-[10px] border-2 border-dashed cursor-pointer transition-all"
                style={{
                  borderColor: isDragging ? "var(--c-accent)" : "var(--c-border)",
                  background: isDragging ? "rgba(228,242,34,0.04)" : "var(--c-elevated)",
                }}
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
                ) : (
                  <Upload className="w-6 h-6" style={{ color: isDragging ? "var(--c-accent)" : "var(--c-text-3)" }} />
                )}
                <div className="text-center">
                  <p className="text-[13px] font-medium" style={{ color: "var(--c-text-2)" }}>
                    {isUploading ? "Reading…" : isDragging ? "Drop it" : "Drag & drop or click"}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--c-text-3)" }}>.txt or .md files</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = "" }}
                className="hidden"
              />
              {docError && (
                <div className="flex items-center gap-2 text-[11px] text-[#eb5757]">
                  <AlertCircle className="w-3.5 h-3.5" /> {docError}
                </div>
              )}
            </div>

            {/* Right: doc list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {voiceDocs.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full text-center py-16 border border-dashed rounded-[12px]"
                  style={{ borderColor: "var(--c-border)" }}
                >
                  <BookOpen className="w-8 h-8 mb-3" style={{ color: "var(--c-text-4)" }} />
                  <p className="text-[13px] font-medium" style={{ color: "var(--c-text-3)" }}>No voice docs yet</p>
                  <p className="text-[11px] mt-1 max-w-[240px]" style={{ color: "var(--c-text-3)" }}>
                    Upload your writing style guide, bio, or achievements list. Vena reads these every time it writes.
                  </p>
                </div>
              ) : (
                voiceDocs.map((doc) => (
                  <VoiceDocCard key={doc.id} doc={doc} onDelete={() => handleDeleteDoc(doc.id)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
