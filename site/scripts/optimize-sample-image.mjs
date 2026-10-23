import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const [source, destination, kind] = process.argv.slice(2);
if (!source || !destination || !["avatar", "farm"].includes(kind)) {
  throw new Error("Usage: node scripts/optimize-sample-image.mjs <source> <destination> <avatar|farm>");
}
await mkdir(dirname(destination), { recursive: true });
await sharp(source)
  .resize(kind === "avatar" ? 384 : 1100, kind === "avatar" ? 384 : 720, { fit: "cover", position: "attention", withoutEnlargement: true })
  .webp({ quality: kind === "avatar" ? 82 : 80 })
  .toFile(destination);
