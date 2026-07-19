# Opportunity posts (private sponsorship & feed internships)

Manual “Facebook-style” announcements for **private sponsorship** (e.g. BDF) and optional **internship** rows. Private sponsorships appear on `/sponsorships`. Internship openings are **not** a standalone Thuto product surface — they belong in the **community feed** (`/feed`) when students or admins share them. Applications stay on the original channel (Facebook, employer site, etc.).

## One-time setup

1. In Supabase Dashboard → **SQL**, run `supabase/migrations/20260530120000_opportunity_posts.sql` (or `supabase db push` if you use the CLI).
2. Confirm **Storage** has a public bucket `opportunity-images`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your deployment (see `.env.example`).
4. Redeploy the Thuto PWA.

## Adding a post from Superuser

1. Open `/admin`, sign in with a Thuto superuser account, and choose **Opportunities**.
2. Choose **Private sponsorship** or **Internship**.
3. Paste the sponsor, title, body, optional source URL, expiry date, and sort order.
4. Add a flyer image in either way:
   - Choose **Upload flyer/image** to upload a gallery image to the public `opportunity-images` Supabase Storage bucket.
   - Or paste an existing public URL into **Image URL**.
5. Save. Private sponsorship posts appear on `/sponsorships` when marked **Published**. Prefer posting internship openings in the community feed rather than as a dedicated page.

Superuser uploads require the latest storage policy migration. Public users can read images, but only authenticated users listed in `public.feed_admins` can write to `opportunity-images`.

## Adding a post from Supabase Dashboard

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

3. Save. Private sponsorship posts appear on `/sponsorships` within seconds for users.

## Support feedback repair

If the Superuser page shows `Could not find the table 'public.support_feedback' in the schema cache`, apply the latest migrations, including `support_feedback_repair`. The repair creates the table if it is missing, restores grants and RLS policies, and sends `notify pgrst, 'reload schema';` so PostgREST refreshes its schema cache.

## Unpublish or edit

- Set `published` to `false` to hide without deleting.
- Update `body` / `image_url` when the sponsor corrects their post.
- Set `expires_at` when a deadline passes.

## Security

- The **anon** key in the web app can **only read** rows where `published = true` and `expires_at` is null or in the future.
- **Opportunity row writes** require a signed-in `public.feed_admins` superuser in the app, or the service role in Supabase Dashboard/SQL. Never put the service role key in the PWA.
- **Opportunity image writes** to `opportunity-images` are limited to signed-in `public.feed_admins` superusers.

## App routes

| Route | Content |
|-------|---------|
| `/sponsorships` | DTEF government guide + **private sponsorship** feed |
| `/feed` | Community posts, including internship / attachment shares |
| `/internships` | Redirects to `/feed` (legacy URL) |
