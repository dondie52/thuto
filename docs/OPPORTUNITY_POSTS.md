# Opportunity posts (internships & private sponsorship)

Manual “Facebook-style” announcements for **internships** and **private sponsorship** (e.g. BDF). Students read posts in the app; applications stay on the original channel (Facebook, employer site, etc.).

## One-time setup

1. In Supabase Dashboard → **SQL**, run `supabase/migrations/20260530120000_opportunity_posts.sql` (or `supabase db push` if you use the CLI).
2. Confirm **Storage** has a public bucket `opportunity-images`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your deployment (see `.env.example`).
4. Redeploy the Thuto PWA.

## Adding a post

1. **Storage** (optional): Upload a flyer/screenshot to `opportunity-images`. Copy the public URL.
2. **Table Editor** → `opportunity_posts` → **Insert row**:

| Column | Example |
|--------|---------|
| `category` | `private_sponsorship` or `internship` |
| `sponsor` | `BDF` |
| `title` | `Officer cadet sponsorship 2026` |
| `body` | Full text from the Facebook post (requirements, dates, contacts) |
| `image_url` | `https://xxxx.supabase.co/storage/v1/object/public/opportunity-images/bdf-2026.jpg` |
| `source_url` | `https://www.facebook.com/...` (original post) |
| `published` | `true` |
| `published_at` | Now (controls sort order) |
| `expires_at` | Optional — post hides after this time |
| `sort_order` | Higher = listed first when dates match |

3. Save. The post appears on `/sponsorships` (private) or `/internships` within seconds for users.

## Unpublish or edit

- Set `published` to `false` to hide without deleting.
- Update `body` / `image_url` when the sponsor corrects their post.
- Set `expires_at` when a deadline passes.

## Security

- The **anon** key in the web app can **only read** rows where `published = true` and `expires_at` is null or in the future.
- **Inserts/updates/deletes** require the service role (Dashboard, SQL editor, or a future admin tool)—never put the service role key in the PWA.

## App routes

| Route | Content |
|-------|---------|
| `/sponsorships` | DTEF government guide + **private sponsorship** feed |
| `/internships` | **Internship** feed |
