# Agent instructions

## Cursor Cloud specific instructions

### Supabase database access

Cloud agents **do not** read `.cursor/mcp.json`. Configure Supabase in one of these ways:

1. **Cursor Cloud Agents dashboard (recommended for agents)**  
   Open [cursor.com/agents](https://cursor.com/agents) → **MCP** → add **Supabase** (HTTP):
   - URL: `https://mcp.supabase.com/mcp?project_ref=cytqacoqyqqijwsdcrpt`
   - Header: `Authorization: Bearer <your Supabase personal access token>`

2. **Cloud Agent secrets (works without MCP tools)**  
   Add at [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents):
   - `SUPABASE_ACCESS_TOKEN` — from [Supabase access tokens](https://supabase.com/dashboard/account/tokens)
   - `SUPABASE_DB_PASSWORD` — optional; enables `supabase db push`

   Then run:

   ```bash
   bash scripts/apply-supabase-migrations.sh
   ```

3. **GitHub Actions**  
   Set repository secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`, then run the **Apply Supabase migrations** workflow or push to `main` with migration changes.

### Common feed schema error

If posting fails with `column feed_posts.author_university_id does not exist`, pending migrations were never applied to project `cytqacoqyqqijwsdcrpt`. Apply them with the script above or via Supabase MCP `apply_migration` / `execute_sql`.

See [docs/SUPABASE_MCP.md](docs/SUPABASE_MCP.md) for full setup details.
