import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold mb-2">Welcome</h1>
        <p className="text-slate-600 mb-8">
          This is a placeholder page. The chat bubble in the bottom-right
          corner answers questions from the files in <code>/content</code>,
          and falls back to Groq AI for anything not covered there.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Drop your own pages, copy, and content here. The chatbot works on
          any page it's mounted on.
        </div>
      </div>
      <ChatWidget />
    </main>
  );
}
