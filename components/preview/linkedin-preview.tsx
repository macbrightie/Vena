"use client"

import React, { useState } from "react"
import {
  ThumbsUp, MessageSquare, Repeat2, Send as SendIcon,
  MoreHorizontal, Globe, Monitor, Smartphone,
  Wifi, Battery, Signal,
} from "lucide-react"

interface LinkedInPreviewProps {
  content: string
  viewMode?: "desktop" | "mobile"
}

// iPhone 14 logical dimensions
const PHONE_W = 375
const PHONE_H = 812
const BEZEL = 14
// Scale factor so it fits inside a ~360px panel without horizontal scroll
const SCALE = 0.84

export function LinkedInPreview({ content, viewMode = "desktop" }: LinkedInPreviewProps) {
  const [expanded, setExpanded] = useState(false)

  const TRUNCATE_CHARS = 220
  const TRUNCATE_LINES = 3
  const lines = content.split("\n")
  const needsTruncation =
    !expanded && (content.length > TRUNCATE_CHARS || lines.length > TRUNCATE_LINES)

  const displayText = needsTruncation
    ? (() => {
        const byLines = lines.slice(0, TRUNCATE_LINES).join("\n")
        return byLines.length > TRUNCATE_CHARS ? byLines.slice(0, TRUNCATE_CHARS) : byLines
      })()
    : content

  const isMobile = viewMode === "mobile"

  /** The LinkedIn post card — reused in both views */
  const PostCard = (
    <div
      className="bg-white text-zinc-900"
      style={{
        fontSize: isMobile ? 13 : 14,
        borderRadius: isMobile ? 0 : 12,
        border: isMobile ? "none" : "1px solid var(--c-border)",
        boxShadow: isMobile ? "none" : "rgba(0,0,0,0.4) 0px 2px 4px",
        overflow: "hidden",
      }}
    >
      {/* Profile */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: isMobile ? "10px 12px 6px" : "12px" }}>
        <div style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: "50%", background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#555", flexShrink: 0 }}>
          YO
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#000", cursor: "pointer" }}>You (Owner)</span>
            <span style={{ fontSize: 11, color: "#999" }}>· 1st</span>
          </div>
          <p style={{ fontSize: 11, color: "#666", lineHeight: 1.3, marginTop: 1 }}>Founder @ Vena · AI Ghostwriting</p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 10, color: "#999" }}>
            <span>1h</span><span>·</span><Globe style={{ width: 10, height: 10 }} />
          </div>
        </div>
        <button style={{ padding: 4, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", color: "#999" }}>
          <MoreHorizontal style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? "0 12px 8px" : "0 12px 10px", color: "#333", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {content ? (
          <>
            {displayText}
            {needsTruncation && (
              <button onClick={() => setExpanded(true)} style={{ color: "#666", fontWeight: 600, marginLeft: 2, background: "none", border: "none", cursor: "pointer" }}>
                …see more
              </button>
            )}
          </>
        ) : (
          <span style={{ color: "#bbb", fontStyle: "italic", fontSize: 13 }}>Your generated post will appear here…</span>
        )}
      </div>

      {/* Reactions */}
      {content && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", fontSize: 11, color: "#999", borderBottom: "1px solid #f0f0f0" }}>
          <span>👍 ❤️ <span style={{ marginLeft: 2 }}>42</span></span>
          <span>5 comments · 2 reposts</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex" }}>
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageSquare, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: SendIcon, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: isMobile ? "7px 0" : "9px 0",
              background: "transparent", border: "none", cursor: "pointer", color: "#666",
            }}
          >
            <Icon style={{ width: isMobile ? 15 : 17, height: isMobile ? 15 : 17 }} strokeWidth={1.5} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // Total rendered height of the phone (including bezel)
  const phoneFrameHeight = PHONE_H + BEZEL * 2 + 36

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

      {/* Desktop */}
      {!isMobile && <div style={{ width: "100%" }}>{PostCard}</div>}

      {/* Mobile — 375×812, scaled to fit */}
      {isMobile && (
        <div style={{ display: "flex", justifyContent: "center", width: "100%", overflow: "hidden" }}>
          {/* Scale wrapper — collapses the layout height to match scaled size */}
          <div
            style={{
              transform: `scale(${SCALE})`,
              transformOrigin: "top center",
              // Compensate for the space the element "thinks" it takes vs what it visually takes
              marginBottom: -(phoneFrameHeight * (1 - SCALE)),
            }}
          >
            {/* Phone shell */}
            <div
              style={{
                width: PHONE_W + BEZEL * 2,
                height: phoneFrameHeight,
                background: "#1a1a1c",
                borderRadius: 44,
                padding: BEZEL,
                boxShadow: [
                  "0 0 0 1px #3a3a3c",
                  "0 24px 64px rgba(0,0,0,0.7)",
                  "inset 0 0 0 1px rgba(255,255,255,0.05)",
                ].join(", "),
                position: "relative",
                flexShrink: 0,
              }}
            >
              {/* Physical side buttons */}
              <div style={{ position: "absolute", left: -3, top: 100, width: 3, height: 32, background: "#2c2c2e", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", left: -3, top: 144, width: 3, height: 56, background: "#2c2c2e", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", left: -3, top: 210, width: 3, height: 56, background: "#2c2c2e", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#2c2c2e", borderRadius: "0 2px 2px 0" }} />

              {/* Screen */}
              <div
                style={{
                  width: PHONE_W,
                  height: PHONE_H + 36,
                  background: "#f2f2f7",
                  borderRadius: 32,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Status bar */}
                <div style={{ background: "#f2f2f7", padding: "14px 22px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 600, flexShrink: 0, position: "relative" }}>
                  <span style={{ color: "#000" }}>9:41</span>
                  {/* Dynamic island */}
                  <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 10, width: 120, height: 34, background: "#1a1a1c", borderRadius: 20 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#000" }}>
                    <Signal style={{ width: 14, height: 14 }} />
                    <Wifi style={{ width: 14, height: 14 }} />
                    <Battery style={{ width: 20, height: 14 }} />
                  </div>
                </div>

                {/* LinkedIn top nav */}
                <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "8px 16px 10px", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 22, color: "#0a66c2" }}>in</span>
                    <div style={{ display: "flex", gap: 22 }}>
                      {["Home", "Network", "Jobs", "Chat"].map((item) => (
                        <span key={item} style={{ fontSize: 9, color: item === "Home" ? "#0a66c2" : "#888", fontWeight: item === "Home" ? 600 : 400 }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feed scroll area */}
                <div style={{ flex: 1, overflowY: "auto", background: "#f2f2f7" }}>
                  {/* Share box */}
                  <div style={{ background: "#fff", margin: "8px 0 0", padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#777", flexShrink: 0 }}>YO</div>
                      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 20, padding: "7px 14px", fontSize: 12, color: "#aaa" }}>Start a post</div>
                    </div>
                  </div>

                  {/* ── THE ACTUAL POST ── */}
                  <div style={{ background: "#fff", marginTop: 8 }}>
                    {PostCard}
                  </div>

                  {/* Placeholder suggested post */}
                  <div style={{ background: "#fff", marginTop: 8, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "#aaa", marginBottom: 8 }}>Suggested for you</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e5e5", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 9, background: "#ebebeb", borderRadius: 3, width: "55%", marginBottom: 6 }} />
                        <div style={{ height: 8, background: "#f5f5f5", borderRadius: 3, width: "38%" }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 10, height: 110, background: "#f0f0f0", borderRadius: 8 }} />
                  </div>
                </div>

                {/* Bottom tab bar */}
                <div style={{ background: "#fff", borderTop: "1px solid #e5e5e5", padding: "8px 0 22px", display: "flex", justifyContent: "space-around", alignItems: "center", flexShrink: 0 }}>
                  {["Home", "Network", "Post", "Notif.", "Jobs"].map((item) => (
                    <div key={item} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: item === "Post" ? "50%" : 4, background: item === "Post" ? "#0a66c2" : item === "Home" ? "#0a66c2" : "#e5e5e5" }} />
                      <span style={{ fontSize: 9, color: (item === "Home" || item === "Post") ? "#0a66c2" : "#999" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
