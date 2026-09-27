import { NextRequest, NextResponse } from "next/server";
import { searchKnowledgeBase } from "@/lib/knowledge";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// Minimum overlap score to trust the knowledge base for a grounded answer.
// Below this, we treat it as "not covered by our docs" and let Groq answer
// as a general fallback instead of forcing a bad match.
const MATCH_THRESHOLD = 0.34;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set on the server. Add it to .env.local." },
        { status: 500 }
      );
    }

    const results = searchKnowledgeBase(lastUserMessage.content, 3);
    const bestScore = results[0]?.score ?? 0;
    const groundedInDocs = bestScore >= MATCH_THRESHOLD;

    const context = results
      .map((r) => `Source: ${r.chunk.source} — ${r.chunk.heading}\n${r.chunk.text}`)
      .join("\n\n---\n\n");

    const systemPrompt = groundedInDocs
      ? `You are a helpful support assistant for this website. Answer the user's question using ONLY the context below, taken from the site's own documentation. Keep answers short and direct. If the context doesn't fully answer the question, say what you do know and suggest contacting support for the rest.\n\nCONTEXT:\n${context}`
      : `You are a helpful general-purpose assistant for this website. The user's question wasn't covered in the site's documentation, so answer helpfully from your own general knowledge. Keep the answer concise. If it's something only the site owner would know (pricing, account-specific details, etc.), say you don't have that on file and suggest contacting support.`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-6), // keep a little conversational context
    ];

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "The AI service returned an error. Please try again." },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      reply,
      source: groundedInDocs ? "knowledge_base" : "groq_fallback",
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
