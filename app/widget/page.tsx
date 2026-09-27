import ChatWidget from "@/components/ChatWidget";

// This route renders ONLY the chat widget, with a transparent background,
// so it can be loaded in an iframe on any external website (see
// public/embed.js). Nothing else from the site is included here.
export default function WidgetPage() {
  return <ChatWidget embedded />;
}
