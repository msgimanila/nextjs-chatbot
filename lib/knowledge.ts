import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface Chunk {
  source: string;
  heading: string;
  text: string;
}

// Simple in-memory cache so we don't re-read disk on every request.
let cache: Chunk[] | null = null;

function chunkMarkdown(source: string, raw: string): Chunk[] {
  const { content } = matter(raw); // strips optional frontmatter
  // Split on markdown headings (## Heading) — each section becomes one chunk.
  // Falls back to paragraph splitting for plain .txt files with no headings.
  const sections = content.split(/\n(?=#{1,6}\s)/g);

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const headingMatch = trimmed.match(/^#{1,6}\s+(.*)/);
    const heading = headingMatch ? headingMatch[1].trim() : source;
    const text = trimmed.replace(/^#{1,6}\s+.*/, "").trim();

    if (text.length > 800) {
      // Further split long sections into paragraph-sized chunks.
      const paras = text.split(/\n\s*\n/).filter(Boolean);
      let buffer = "";
      for (const p of paras) {
        if ((buffer + "\n\n" + p).length > 800) {
          if (buffer) chunks.push({ source, heading, text: buffer.trim() });
          buffer = p;
        } else {
          buffer = buffer ? buffer + "\n\n" + p : p;
        }
      }
      if (buffer) chunks.push({ source, heading, text: buffer.trim() });
    } else if (text) {
      chunks.push({ source, heading, text });
    }
  }
  return chunks;
}

export function loadKnowledgeBase(): Chunk[] {
  if (cache) return cache;

  if (!fs.existsSync(CONTENT_DIR)) {
    cache = [];
    return cache;
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".txt"));

  const chunks: Chunk[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    chunks.push(...chunkMarkdown(file, raw));
  }

  cache = chunks;
  return chunks;
}

function tokenize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "has",
  "have", "with", "this", "that", "what", "how", "does", "do", "did",
  "your", "our", "about", "from", "into", "will", "would", "should",
]);

/**
 * Very small TF-style overlap scorer. Good enough for a "does this
 * question match one of our docs" gate — no embeddings/vector DB needed.
 */
export function searchKnowledgeBase(
  query: string,
  topK = 3
): { chunk: Chunk; score: number }[] {
  const chunks = loadKnowledgeBase();
  const queryWords = tokenize(query).filter((w) => !STOPWORDS.has(w));
  if (queryWords.length === 0 || chunks.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const chunkWords = tokenize(chunk.heading + " " + chunk.text);
    const chunkSet = new Set(chunkWords);
    let matches = 0;
    for (const w of queryWords) {
      if (chunkSet.has(w)) matches++;
    }
    const score = matches / queryWords.length;
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
