"use client"

import React, { useState, useEffect, useRef } from "react"
import { Mic, AlertCircle } from "lucide-react"

interface VoiceDictationProps {
  onTranscript: (text: string) => void
  placeholder?: string
  className?: string
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionResult {
  transcript: string
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResult
  }
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

export function VoiceDictation({ onTranscript, placeholder = "Listening...", className = "" }: VoiceDictationProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  useEffect(() => {
    const globalWindow = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }) : null
    const SpeechRecognition = globalWindow
      ? (globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition)
      : null

    if (SpeechRecognition) {
      const timer = setTimeout(() => {
        setIsSupported(true)
      }, 0)

      const rec = new (SpeechRecognition as { new(): {
        continuous: boolean
        interimResults: boolean
        lang: string
        onstart: () => void
        onend: () => void
        onerror: (event: SpeechRecognitionErrorEvent) => void
        onresult: (event: SpeechRecognitionEvent) => void
      } })()

      rec.continuous = false
      rec.interimResults = false
      rec.lang = "en-US"

      rec.onstart = () => {
        setIsRecording(true)
        setError(null)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error)
        setError(event.error)
        setIsRecording(false)
      }

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          onTranscript(transcript)
        }
      }

      recognitionRef.current = rec as unknown as { start: () => void; stop: () => void }

      return () => {
        clearTimeout(timer)
      }
    }
  }, [onTranscript])

  const toggleRecording = () => {
    if (!isSupported || !recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error("Failed to start speech recognition:", err)
      }
    }
  }

  if (!isSupported) return null

  return (
    <div className={`relative flex items-center shrink-0 ${className}`}>
      <button
        type="button"
        onClick={toggleRecording}
        title={isRecording ? "Stop listening" : "Dictate text"}
        className={`p-1.5 rounded-[6px] transition-all cursor-pointer border flex items-center justify-center`}
        style={{
          background: isRecording ? "#eb5757" : "transparent",
          borderColor: isRecording ? "#eb5757" : "var(--c-border)",
          color: isRecording ? "#ffffff" : "var(--c-text-3)",
          boxShadow: isRecording ? "0 0 8px rgba(235,87,87,0.4)" : "none"
        }}
        onMouseEnter={(e) => {
          if (!isRecording) e.currentTarget.style.background = "var(--c-overlay)"
        }}
        onMouseLeave={(e) => {
          if (!isRecording) e.currentTarget.style.background = "transparent"
        }}
      >
        {isRecording ? (
          <Mic className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Tiny listening indicator tooltip overlay */}
      {isRecording && (
        <span
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-semibold text-white whitespace-nowrap animate-fade-in shadow"
          style={{ background: "#eb5757" }}
        >
          {placeholder}
        </span>
      )}

      {error && error !== "no-speech" && (
        <span
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-semibold bg-red-600 text-white whitespace-nowrap animate-fade-in flex items-center gap-1 shadow"
          title={error}
        >
          <AlertCircle className="w-2.5 h-2.5" />
          Mic Error
        </span>
      )}
    </div>
  )
}
