# Supabase MCP and Cloud Agent setup

Project ref: **`cytqacoqyqqijwsdcrpt`**

## Why posting can fail

The app expects `feed_posts.author_university_id` (and related columns) from migration `20260609120000_feed_personalization.sql`. If that migration was never applied to the remote database, creating a post fails with:

```text
column feed_posts.author_university_id does not exist
```

The migration files are in the repo, but **GitHub Actions has been failing** because `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` repository secrets are not set.

## 1. Cursor Cloud Agents (this environment)

Local `.cursor/mcp.json` is **not** used by cloud agents. Configure access in the dashboard:

### Option A — MCP server (best for schema work)

1. Open [cursor.com/agents](https://cursor.com/agents) → **MCP** dropdown.
2. Add a remote **Supabase** server:
   - **URL:** `https://mcp.supabase.com/mcp?project_ref=cytqacoqyqqijwsdcrpt`
   - **Header:** `Authorization: Bearer <personal-access-token>`
3. Create a token at [Supabase → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
4. Start a new cloud agent and ask it to apply pending migrations or run `list_migrations`.

### Option B — Environment secrets (no MCP required)

Add secrets at [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents):

| Secret | Required | Source |
|--------|----------|--------|
| `SUPABASE_ACCESS_TOKEN` | Yes | [Access tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Optional | Project → Settings → Database |

Then the agent can run:

```bash
bash scripts/apply-supabase-migrations.sh
```

With only `SUPABASE_ACCESS_TOKEN`, the script uses the Management API. With both secrets, it uses `supabase db push`.

## 2. Cursor Desktop (local)

**One-click:** use **Add to Cursor** from the Supabase dashboard for project `cytqacoqyqqijwsdcrpt`.

**Or** copy `.cursor/mcp.json.example` to `.cursor/mcp.json`:

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

For OAuth (no token in file), use:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=cytqacoqyqqijwsdcrpt"
    }
  }
}
```

Restart Cursor and complete the browser login when prompted.

## 3. GitHub Actions (CI migrations)

In the repo **Settings → Secrets and variables → Actions**, add:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

Then run **Actions → Apply Supabase migrations → Run workflow**, or push migration changes to `main`.

## 4. Agent skills (optional)

```bash
npx skills add supabase/agent-skills
```

Skills live under `.agents/skills/` (see `skills-lock.json`).

## 5. After schema is applied

```bash
npx supabase functions deploy feed-moderation
```

Or ask the agent to deploy via MCP.
