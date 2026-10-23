"use client";

import { useEffect } from "react";
import { ui } from "@/lib/i18n";

const excluded = ".ag-post-author,.ag-post-caption,.ag-post-location,.ag-post-gallery,.ag-comment,.ag-farmer-card>a,.ag-farmer-focus,.ag-chat-history,.ag-conversation-items,.ag-message-people,.ag-aly-history,.ag-map-people,.ag-profile-head h1,.ag-profile-head p,.ag-profile-bio,.ag-profile-meta,.ag-profile-crops,.ag-notice-list,.ag-account,.ag-rail-user,.ag-create-user,.ag-settings-photo";
type Entry = { source: string; apply: (translation: string) => void };

export function UiTranslator({ locale }: { locale: string }) {
  useEffect(() => {
    if (locale === "en") return;
    const root = document.querySelector(".ag-app");
    if (!root) return;
    const storageKey = `agrigos-ui-${locale}-v1`;
    let cache: Record<string, string> = {};
    try { cache = JSON.parse(localStorage.getItem(storageKey) ?? "{}"); } catch { /* use empty cache */ }
    const local = ui[locale as keyof typeof ui] as Record<string, string> | undefined;
    if (local) for (const [key, english] of Object.entries(ui.en)) cache[english] = local[key];
    const originals = new WeakMap<Text, string>();
    const attributeOriginals = new WeakMap<Element, Map<string, string>>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let working = false;
    let stopped = false;

    function entries(): Entry[] {
      const result: Entry[] = [];
      const walker = document.createTreeWalker(root!, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        const parent = text.parentElement;
        if (!parent || parent.closest(excluded) || parent.closest("script,style,svg,option") || parent.isContentEditable) continue;
        const current = text.textContent?.trim() ?? "";
        if (current.length < 2 || current.length > 300 || !/[A-Za-z]/.test(current) || /^[\d\s.,:;!?+\-\/]+$/.test(current) || current === "Agrigos" || current === "Aly") continue;
        const old = originals.get(text);
        if (old && current === cache[old]) continue;
        const source = old && current === old ? old : current;
        originals.set(text, source);
        result.push({ source, apply: (translation) => { if (text.isConnected && text.textContent?.trim() === source) text.textContent = (text.textContent ?? "").replace(source, translation); } });
      }
      for (const element of root!.querySelectorAll("input,textarea,button,a")) {
        if (element.closest(excluded)) continue;
        for (const attribute of ["placeholder", "aria-label", "title"]) {
          const current = element.getAttribute(attribute);
          if (!current || current.length > 300 || !/[A-Za-z]/.test(current)) continue;
          let known = attributeOriginals.get(element);
          if (!known) { known = new Map(); attributeOriginals.set(element, known); }
          const old = known.get(attribute);
          if (old && current === cache[old]) continue;
          const source = old && current === old ? old : current;
          known.set(attribute, source);
          result.push({ source, apply: (translation) => { if (element.isConnected && element.getAttribute(attribute) === source) element.setAttribute(attribute, translation); } });
        }
      }
      return result;
    }

    async function scan() {
      if (working || stopped) return;
      const found = entries();
      for (const entry of found) if (cache[entry.source]) entry.apply(cache[entry.source]);
      const missing = [...new Set(found.map((entry) => entry.source).filter((source) => !cache[source]))].slice(0, 40);
      if (!missing.length) return;
      working = true;
      try {
        const response = await fetch("/api/ui-translate", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ strings: missing }) });
        if (!response.ok) throw new Error("Interface translation unavailable");
        const data = await response.json() as { translations: string[] };
        missing.forEach((source, index) => { cache[source] = data.translations[index]; });
        localStorage.setItem(storageKey, JSON.stringify(cache));
        for (const entry of found) if (cache[entry.source]) entry.apply(cache[entry.source]);
      } catch { for (const source of missing) cache[source] = source; }
      finally { working = false; if (!stopped) schedule(); }
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(scan, 250); }
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] });
    schedule();
    return () => { stopped = true; clearTimeout(timer); observer.disconnect(); };
  }, [locale]);
  return null;
}
