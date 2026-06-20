# Vena — LinkedIn Post Writing Tool
## Project Context Document

---

## What This Product Is

Vena is an AI-powered LinkedIn post writing tool. It is designed to help a single user (the owner) write LinkedIn posts that sound authentically like them — not generic AI content.

The core idea: instead of prompting an AI from scratch every time, the system learns the user's voice from their past high-performing posts, does web research on demand, and produces a ready-to-publish post through a clean editor with a LinkedIn-style desktop preview.

---

## How It Works — The 3-Stage Pipeline

### Stage 1: Research
The user types an instruction describing what they want to research (e.g. "find recent stats on AI adoption in enterprise sales teams"). The app sends this to Tavily (a web search API built for AI agents), retrieves the top results, and then passes them through GPT-4o mini to synthesize 3–5 concrete, usable insights. The user sees the synthesized research before writing begins.

### Stage 2: Generate
The user provides a topic and optionally uses the research from Stage 1. The generation pipeline pulls:
- The user's **voice prompt** (system instructions about their writing style)
- Up to **20 of their best-performing LinkedIn posts** from the Post Vault (stored in Supabase)
- The synthesized research
- Any additional context the user adds manually

GPT-4o mini reads all of this and writes a post that mirrors the user's tone, structure, sentence length, opening style, closing style, and formatting habits.

### Stage 3: Editor + Preview
The generated post appears in an editable text area. The user can edit it freely. A LinkedIn-style desktop preview renders the post exactly as it would appear on LinkedIn (profile photo placeholder, name, connection degree, "more" truncation at ~3 lines, etc.). The user can copy the final post and go paste it on LinkedIn directly (LinkedIn does not have a public write API, so direct publishing is not possible).

---

## The Post Vault

This is the most important feature. The user pastes in LinkedIn posts that have performed well — posts that got strong engagement, went viral, or represent their best writing. These are stored in Supabase and are automatically loaded during every generation call. The AI studies these posts to understand:

- How the user opens a post
- Their average sentence and paragraph length
- Their tone (direct, conversational, motivational, analytical, etc.)
- Whether they use hashtags, emojis, questions, CTAs
- Their white space habits (LinkedIn line breaks are important)

The vault can hold up to ~150 posts. The system currently pulls the 20 most recent for each generation call. In future iterations, you may want to add topic tagging so the most *relevant* posts are selected, not just the most recent.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Full-stack React framework |
| UI Components | shadcn/ui + Tailwind CSS | Clean, unstyled components the user controls |
| AI | GPT-4o mini (OpenAI API) | Fast, affordable, capable enough for voice mimicry |
| Web Search | Tavily API | Returns clean AI-ready content, not raw HTML |
| Database | Supabase (PostgreSQL, free tier) | Simple hosted database for the post vault |
| Language | TypeScript | Type safety across the whole project |

---

## Project Structure

```
vena-app/
├── app/
│   ├── api/
│   │   ├── research/route.ts     ← Stage 1: Tavily search + GPT synthesis
│   │   ├── generate/route.ts     ← Stage 2: Pull vault posts + write the post
│   │   └── posts/route.ts        ← CRUD for the Post Vault (GET, POST, DELETE)
│   ├── layout.tsx                ← Root layout
│   ├── page.tsx                  ← Home page (to be built)
│   └── globals.css               ← Global styles
│
├── lib/
│   ├── openai.ts                 ← OpenAI client (GPT-4o mini)
│   ├── supabase.ts               ← Supabase client
│   └── tavily.ts                 ← Tavily search function
│
├── prompts/
│   └── system.ts                 ← System prompts: VOICE_SYSTEM_PROMPT and RESEARCH_SYSTEM_PROMPT
│
├── types/
│   └── index.ts                  ← Shared TypeScript types
│
├── components/
│   ├── ui/                       ← shadcn/ui base components
│   ├── post-vault/               ← (to be built) Vault manager UI
│   ├── editor/                   ← (to be built) Post editor
│   ├── preview/                  ← (to be built) LinkedIn desktop preview
│   └── research/                 ← (to be built) Research panel
│
├── supabase-setup.sql            ← Run this once in Supabase SQL editor
├── .env.local                    ← Environment variables (not committed to git)
├── .env.local.example            ← Template showing required variables
└── context.md                    ← This file
```

