"use client"

import React from "react"
import { ArrowRight, Zap, BookOpen, BarChart2, Heart, AlertTriangle, Lightbulb, HelpCircle } from "lucide-react"

export interface Angle {
  title: string
  summary: string
  angle: string
}

interface AnglePickerProps {
  topic: string
  angles: Angle[]
  onPick: (angle: Angle) => void
  onBack: () => void
}

const ANGLE_ICONS: Record<string, React.ElementType> = {
  contrarian: AlertTriangle,
  "personal-story": Heart,
  "data-driven": BarChart2,
  framework: BookOpen,
  confession: Heart,
  prediction: Zap,
  "how-to": Lightbulb,
}

const ANGLE_COLORS: Record<string, { dot: string; bg: string; border: string; label: string }> = {
  contrarian:     { dot: "#eb5757", bg: "rgba(235,87,87,0.06)",  border: "rgba(235,87,87,0.15)",  label: "#eb5757" },
  "personal-story": { dot: "#5e6ad2", bg: "rgba(94,106,210,0.06)", border: "rgba(94,106,210,0.15)", label: "#5e6ad2" },
  "data-driven":  { dot: "#02b8cc", bg: "rgba(2,184,204,0.06)", border: "rgba(2,184,204,0.15)",  label: "#02b8cc" },
  framework:      { dot: "#27a644", bg: "rgba(39,166,68,0.06)", border: "rgba(39,166,68,0.15)",  label: "#27a644" },
  confession:     { dot: "#5e6ad2", bg: "rgba(94,106,210,0.06)", border: "rgba(94,106,210,0.15)", label: "#5e6ad2" },
  prediction:     { dot: "#e4f222", bg: "rgba(228,242,34,0.06)", border: "rgba(228,242,34,0.2)",  label: "#c8d41e" },
  "how-to":       { dot: "#27a644", bg: "rgba(39,166,68,0.06)", border: "rgba(39,166,68,0.15)",  label: "#27a644" },
}

const DEFAULT_COLOR = { dot: "#8a8f98", bg: "rgba(138,143,152,0.06)", border: "rgba(138,143,152,0.15)", label: "#8a8f98" }

export function AnglePicker({ topic, angles, onPick, onBack }: AnglePickerProps) {
  return (
    <div className="flex flex-col gap-5 max-w-2xl animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] transition-colors cursor-pointer mb-4"
          style={{ color: "var(--c-text-3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-text-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-text-3)")}
        >
          ← Back
        </button>
        <h2 className="text-[15px] font-semibold tracking-[-0.2px]" style={{ color: "var(--c-text)" }}>
          Pick an angle
        </h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--c-text-3)" }}>
          3 ways to approach <span className="font-medium" style={{ color: "var(--c-text-2)" }}>&quot;{topic}&quot;</span>
        </p>
      </div>

      {/* Angle cards */}
      <div className="space-y-3">
        {angles.map((angle, idx) => {
          const colors = ANGLE_COLORS[angle.angle] ?? DEFAULT_COLOR
          const Icon = ANGLE_ICONS[angle.angle] ?? HelpCircle

          return (
            <div
              key={idx}
              className="group relative p-5 rounded-[12px] border transition-all cursor-pointer"
              style={{
                background: "var(--c-elevated)",
                borderColor: "var(--c-border)",
                boxShadow: "rgba(0,0,0,0.1) 0px 2px 4px 0px",
              }}
              onClick={() => onPick(angle)}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                ;(e.currentTarget as HTMLElement).style.background = colors.bg
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = "var(--c-border)"
                ;(e.currentTarget as HTMLElement).style.background = "var(--c-elevated)"
              }}
            >
              <div className="flex items-start gap-4">
                {/* Number + icon */}
                <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                  <div
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: colors.label }} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: colors.label }}
                    >
                      {angle.angle.replace("-", " ")}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--c-text-4)" }}>·</span>
                    <span className="text-[11px]" style={{ color: "var(--c-text-3)" }}>Angle {idx + 1}</span>
                  </div>

                  <p className="text-[14px] font-semibold leading-snug mb-2 tracking-[-0.1px]" style={{ color: "var(--c-text)" }}>
                    {angle.title}
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                    {angle.summary}
                  </p>
                </div>

                {/* Arrow */}
                <div className="shrink-0 pt-1">
                  <ArrowRight
                    className="w-4 h-4 transition-colors"
                    style={{ color: "var(--c-text-4)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-text-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-text-4)")}
                  />
                </div>
              </div>

              {/* Write button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); onPick(angle) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer"
                  style={{
                    background: "var(--c-accent)",
                    color: "var(--c-accent-fg)",
                  }}
                >
                  Write this post
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
