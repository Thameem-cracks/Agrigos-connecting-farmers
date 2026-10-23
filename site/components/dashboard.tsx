"use client";

import { useState, type FormEvent } from "react";
import { Bell, BotMessageSquare, Compass, House, Leaf, LogOut, Mail, MapPinned, Menu, Plus, Search, Settings2, Sprout, UserRound, X } from "lucide-react";
import type { Farmer } from "@/lib/client";
import { api, initials, json, profilePath } from "@/lib/client";
import { CreateView, ExploreView, FeedView, MapView, MessagesView, NotificationsView, PostDetailView, ProfileView, SettingsView } from "./views";
import { AlyView } from "./aly-view";
import { tr, type UiKey } from "@/lib/i18n";
import { UiTranslator } from "./ui-translator";
import "./dashboard.css";

const nav = [
  { label: "Home", href: "/app", icon: House, key: "home" },
  { label: "Explore", href: "/app/explore", icon: Compass, key: "explore" },
  { label: "World Globe", href: "/app/map", icon: MapPinned, key: "map" },
  { label: "Create Post", href: "/app/create", icon: Plus, key: "create" },
  { label: "Aly", href: "/app/aly", icon: BotMessageSquare, key: "aly" },
  { label: "Messages", href: "/app/messages", icon: Mail, key: "messages" },
  { label: "Notifications", href: "/app/notifications", icon: Bell, key: "notifications" },
  { label: "My Profile", href: "/app/profile", icon: UserRound, key: "profile" },
  { label: "Settings", href: "/app/settings", icon: Settings2, key: "settings" },
];

export function Avatar({ name, src, size = "normal" }: { name: string; src?: string | null; size?: "normal" | "small" | "large" }) {
  return <span className={`ag-avatar ag-avatar-${size}`} aria-hidden="true">{src ? <img src={src} alt="" /> : initials(name)}</span>;
}

export function Empty({ icon: Icon = Sprout, title, copy, action, href }: { icon?: typeof Sprout; title: string; copy: string; action?: string; href?: string }) {
  return <div className="ag-empty"><span className="ag-empty-icon"><Icon size={30} strokeWidth={1.7} /></span><h3>{title}</h3><p>{copy}</p>{action && href && <a className="ag-button ag-button-solid" href={href}>{action}</a>}</div>;
}

export function Status({ message }: { message: string }) {
  return message ? <p className="ag-status" role="alert">{message}</p> : null;
}

export default function Dashboard({ me, view, target, initialQuery }: { me: Farmer; view: string; target: string; initialQuery: string }) {
  const locale = me.preferredLanguage ?? "en";
  const navNames: Record<string, UiKey> = { home: "home", explore: "explore", map: "globe", create: "create", aly: "aly", messages: "messages", notifications: "notifications", profile: "profile", settings: "settings" };
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState(initialQuery);
  const active = nav.some((item) => item.key === view) ? view : "home";
  const profileTarget = target || me.username;

  function searchSubmit(event: FormEvent) {
    event.preventDefault();
    window.location.assign(`/app/explore?q=${encodeURIComponent(search.trim())}`);
  }

  async function signOut() {
    try { await api("auth/logout", json("POST")); window.location.assign("/auth.html"); }
    catch { window.location.assign("/auth.html"); }
  }

  return <div className="ag-app" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    <UiTranslator locale={locale} />
    <header className="ag-topbar">
      <a className="ag-brand" href="/app" aria-label="Agrigos home"><span className="ag-brand-mark"><Leaf size={23} /></span><span>Agrigos<span className="ag-brand-dot">.</span></span></a>
      <form className="ag-global-search" onSubmit={searchSubmit}><Search size={17} /><input aria-label="Search farmers and posts" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search farmers, crops, places..." /><kbd>↵</kbd></form>
      <div className="ag-header-actions">
        <a className="ag-icon-link" href="/app/messages" aria-label="Messages"><Mail size={20} /></a>
        <a className="ag-icon-link" href="/app/notifications" aria-label="Notifications"><Bell size={20} /></a>
        <a className="ag-account" href="/app/profile"><Avatar name={me.displayName} src={me.avatarUrl} size="small" /><span>{me.displayName.split(" ")[0]}</span></a>
        <button className="ag-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </header>
    <div className="ag-frame">
      <aside className={`ag-sidebar ${menuOpen ? "ag-sidebar-open" : ""}`}>
        <div className="ag-sidebar-label">YOUR SPACE</div>
        <nav aria-label="Main navigation">{nav.map(({ href, icon: Icon, key }) => <a key={key} href={href} className={`ag-nav-item ${active === key ? "ag-nav-active" : ""}`} aria-current={active === key ? "page" : undefined}><Icon size={20} strokeWidth={active === key ? 2.4 : 1.9} /><span>{tr(locale, navNames[key])}</span>{key === "create" && <span className="ag-nav-plus">+</span>}</a>)}</nav>
        <div className="ag-sidebar-bottom"><div className="ag-community-note"><span><Sprout size={19} /></span><strong>Every farm has a story.</strong><p>Share what you grow and learn with the next generation.</p></div><button className="ag-signout" onClick={signOut}><LogOut size={18} /> Log out</button></div>
      </aside>
      <main className={`ag-main ag-main-${active}`}>
        {view === "post" && target ? <PostDetailView me={me} id={target} /> : active === "home" && <FeedView me={me} />}
        {active === "explore" && <ExploreView me={me} initialQuery={initialQuery} />}
        {active === "map" && <MapView me={me} />}
        {active === "create" && <CreateView me={me} />}
        {active === "aly" && <AlyView me={me} />}
        {active === "messages" && <MessagesView me={me} target={target} />}
        {active === "notifications" && <NotificationsView />}
        {active === "profile" && <ProfileView me={me} username={profileTarget} />}
        {active === "settings" && <SettingsView me={me} />}
      </main>
      {(active === "home" || active === "explore") && <aside className="ag-right-rail"><div className="ag-rail-card ag-welcome-rail"><span className="ag-rail-leaf"><Sprout size={23} /></span><h3>Grow your circle</h3><p>Find farmers who share your interests and learn from their fields.</p><a href="/app/explore">Discover farmers <span aria-hidden="true">→</span></a></div><div className="ag-rail-card"><div className="ag-rail-title">YOUR PROFILE</div><div className="ag-rail-user"><Avatar name={me.displayName} src={me.avatarUrl} /><span><strong>{me.displayName}</strong><small>@{me.username}</small></span></div><a className="ag-rail-link" href={profilePath(me.username)}>View your profile →</a></div><p className="ag-rail-foot">Agrigos · Rooted in community<br />Open to the world.</p></aside>}
    </div>
    <nav className="ag-mobile-nav" aria-label="Mobile navigation">{nav.filter((item) => ["home", "explore", "create", "aly", "messages", "profile"].includes(item.key)).map(({ href, icon: Icon, key }) => <a key={key} href={href} aria-label={tr(locale, navNames[key])} aria-current={active === key ? "page" : undefined} className={active === key ? "ag-mobile-active" : ""}><Icon size={22} /><span>{tr(locale, navNames[key])}</span></a>)}</nav>
  </div>;
}
