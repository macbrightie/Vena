"use client"

import React, { useState, useEffect, useRef } from "react"
import { Mic, AlertCircle, Loader2 } from "lucide-react"

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
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingWhisperFallback, setIsUsingWhisperFallback] = useState(false)
  
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const globalWindow = typeof window !== "undefined" ? window : null
    if (!globalWindow) return

    const SpeechRecognition = (globalWindow as any).SpeechRecognition || (globalWindow as any).webkitSpeechRecognition
    const hasMediaRecorder = !!(globalWindow.MediaRecorder && navigator.mediaDevices?.getUserMedia)

    const hasSpeechRecognition = !!SpeechRecognition
    
    if (hasSpeechRecognition || hasMediaRecorder) {
      setIsSupported(true)
      
      if (!hasSpeechRecognition) {
        setIsUsingWhisperFallback(true)
      } else {
        // Initialize SpeechRecognition
        const rec = new SpeechRecognition()
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
          
          // Switch to Whisper fallback if we get network or block errors
          if (event.error === "network" || event.error === "not-allowed" || event.error === "service-not-allowed") {
            console.log("Speech recognition failed, switching to server-side Whisper fallback.")
            setIsUsingWhisperFallback(true)
          }
        }

        rec.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          if (transcript) {
            onTranscript(transcript)
          }
        }

        recognitionRef.current = rec
      }
    }
  }, [onTranscript])

  const startMediaRecorder = async () => {
    try {
      setError(null)
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        if (audioBlob.size > 100) {
          await transcribeAudio(audioBlob)
        } else {
          setIsRecording(false)
        }
        
        // Clean up stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err)
      setError("permission-denied")
      setIsRecording(false)
    }
  }

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", blob, "audio.webm")
      
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `Server error: ${res.status}`)
      }

      const data = await res.json()
      if (data.text?.trim()) {
        onTranscript(data.text)
      } else {
        setError("no-speech")
      }
    } catch (err: unknown) {
      console.error("Transcription failed:", err)
      setError("transcription-failed")
    } finally {
      setIsTranscribing(false)
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (!isSupported) return

    if (isUsingWhisperFallback) {
      if (isRecording) {
        stopMediaRecorder()
      } else {
        startMediaRecorder()
      }
    } else {
      if (!recognitionRef.current) return
      if (isRecording) {
        recognitionRef.current.stop()
      } else {
        try {
          recognitionRef.current.start()
        } catch (err) {
          console.error("Failed to start speech recognition:", err)
          // Fall back immediately if we cannot start SpeechRecognition
          setIsUsingWhisperFallback(true)
          startMediaRecorder()
        }
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  if (!isSupported) return null

  // Define status messages / colors
  let statusText = placeholder
  if (isTranscribing) {
    statusText = "Transcribing..."
  } else if (isRecording && isUsingWhisperFallback) {
    statusText = "Recording..."
  }

  let errorDisplay = ""
  if (error) {
    if (error === "network") {
      errorDisplay = "Network error. Switched to Whisper fallback."
    } else if (error === "permission-denied") {
      errorDisplay = "Microphone permission denied."
    } else if (error === "transcription-failed") {
      errorDisplay = "Transcription failed. Try again."
    } else if (error === "no-speech") {
      errorDisplay = "No speech detected."
    } else {
      errorDisplay = `Mic Error: ${error}`
    }
  }

  return (
    <div className={`relative flex items-center shrink-0 ${className}`}>
      <button
        type="button"
        disabled={isTranscribing}
        onClick={toggleRecording}
        title={
          isTranscribing
            ? "Transcribing..."
            : isRecording
            ? "Stop listening"
            : isUsingWhisperFallback
            ? "Dictate text (Whisper Cloud)"
            : "Dictate text"
        }
        className={`p-1.5 rounded-[6px] transition-all cursor-pointer border flex items-center justify-center`}
        style={{
          background: isRecording ? "#eb5757" : "transparent",
          borderColor: isRecording ? "#eb5757" : "var(--c-border)",
          color: isRecording ? "#ffffff" : "var(--c-text-3)",
          boxShadow: isRecording ? "0 0 8px rgba(235,87,87,0.4)" : "none",
          opacity: isTranscribing ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isRecording) e.currentTarget.style.background = "var(--c-overlay)"
        }}
        onMouseLeave={(e) => {
          if (!isRecording) e.currentTarget.style.background = "transparent"
        }}
      >
        {isTranscribing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isRecording ? (
          <Mic className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Tiny listening/transcribing indicator tooltip overlay */}
      {(isRecording || isTranscribing) && (
        <span
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-semibold text-white whitespace-nowrap animate-fade-in shadow flex items-center gap-1.5"
          style={{ background: isTranscribing ? "var(--c-brand)" : "#eb5757" }}
        >
          {isTranscribing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
          {statusText}
        </span>
      )}

      {error && error !== "no-speech" && (
        <span
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-semibold bg-red-600 text-white whitespace-nowrap animate-fade-in flex items-center gap-1 shadow"
          title={errorDisplay}
        >
          <AlertCircle className="w-2.5 h-2.5" />
          {error === "network" ? "Network Error" : "Mic Error"}
        </span>
      )}
    </div>
  )
}
