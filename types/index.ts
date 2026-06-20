export type PostCategory = "story" | "education" | "news" | "other"

export type VoiceDocType = "writing-style" | "achievements" | "background" | "other"

export interface LinkedInPost {
  id: string
  content: string
  topic?: string
  category?: PostCategory
  author?: string
  url?: string
  hasImage?: boolean
  has_image?: boolean
  created_at: string
}

export interface VoiceDoc {
  id: string
  name: string
  docType: VoiceDocType
  content: string
  charCount: number
  uploadedAt: string
}

export interface ResearchResult {
  title: string
  url: string
  content: string
  score?: number
}

export interface ResearchRequest {
  instruction: string
  depth?: "basic" | "deep"
}

export interface GenerateRequest {
  topic: string
  research: ResearchResult[]
  additionalContext?: string
  voiceContext?: string
  referencePost?: string   // "write a post like THIS one but about my topic"
  vaultPosts?: string[]    // list of post contents from vault
}

export interface GeneratedPost {
  content: string
  characterCount: number
}

export interface GenerationRun {
  id: string
  topic: string
  notes?: string
  selectedAngle: {
    title: string
    summary: string
    angle: string
  } | null
  angles: {
    title: string
    summary: string
    angle: string
  }[]
  versions: {
    content: string
    label: string
    createdAt: string
  }[]
  activeVersionIdx: number
  chatMessages: {
    id: string
    role: "user" | "assistant"
    text: string
    snapshot?: string
    timestamp: string
  }[]
  created_at: string
}

export interface PlannerItem {
  id: string
  category: "marketing" | "ai-business" | "development" | "productivity"
  bucket: "growth" | "authority" | "conversion" | "personal"
  framework: "pass" | "slay"
  day?: string
  angle: string
  headline: string
  searchQuery: string
  outline: {
    // PASS fields
    problem?: string
    agitate?: string
    solution?: string
    // SLAY fields
    story?: string
    lesson?: string
    actionable?: string
    // Closing / CTA fields
    rehook?: string // loops back to the hook (used in PASS)
    you?: string // "what about you?" (used in SLAY)
  }
  locked?: boolean
}

export interface PlannerState {
  id?: string
  focus_context: string
  schedule: PlannerItem[]
  updated_at?: string
}
