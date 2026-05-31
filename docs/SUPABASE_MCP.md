# Supabase MCP (Cursor)

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

## 3. Deploy feed + profile schema

After MCP is linked to the correct project:

```bash
supabase db push
supabase functions deploy feed-moderation
```

Or ask the agent to apply migration `profile_social_and_feed_author` and deploy `feed-moderation` via MCP.