---

## API Routes

### `POST /api/research`
Runs a web search and returns synthesized insights.

**Request body:**
```json
{
  "instruction": "find recent stats on AI in B2B sales",
  "depth": "basic" | "deep"
}
```

**Response:**
```json
{
  "synthesis": "1. ...\n2. ...\n3. ...",
  "sources": [{ "title": "", "url": "", "content": "", "score": 0.9 }]
}
```

---

### `POST /api/generate`
Generates a LinkedIn post using the user's voice + research + vault posts.

**Request body:**
```json
{
  "topic": "Why most founders underestimate distribution",
  "research": [...sources from /api/research],
  "additionalContext": "optional extra notes"
}
```

**Response:**
```json
{
  "content": "The full post text...",
  "characterCount": 842
}
```

---

### `GET /api/posts`
Returns all posts in the vault.

### `POST /api/posts`
Adds a post to the vault.
```json
{ "content": "post text", "topic": "optional tag" }
```

### `DELETE /api/posts`
Removes a post from the vault.
```json
{ "id": "uuid" }
```

---

## Supabase Setup

1. Go to supabase.com and create a free project
2. Go to the SQL Editor inside your project
3. Run the contents of `supabase-setup.sql`:

```sql
create table if not exists post_vault (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  topic text,
  created_at timestamptz default now()
);
```

4. Go to Settings → API and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Environment Variables

File: `.env.local` (hidden file in project root — press Cmd+Shift+. in Finder to reveal)

```
OPENAI_API_KEY=sk-...           ← OpenAI API key (already set)
TAVILY_API_KEY=tvly-...         ← Get from tavily.com (free tier)
NEXT_PUBLIC_SUPABASE_URL=...    ← From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=... ← From Supabase project settings
```

---

## What Still Needs to Be Built (Frontend)

The backend API is fully built. What remains is the frontend UI:

1. **Post Vault Manager** — a page or panel where the user can paste in LinkedIn posts, tag them by topic, view the list, and delete entries. This writes to `POST /api/posts`.

2. **Research Panel** — a text input where the user types their research instruction, hits run, and sees the synthesized insights returned from `POST /api/research`.

3. **Post Editor** — a textarea that receives the generated post from `POST /api/generate`. The user can freely edit the text. Shows character count.

4. **LinkedIn Desktop Preview** — a component that renders the post as it would look on LinkedIn desktop: profile photo placeholder, user name, "1st" connection badge, "...more" text truncation at ~3 lines, post body with proper line breaks.

5. **Main Page Layout** — ties everything together. Suggested layout:
   - Left sidebar or top section: Research panel
   - Center: Post editor with topic input + generate button
   - Right or below: LinkedIn preview
   - Separate tab or drawer: Post Vault manager

---

## Design Direction

- UI library: shadcn/ui (built on Radix UI + Tailwind CSS)
- Style: Clean, modern, minimal. No loud colors. Think Notion or Linear aesthetic.
- No emojis in the UI unless content calls for it
- Desktop-first (no mobile optimization needed for this tool)

---

## Key Files to Know

| File | Purpose |
|---|---|
| `prompts/system.ts` | The two system prompts — edit these to tune AI behavior |
| `lib/tavily.ts` | Web search — adjust `maxResults` or `search_depth` here |
| `lib/openai.ts` | Model is set here — change `MODEL` to upgrade to `gpt-4o` if needed |
| `app/api/generate/route.ts` | The core generation logic — vault fetch + prompt assembly |
| `supabase-setup.sql` | Run once in Supabase to create the database table |
| `.env.local` | All API keys live here |
