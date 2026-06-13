# Supabase MCP (Cursor)

**Thuto project only:** `cytqacoqyqqijwsdcrpt` (region `eu-west-1`).  
Do **not** use the separate **Omang** Supabase project (`lefwmtncducblybyvyze`) for this repo.

## 1. Configure MCP

In Cursor, add **Supabase MCP** for your Thuto project.

**One-click:** use **Add to Cursor** from the Supabase dashboard for project `cytqacoqyqqijwsdcrpt`.

**Or** copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and set your project ref:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=cytqacoqyqqijwsdcrpt"
    }
  }
}
```

Restart Cursor after saving. Complete the browser login when prompted so the MCP session can access **that** project.

## 2. Agent skills (optional)

```bash
npx skills add supabase/agent-skills
```

Skills are installed under `.agents/skills/` (see `skills-lock.json`).

## 3. Deploy feed + profile schema (Thuto)

Link and push to **Thuto** only:

```bash
supabase link --project-ref cytqacoqyqqijwsdcrpt
supabase db push --include-all --yes
supabase functions deploy feed-moderation --project-ref cytqacoqyqqijwsdcrpt
```

> **Note:** Migration `20260603073932_remove_e_omang_feed_demo.sql` removes legacy **e-Omang demo posts** from the Thuto feed. It is not related to the Omang Supabase project.

Or ask the agent to apply pending migrations and deploy `feed-moderation` on project `cytqacoqyqqijwsdcrpt`.
