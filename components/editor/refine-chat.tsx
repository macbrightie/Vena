"use client"

import React, { useRef, useEffect } from "react"
import { Send, Loader2, RotateCcw, Sparkles, User } from "lucide-react"
import { VoiceDictation } from "@/components/dictation/voice-dictation"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  snapshot?: string
  timestamp: Date
  variations?: Array<{ label: string; content: string }>
}

interface RefineChatProps {
  messages: ChatMessage[]
  onSend: (instruction: string) => void
  onRestore: (snapshot: string, label?: string) => void
  onHoverVersion?: (content: string | null) => void
  isSending: boolean
  draft: string
}

export function RefineChat({ messages, onSend, onRestore, onHoverVersion, isSending, draft }: RefineChatProps) {
  const [input, setInput] = React.useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ borderTop: "1px solid var(--c-border)" }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 select-none">
            <div
              className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "var(--c-text-3)" }}>
              Ask for changes below
            </p>
            <p className="text-[12px] mt-1 max-w-[220px]" style={{ color: "var(--c-text-4)" }}>
              e.g. &quot;Make it shorter&quot;, &quot;Change the hook&quot;, &quot;Add a data point&quot;
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="animate-fade-in">
              {msg.role === "user" ? (
                <div className="flex items-start gap-2.5 justify-end">
                  <div
                    className="max-w-[75%] px-3.5 py-2.5 rounded-[10px] rounded-tr-[3px] text-[13px] leading-relaxed"
                    style={{
                      background: "var(--c-overlay)",
                      border: "1px solid var(--c-border-2)",
                      color: "var(--c-text)",
                    }}
                  >
                    {msg.text}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "var(--c-overlay)", border: "1px solid var(--c-border-2)" }}
                  >
                    <User className="w-3 h-3" style={{ color: "var(--c-text-2)" }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: "color-mix(in srgb, var(--c-accent) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--c-accent) 20%, transparent)",
                    }}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: "var(--c-accent)" }} />
                  </div>
                  <div
                    className="flex-1 px-3.5 py-2.5 rounded-[10px] rounded-tl-[3px]"
                    style={{
                      background: "var(--c-elevated)",
                      border: "1px solid var(--c-border)",
                      boxShadow: "rgba(0,0,0,0.08) 0px 1px 3px",
                    }}
                    onMouseEnter={() => msg.snapshot && onHoverVersion?.(msg.snapshot)}
                    onMouseLeave={() => onHoverVersion?.(null)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#27a644] font-semibold mb-0.5 flex items-center gap-1">
                          <span>✓</span> Done
                        </p>
                        <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                          {msg.text}
                        </p>
                      </div>
                      {msg.snapshot && (
                        <button
                          onClick={() => onRestore(msg.snapshot!)}
                          title="Restore this version"
                          className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] font-medium transition-all cursor-pointer shrink-0 mt-0.5"
                          style={{ color: "var(--c-text-3)" }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--c-overlay)"
                            e.currentTarget.style.color = "var(--c-text)"
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent"
                            e.currentTarget.style.color = "var(--c-text-3)"
                          }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      )}
                    </div>

                    {/* variations options container */}
                    {msg.variations && msg.variations.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-dashed space-y-2.5" style={{ borderColor: "var(--c-border)" }}>
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-3)" }}>
                          Tap to select a Playbook Option:
                        </p>
                        <div className="flex flex-col gap-2">
                          {msg.variations.map((v, idx) => {
                            const isApplied = draft.trim() === v.content.trim()
                            return (
                              <button
                                key={idx}
                                onClick={() => onRestore(v.content, v.label)}
                                onMouseEnter={() => onHoverVersion?.(v.content)}
                                onMouseLeave={() => onHoverVersion?.(null)}
                                className="flex flex-col text-left p-2.5 rounded-[6px] border transition-all cursor-pointer text-[12px] group/item"
                                style={{
                                  background: isApplied ? "var(--c-overlay)" : "var(--c-bg)",
                                  borderColor: isApplied ? "var(--c-accent)" : "var(--c-border)",
                                }}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-semibold" style={{ color: isApplied ? "var(--c-accent)" : "var(--c-text)" }}>
                                    {v.label}
                                  </span>
                                  {isApplied ? (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(228, 242, 34, 0.1)", color: "var(--c-accent)" }}>
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-medium opacity-0 group-hover/item:opacity-100 transition-opacity" style={{ color: "var(--c-text-3)" }}>
                                      Apply Option
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--c-text-3)" }}>
                                  {v.content.slice(0, 110)}{v.content.length > 110 ? "…" : ""}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] mt-2.5" style={{ color: "var(--c-text-4)" }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "color-mix(in srgb, var(--c-accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--c-accent) 20%, transparent)",
              }}
            >
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--c-accent)" }} />
            </div>
            <div
              className="px-3.5 py-2.5 rounded-[10px] rounded-tl-[3px]"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
            >
              <div className="flex gap-1 items-center py-0.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "var(--c-text-3)", animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface)" }}
      >
        <div
          className="flex items-end gap-2 rounded-[8px] border px-3 py-2 transition-colors"
          style={{
            background: "var(--c-elevated)",
            borderColor: "var(--c-border)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"
            }}
            onKeyDown={handleKeyDown}
            placeholder='Request a change… e.g. "Make it punchier" or "Add a statistic"'
            disabled={isSending}
            rows={1}
            className="flex-1 text-[13px] bg-transparent focus:outline-none resize-none leading-relaxed disabled:opacity-50"
            style={{
              minHeight: "22px",
              maxHeight: "100px",
              color: "var(--c-text)",
            }}
          />
          <VoiceDictation
            onTranscript={(text) => setInput(prev => prev ? `${prev} ${text}` : text)}
            placeholder="Listening..."
            className="mb-0.5 shrink-0"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="flex items-center justify-center w-7 h-7 rounded-[6px] disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 mb-0.5"
            style={{ background: "var(--c-accent)" }}
          >
            <Send className="w-3.5 h-3.5" style={{ color: "var(--c-accent-fg)" }} />
          </button>
        </div>
        <p className="text-[10px] mt-1.5 px-1" style={{ color: "var(--c-text-4)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
