# Agrigos

Agrigos is a farmer community with a feed, Explore, an India Farmer Map, posts with images, profiles, follows, private messages, notifications, and profile settings. The existing landing and two-step registration/login pages remain at `/index.html` and `/auth.html`; after a successful login or registration, users enter `/app`.

## Architecture

- Vinext/React on Cloudflare Workers
- D1 for users, sessions, posts, interactions, conversations, messages, and notifications
- R2 for validated JPEG, PNG, and WebP uploads
- PBKDF2 password hashing and revocable, HttpOnly session cookies
- Server-side session, ownership, and conversation membership checks on every relevant endpoint
- Interactive India map with drag, wheel, pinch, and button zoom; opted-in Indian members appear at approximate coordinates
- Conversation polling as a reliable update fallback

Legacy fictional profiles and the translation demo account are removed from the database on the next authenticated API request. Members can edit their profile picture from their profile page or settings. The existing country/state/city picker loads the pinned `@countrystatecity/countries-browser` 1.0.4 dataset from unpkg with jsDelivr as a fallback; it requires a connection. Its ODbL attribution remains in the auth page footer.

## Development

The Site manifest declares `DB` and `BUCKET`. Generate migrations after schema changes with `npm run db:generate`, then build with `npm run build`. Apply the migration to a local preview database using the Wrangler command documented in the Sites Vinext starter. Hosted migrations are applied by Sites at publication.

The Site's current audience is owner-only. Agrigos account registration works for visitors allowed through that Site access policy; changing the Site audience is a separate hosting decision.
