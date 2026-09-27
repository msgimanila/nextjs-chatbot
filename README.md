# Next.js Support Chatbot (docs-first, Groq fallback)

A minimal public-facing chatbot: it first tries to answer from `.md`/`.txt`
files in `/content`, and only calls Groq's AI as a general fallback when the
question isn't covered in your docs.

## How it works

1. `lib/knowledge.ts` reads every `.md`/`.txt` file in `/content` at request
   time, splits each into chunks (by `##` heading, or by paragraph for plain
   text), and keeps them in memory.
2. When a question comes in, it scores each chunk by keyword overlap with
   the question and takes the top 3 matches.
3. `app/api/chat/route.ts` sends those matches to Groq as context and asks
   it to answer *using only that context*. If nothing scored well enough
   (below `MATCH_THRESHOLD` in that file), it skips the docs and lets Groq
   answer as a general assistant instead — the "fallback" behavior.
4. `components/ChatWidget.tsx` is the chat bubble UI, mounted on the home
   page in `app/page.tsx`.

No vector database, no embeddings API calls — just keyword matching, which
is enough for a small FAQ-style knowledge base and keeps this genuinely
simple to run and extend.

## Setup

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and paste in your Groq API key
npm run dev
```

Open http://localhost:3000 — the chat bubble is in the bottom-right corner.

Get a free Groq API key at https://console.groq.com/keys.

## Adding your own content

Just add more `.md` or `.txt` files to `/content`. Use `##` headings to
separate topics — each heading becomes its own searchable chunk. No restart
needed in dev; in production the cache is built per server instance, so
redeploy after adding files.

## Tuning the fallback

In `app/api/chat/route.ts`:

- `MATCH_THRESHOLD` (0–1) — how confident the keyword match needs to be
  before the bot trusts your docs over general AI. Lower it if the bot
  falls back to Groq too often; raise it if it forces bad matches from
  unrelated docs.
- `GROQ_MODEL` — set via env var. `llama-3.1-8b-instant` is fast and cheap;
  swap in a larger Groq-hosted model for better quality if needed.

## Deploying

This is a standard Next.js app — deploys as-is to Vercel, Netlify, or any
Node host. Just set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) as
environment variables on the platform.
