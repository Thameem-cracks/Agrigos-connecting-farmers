"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Camera, ChevronRight, Globe2, Heart, ImagePlus, Leaf, MapPin, MessageCircle, MoreHorizontal, Plus, Search, Send, Share2, Sprout, Trash2, UserPlus, Users } from "lucide-react";
import { api, categories, initials, json, profilePath, startConversation, timeAgo, type Farmer, type Post } from "@/lib/client";
import { Avatar, Empty, Status } from "./dashboard";
export { MapView, MessagesView, NotificationsView, SettingsView } from "./views-social";

type Comment = { id: string; body: string; createdAt: string; authorId: string; authorName: string; username: string; avatarUrl: string | null };

function Spinner() { return <div className="ag-loading" role="status"><span className="ag-spinner" /> Loading...</div>; }
function SectionHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="ag-section-head"><div><span className="ag-eyebrow">{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>;
}

export function PostCard({ post: initial, me, onDeleted }: { post: Post; me: Farmer; onDeleted?: () => void }) {
  const [post, setPost] = useState(initial);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [category, setCategory] = useState(post.category);
  const [location, setLocation] = useState(post.location);
  const [menu, setMenu] = useState(false);

  async function toggleLike() {
    try {
      const result = await api<{ liked: boolean; count: number }>(`likes/${post.id}`, json("POST"));
      setPost({ ...post, liked: result.liked, likeCount: result.count });
    } catch (e) { setError((e as Error).message); }
  }
  async function openComments() {
    if (!commentsOpen) {
      try { const result = await api<{ comments: Comment[] }>(`comments/${post.id}`); setComments(result.comments); }
      catch (e) { setError((e as Error).message); }
    }
    setCommentsOpen(!commentsOpen);
  }
  async function addComment(event: FormEvent) {
    event.preventDefault(); if (!comment.trim() || busy) return;
    setBusy(true); setError("");
    try {
      await api(`comments/${post.id}`, json("POST", { body: comment }));
      const result = await api<{ comments: Comment[] }>(`comments/${post.id}`);
      setComments(result.comments); setComment(""); setPost({ ...post, commentCount: result.comments.length });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function deleteComment(commentId: string) {
    try { await api(`comments/${commentId}`, { method: "DELETE" }); setComments(comments.filter((c) => c.id !== commentId)); setPost({ ...post, commentCount: Math.max(0, post.commentCount - 1) }); }
    catch (e) { setError((e as Error).message); }
  }
  async function savePost() {
    setBusy(true); try { await api(`posts/${post.id}`, json("PATCH", { caption, category, location })); setPost({ ...post, caption, category, location }); setEditing(false); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function deletePost() {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try { await api(`posts/${post.id}`, { method: "DELETE" }); onDeleted?.(); }
    catch (e) { setError((e as Error).message); }
  }
  async function share() {
    const link = `${window.location.origin}/app/post/${post.id}`;
    try { await navigator.clipboard.writeText(link); setError("Post link copied."); }
    catch { setError(`Share this link: ${link}`); }
  }
  return <article className="ag-post-card">
    <div className="ag-post-top"><a href={profilePath(post.username)} className="ag-post-author"><Avatar name={post.authorName} src={post.avatarUrl} /><span><strong>{post.authorName}</strong><small>@{post.username} · {timeAgo(post.createdAt)}</small></span></a><div className="ag-post-options"><span className="ag-category-tag">{post.category}</span>{post.authorId === me.id && <><button className="ag-plain-icon" aria-label="Post options" aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreHorizontal size={20} /></button>{menu && <div className="ag-popmenu"><button onClick={() => { setEditing(true); setMenu(false); }}>Edit post</button><button onClick={deletePost}>Delete post</button></div>}</>}</div></div>
    {post.location && <div className="ag-post-location"><MapPin size={13} /> {post.location}</div>}
    {editing ? <div className="ag-edit-post"><textarea value={caption} maxLength={3000} onChange={(e) => setCaption(e.target.value)} aria-label="Edit caption" /><select aria-label="Edit category" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select><input aria-label="Edit general location" value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} placeholder="General location (optional)" /><div><button className="ag-button ag-button-solid" disabled={busy} onClick={savePost}>Save changes</button><button className="ag-button ag-button-ghost" onClick={() => setEditing(false)}>Cancel</button></div></div> : post.caption && <p className="ag-post-caption">{post.caption}</p>}
    {post.images.length > 0 && <div className={`ag-post-gallery ag-gallery-${Math.min(post.images.length, 4)}`}>{post.images.map((src, i) => <img src={src} key={src} alt={`Farm post image ${i + 1}`} loading="lazy" />)}</div>}
    <div className="ag-post-actions"><button className={post.liked ? "ag-liked" : ""} onClick={toggleLike} aria-label={post.liked ? "Unlike post" : "Like post"}><Heart size={19} fill={post.liked ? "currentColor" : "none"} /> {post.likeCount} <span>Likes</span></button><button onClick={openComments}><MessageCircle size={19} /> {post.commentCount} <span>Comments</span></button><button onClick={share}><Share2 size={19} /> <span>Share</span></button></div>
    <Status message={error} />
    {commentsOpen && <div className="ag-comments"><h4>Comments</h4>{comments.length ? comments.map((item) => <div className="ag-comment" key={item.id}><Avatar name={item.authorName} src={item.avatarUrl} size="small" /><div><a href={profilePath(item.username)}><strong>{item.authorName}</strong></a><p>{item.body}</p><small>{timeAgo(item.createdAt)}</small></div>{item.authorId === me.id && <button title="Delete your comment" aria-label="Delete your comment" onClick={() => deleteComment(item.id)}><Trash2 size={15} /></button>}</div>) : <p className="ag-muted">No comments yet. Start the conversation.</p>}<form className="ag-comment-form" onSubmit={addComment}><Avatar name={me.displayName} src={me.avatarUrl} size="small" /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment..." maxLength={1000} aria-label="Write a comment" /><button type="submit" disabled={busy || !comment.trim()} aria-label="Post comment"><Send size={17} /></button></form></div>}
  </article>;
}

function FeedList({ me, endpoint, emptyTitle, emptyCopy }: { me: Farmer; endpoint: string; emptyTitle: string; emptyCopy: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { setPosts([]); setPage(0); setLoading(true); let active = true; api<{ posts: Post[]; hasMore: boolean }>(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=0`).then((r) => { if (active) { setPosts(r.posts); setHasMore(r.hasMore); setLoading(false); } }).catch((e) => { if (active) { setError(e.message); setLoading(false); } }); return () => { active = false; }; }, [endpoint]);
  async function more() { setLoading(true); try { const next = page + 1; const r = await api<{ posts: Post[]; hasMore: boolean }>(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${next}`); setPosts([...posts, ...r.posts]); setPage(next); setHasMore(r.hasMore); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } }
  if (loading && !posts.length) return <Spinner />;
  if (error && !posts.length) return <Status message={error} />;
  if (!posts.length) return <Empty title={emptyTitle} copy={emptyCopy} action="Create a post" href="/app/create" />;
  return <div className="ag-feed-list">{posts.map((post) => <PostCard key={post.id} post={post} me={me} onDeleted={() => setPosts(posts.filter((p) => p.id !== post.id))} />)}<Status message={error} />{hasMore && <button className="ag-button ag-button-ghost ag-load-more" disabled={loading} onClick={more}>{loading ? "Loading..." : "Load more posts"}</button>}</div>;
}

export function FeedView({ me }: { me: Farmer }) {
  return <div className="ag-content-narrow"><SectionHeader eyebrow="YOUR COMMUNITY" title={`Good to see you, ${me.displayName.split(" ")[0]}.`} copy="" /><div className="ag-feed-label"><span><Leaf size={17} /> Recent posts</span><span>Newest first</span></div><FeedList me={me} endpoint="feed" emptyTitle="Your community is ready to grow" emptyCopy="Use Create to share photos, your farming journey, or what you produce." /></div>;
}
export function PostDetailView({ me, id }: { me: Farmer; id: string }) {
  const [post, setPost] = useState<Post | null>(null); const [error, setError] = useState("");
  useEffect(() => { api<{ post: Post }>(`posts/${id}`).then((r) => setPost(r.post)).catch((e) => setError(e.message)); }, [id]);
  return <div className="ag-content-narrow"><a className="ag-back-link" href="/app"><ArrowLeft size={17} /> Back to feed</a>{post ? <PostCard post={post} me={me} onDeleted={() => window.location.assign("/app")} /> : error ? <Status message={error} /> : <Spinner />}</div>;
}

function FarmerCard({ farmer, me }: { farmer: Farmer; me: Farmer }) {
  const [followed, setFollowed] = useState(!!farmer.followed); const [error, setError] = useState("");
  async function follow() { try { const r = await api<{ followed: boolean }>(`follows/${farmer.id}`, json("POST")); setFollowed(r.followed); } catch (e) { setError((e as Error).message); } }
  return <article className="ag-farmer-card"><a href={profilePath(farmer.username)}><Avatar name={farmer.displayName} src={farmer.avatarUrl} size="large" /><h3>{farmer.displayName}</h3><span>@{farmer.username}</span></a>{farmer.isExample && <span className="ag-example-badge">Example profile</span>}<p><MapPin size={14} /> {[farmer.city, farmer.country].filter(Boolean).join(", ")}</p><p className="ag-farmer-focus">{farmer.farmerType}{farmer.crops ? ` · ${farmer.crops}` : ""}</p><div className="ag-farmer-actions"><button className="ag-button ag-button-solid" onClick={follow}>{followed ? "Following" : "Follow"}</button>{!farmer.isExample && <button className="ag-button ag-button-outline" onClick={() => startConversation(farmer.id)}>Message</button>}</div><Status message={error} /></article>;
}

export function ExploreView({ me, initialQuery }: { me: Farmer; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery); const [search, setSearch] = useState(initialQuery);
  const [farmers, setFarmers] = useState<Farmer[]>([]); const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; setLoading(true); api<{ farmers: Farmer[] }>(`farmers?q=${encodeURIComponent(search)}`).then((r) => { if (active) { setFarmers(r.farmers); setLoading(false); } }).catch((e) => { if (active) { setError(e.message); setLoading(false); } }); return () => { active = false; }; }, [search]);
  const endpoint = category === "All" ? "feed" : `feed?category=${encodeURIComponent(category)}`;
  return <div className="ag-content-wide"><SectionHeader eyebrow="DISCOVER" title="Explore the community" copy="Meet aspiring growers, learn together, and discover what people are producing." /><a className="ag-globe-feature" href="/app/map"><span className="ag-globe-feature-icon"><Globe2 size={28} /></span><span><strong>Explore the World Globe</strong><small>Discover growers around the world</small></span><ChevronRight size={22} /></a><form className="ag-explore-search" onSubmit={(e) => { e.preventDefault(); setSearch(query.trim()); }}><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by farmer, username, city, or country" aria-label="Search farmers" /><button type="submit">Search</button></form><div className="ag-explore-subhead"><h2>Farmers</h2></div>{loading ? <Spinner /> : error ? <Status message={error} /> : farmers.length ? <div className="ag-farmer-grid">{farmers.map((farmer) => <FarmerCard key={farmer.id} farmer={farmer} me={me} />)}</div> : <Empty icon={Users} title="No farmers found" copy={search ? "Try another name or location." : "As farmers join Agrigos, they will appear here."} />}<div className="ag-explore-subhead ag-explore-posts"><h2>Explore posts</h2></div><div className="ag-chips" role="group" aria-label="Post categories">{categories.map((item) => <button key={item} className={category === item ? "ag-chip-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="ag-content-narrow"><FeedList me={me} endpoint={endpoint} emptyTitle="No posts in this category yet" emptyCopy="Check another category or be the first to share." /></div></div>;
}

export function CreateView({ me }: { me: Farmer }) {
  const [caption, setCaption] = useState(""); const [category, setCategory] = useState("Crop Updates");
  const [location, setLocation] = useState(""); const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  function choose(files: FileList | null) { if (!files) return; const next = Array.from(files).slice(0, 4 - images.length); setImages([...images, ...next.map((file) => ({ file, url: URL.createObjectURL(file) }))]); }
  function remove(index: number) { URL.revokeObjectURL(images[index].url); setImages(images.filter((_, i) => i !== index)); }
  async function submit(event: FormEvent) { event.preventDefault(); if (busy) return; setBusy(true); setError(""); try { const form = new FormData(); form.set("caption", caption); form.set("category", category); form.set("location", location); images.forEach(({ file }) => form.append("images", file)); const result = await api<{ id: string }>("posts", { method: "POST", body: form }); images.forEach(({ url }) => URL.revokeObjectURL(url)); window.location.assign(`/app/post/${result.id}`); } catch (e) { setError((e as Error).message); setBusy(false); } }
  return <div className="ag-content-narrow"><SectionHeader eyebrow="SHARE YOUR STORY" title="Create a post" copy="Share photos, tell your farming story, or show what you produce." /><form className="ag-create-card" onSubmit={submit}><div className="ag-create-user"><Avatar name={me.displayName} src={me.avatarUrl} /><span><strong>{me.displayName}</strong><small>Posting to the Agrigos community</small></span></div><label className="ag-field"><span>Your story</span><textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={3000} placeholder="What are you growing, learning, or producing?" rows={7} /></label><div className="ag-create-grid"><label className="ag-field"><span>Category</span><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="ag-field"><span>General location <em>Optional</em></span><input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="e.g. Kerala, India" /></label></div><div className="ag-upload-area"><input id="ag-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => choose(e.target.files)} disabled={images.length >= 4} /><label htmlFor="ag-images"><ImagePlus size={25} /><strong>Add farm photos</strong><small>JPEG, PNG, or WebP · up to 4 images · 5 MB each</small></label></div>{images.length > 0 && <div className="ag-image-previews">{images.map(({ url, file }, i) => <div key={url}><img src={url} alt={`Preview ${file.name}`} /><button type="button" onClick={() => remove(i)} aria-label={`Remove ${file.name}`}>×</button></div>)}</div>}<Status message={error} /><div className="ag-form-actions"><a className="ag-button ag-button-ghost" href="/app">Cancel</a><button className="ag-button ag-button-solid" type="submit" disabled={busy || (!caption.trim() && !images.length)}>{busy ? "Publishing..." : "Publish post"} <Plus size={16} /></button></div></form></div>;
}

export function ProfileView({ me, username }: { me: Farmer; username: string }) {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [counts, setCounts] = useState<{ posts: number; followers: number; following: number; followed: number } | null>(null);
  const [error, setError] = useState(""); const [list, setList] = useState<Farmer[] | null>(null); const [listTitle, setListTitle] = useState("");
  useEffect(() => { api<{ farmer: Farmer; counts: typeof counts }>(`profile/${encodeURIComponent(username)}`).then((r) => { setFarmer(r.farmer); setCounts(r.counts); }).catch((e) => setError(e.message)); }, [username]);
  async function follow() { if (!farmer || !counts) return; try { const r = await api<{ followed: boolean }>(`follows/${farmer.id}`, json("POST")); setCounts({ ...counts, followed: r.followed ? 1 : 0, followers: counts.followers + (r.followed ? 1 : -1) }); } catch (e) { setError((e as Error).message); } }
  async function showList(kind: "followers" | "following") { if (!farmer) return; try { const r = await api<{ farmers: Farmer[] }>(`connections/${farmer.id}?kind=${kind}`); setList(r.farmers); setListTitle(kind === "followers" ? "Followers" : "Following"); } catch (e) { setError((e as Error).message); } }
  if (error && !farmer) return <Status message={error} />;
  if (!farmer) return <Spinner />;
  const self = farmer.id === me.id;
  return <div className="ag-content-wide"><div className="ag-profile-cover"><div className="ag-profile-pattern" /><span className="ag-profile-avatar"><Avatar name={farmer.displayName} src={farmer.avatarUrl} size="large" />{self && <a className="ag-profile-photo-edit" href="/app/settings" aria-label="Edit profile picture" title="Edit profile picture"><Camera size={17} /></a>}</span></div><div className="ag-profile-body"><div className="ag-profile-head"><div><span className="ag-eyebrow">FARMER PROFILE</span><h1>{farmer.displayName}</h1><p>@{farmer.username}</p>{farmer.isExample && <span className="ag-example-badge">Example profile · Cannot receive messages</span>}</div><div className="ag-profile-actions">{self ? <><a className="ag-button ag-button-solid" href="/app/settings">Edit profile</a><a className="ag-button ag-button-outline" href="/app/settings#language">Language</a></> : <><button className="ag-button ag-button-solid" onClick={follow}>{counts?.followed ? "Following" : "Follow farmer"}</button>{!farmer.isExample && <button className="ag-button ag-button-outline" onClick={() => startConversation(farmer.id)}>Message</button>}</>}</div></div><div className="ag-profile-meta"><span><MapPin size={16} /> {[farmer.city, farmer.region, farmer.country].filter(Boolean).join(", ")}</span><span><Sprout size={16} /> {farmer.farmerType}</span></div>{farmer.bio && <p className="ag-profile-bio">{farmer.bio}</p>}{farmer.crops && <p className="ag-profile-crops"><strong>Crops:</strong> {farmer.crops}</p>}<div className="ag-stats"><span><strong>{counts?.posts ?? 0}</strong> posts</span><button onClick={() => showList("followers")}><strong>{counts?.followers ?? 0}</strong> followers</button><button onClick={() => showList("following")}><strong>{counts?.following ?? 0}</strong> following</button></div><Status message={error} />{list && <div className="ag-connection-list"><div><h3>{listTitle}</h3><button onClick={() => setList(null)} aria-label="Close list">×</button></div>{list.length ? list.map((item) => <a key={item.id} href={profilePath(item.username)}><Avatar name={item.displayName} src={item.avatarUrl} size="small" /><span>{item.displayName}<small>@{item.username}</small></span></a>) : <p className="ag-muted">No farmers here yet.</p>}</div>}</div><div className="ag-profile-posts"><div className="ag-feed-label"><span><Leaf size={17} /> Posts from {self ? "you" : farmer.displayName}</span></div><FeedList me={me} endpoint={`posts?author=${encodeURIComponent(farmer.username)}`} emptyTitle="No posts yet" emptyCopy={self ? "Share the first story from your farm." : "This farmer has not shared a post yet."} /></div></div>;
}
