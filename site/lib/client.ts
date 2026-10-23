export type Farmer = {
  id: string; displayName: string; username: string; farmerType: string;
  country: string; region: string; city: string; bio: string; crops: string;
  experience: string; avatarUrl: string | null; mapVisible: boolean;
  latitude: number | null; longitude: number | null; joinedAt: string; email?: string; preferredLanguage?: string;
  followed?: boolean; isExample?: boolean;
};

export type Post = {
  id: string; authorId: string; authorName: string; username: string;
  avatarUrl: string | null; country: string; region: string; city: string;
  caption: string; category: string; location: string; createdAt: string;
  updatedAt: string; likeCount: number; commentCount: number; liked: boolean;
  images: string[];
};

export const categories = ["All", "Crop Updates", "Production", "Harvest", "Pest and Disease", "Irrigation", "Organic Farming", "Farming Techniques", "Equipment", "Soil Health", "Questions and Advice", "Other"];

export async function api<T = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, { credentials: "same-origin", ...options });
  let data: T & { error?: string };
  try { data = await response.json(); } catch { throw new Error("The server did not respond. Please try again."); }
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export const json = (method: string, data?: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(data ?? {}) });
export const timeAgo = (date: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const locale = typeof document === "undefined" ? "en" : document.querySelector(".ag-app")?.getAttribute("lang") ?? "en";
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (seconds < 60) return relative.format(0, "second");
  if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return relative.format(-Math.floor(seconds / 3600), "hour");
  return new Date(date).toLocaleDateString(locale, { month: "short", day: "numeric", year: seconds > 31536000 ? "numeric" : undefined });
};
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
export const profilePath = (username: string) => `/app/profile/${encodeURIComponent(username)}`;

export async function startConversation(userId: string) {
  const result = await api<{ id: string }>("conversations", json("POST", { userId }));
  window.location.assign(`/app/messages/${result.id}`);
}
