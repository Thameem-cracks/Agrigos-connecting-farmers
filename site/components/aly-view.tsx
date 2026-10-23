"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BotMessageSquare, ImagePlus, Leaf, Send, X } from "lucide-react";
import type { Farmer } from "@/lib/client";
import { tr } from "@/lib/i18n";

type Message = { id: string; role: string; body: string; imageUrl: string | null; createdAt: string };
const starters = ["Analyze my farm.", "How can I improve my crop yield?", "What crops are suitable for my area?", "Help me identify a plant disease.", "Suggest new ideas for my farm.", "How can I reduce farming costs?", "Create a seasonal farming plan.", "How can I use my land more effectively?"];

export function AlyView({ me }: { me: Farmer }) {
  const locale = me.preferredLanguage ?? "en";
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch("/api/aly", { credentials: "include" }).then(async (response) => { const result = await response.json() as { error?: string; messages?: Message[] }; if (!response.ok) throw new Error(result.error); setMessages(result.messages ?? []); }).catch((cause) => setError(cause.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, busy]);

  async function send(event?: FormEvent, starter?: string) {
    event?.preventDefault();
    const text = starter ?? draft.trim();
    if (busy || (!text && !image)) return;
    const pending: Message = { id: `pending-${Date.now()}`, role: "user", body: text, imageUrl: image ? URL.createObjectURL(image) : null, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, pending]); setBusy(true); setError("");
    const form = new FormData(); form.set("body", text); if (image) form.set("image", image);
    try {
      const response = await fetch("/api/aly", { method: "POST", credentials: "include", body: form });
      const result = await response.json() as { error?: string; message?: Message };
      if (!response.ok) throw new Error(result.error || "Aly could not answer.");
      if (!result.message) throw new Error("Aly sent an empty response.");
      setMessages((current) => [...current, result.message!]); setDraft(""); setImage(null);
    } catch (cause) { setMessages((current) => current.filter((message) => message.id !== pending.id)); setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="ag-aly-page">
    <div className="ag-aly-head"><span className="ag-aly-mark"><BotMessageSquare size={25} /><Leaf size={13} /></span><div><span className="ag-eyebrow">{tr(locale, "assistant")}</span><h1>Aly</h1><p>{tr(locale, "alyIntro")}</p></div></div>
    <div className="ag-aly-history" aria-live="polite">
      {!messages.length && !loading && <div className="ag-aly-welcome"><h2>Hello, {me.displayName.split(" ")[0]}!</h2><p>Ask me about crops, soil, irrigation, livestock, or ideas for your farm. I can use your own Agrigos posts and photos to make advice more relevant.</p><div className="ag-aly-starters">{starters.map((starter) => <button key={starter} onClick={() => send(undefined, starter)} disabled={busy}>{starter}</button>)}</div></div>}
      {loading && <p className="ag-aly-note">Loading your conversation…</p>}
      {messages.map((message) => <div key={message.id} className={`ag-aly-message ag-aly-${message.role}`}><strong>{message.role === "assistant" ? "Aly" : "You"}</strong>{message.imageUrl && <img src={message.imageUrl} alt="Farm photo shared with Aly" />}{message.body && <p>{message.body}</p>}</div>)}
      {busy && <p className="ag-aly-note" role="status">{tr(locale, "thinking")}</p>}
      <div ref={end} />
    </div>
    {error && <div className="ag-aly-error" role="alert">{error} <button onClick={() => send()}>{tr(locale, "retry")}</button></div>}
    <form className="ag-aly-compose" onSubmit={send}><label aria-label="Attach a farm photo"><ImagePlus size={21} /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /></label><div>{image && <span>{image.name}<button type="button" onClick={() => setImage(null)} aria-label="Remove photo"><X size={13} /></button></span>}<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={tr(locale, "askAly")} rows={2} maxLength={2000} aria-label="Message Aly" /></div><button type="submit" disabled={busy || (!draft.trim() && !image)} aria-label={tr(locale, "send")}><Send size={19} /></button></form>
  </div>;
}
