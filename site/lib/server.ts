import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

export type Farmer = {
  id: string; email: string; display_name: string; username: string;
  farmer_type: string; country: string; region: string; city: string;
  bio: string; crops: string; experience: string; avatar_key: string | null; preferred_language: string;
  map_visible: number; latitude: number | null; longitude: number | null;
  created_at: string;
};

export function db(): D1Database {
  if (!env.DB) throw new Error("Agrigos database is unavailable.");
  return env.DB;
}

export function bucket(): R2Bucket {
  if (!env.BUCKET) throw new Error("Agrigos image storage is unavailable.");
  return env.BUCKET;
}

export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function passwordHash(password: string, salt: string) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBytes = new TextEncoder().encode(salt);
  // The hosted runtime caps a single PBKDF2 operation at 100,000 iterations.
  // Two domain-separated stages retain a comparable work factor without exceeding that cap.
  const first = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: 100000 }, material, 256);
  const secondMaterial = await crypto.subtle.importKey("raw", first, "PBKDF2", false, ["deriveBits"]);
  const secondSalt = new TextEncoder().encode(`agrigos-password-v2:${salt}`);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: secondSalt, iterations: 100000 }, secondMaterial, 256);
  return Array.from(new Uint8Array(bits), (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function getUserFromToken(token?: string | null): Promise<Farmer | null> {
  if (!token || token.length < 32) return null;
  const hash = await sha256(token);
  return db().prepare(`SELECT u.id,u.email,u.display_name,u.username,u.farmer_type,u.country,u.region,u.city,u.bio,u.crops,u.experience,u.avatar_key,u.preferred_language,u.map_visible,u.latitude,u.longitude,u.created_at
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(hash, now()).first<Farmer>();
}

export async function getPageUser() {
  const jar = await cookies();
  return getUserFromToken(jar.get("agrigos_session")?.value);
}

export function getRequestUser(request: Request) {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)agrigos_session=([^;]+)/)?.[1];
  return getUserFromToken(token);
}

export function publicFarmer(user: Farmer, own = false) {
  return {
    id: user.id, isExample: user.id.startsWith("example-grower-"), displayName: user.display_name, username: user.username,
    farmerType: user.farmer_type, country: user.country, region: user.region,
    city: user.city, bio: user.bio, crops: user.crops, experience: user.experience,
    avatarUrl: avatarUrlFor(user.id, user.username, user.avatar_key),
    mapVisible: !!user.map_visible, latitude: own ? user.latitude : user.map_visible ? user.latitude : null,
    longitude: own ? user.longitude : user.map_visible ? user.longitude : null,
    joinedAt: user.created_at, ...(own ? { email: user.email, preferredLanguage: user.preferred_language } : {}),
  };
}

export function avatarUrlFor(id: string, username: string, avatarKey: string | null) {
  return avatarKey ? `/api/images/${avatarKey}` : null;
}

export function error(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export function ok(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "cache-control": "no-store", ...headers } });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

export function sessionCookie(token: string, maxAge = 60 * 60 * 24 * 14) {
  return `agrigos_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function textValue(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
