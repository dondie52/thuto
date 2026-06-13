#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-cytqacoqyqqijwsdcrpt}"
MIGRATIONS_DIR="${1:-supabase/migrations}"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Applying migrations with Supabase CLI..."
  npx --yes supabase@latest link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  npx --yes supabase@latest db push
  echo "Migrations applied."
  exit 0
fi

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Applying migrations via Supabase Management API..."
  for migration in "$MIGRATIONS_DIR"/*.sql; do
    [[ -f "$migration" ]] || continue
    echo "Running $(basename "$migration")..."
    response="$(curl -sS -w "\n%{http_code}" \
      "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
      --request POST \
      --header "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      --header "Content-Type: application/json" \
      --data "$(jq -n --rawfile query "$migration" '{query: $query}')")"
    body="${response%$'\n'*}"
    status="${response##*$'\n'}"
    if [[ "$status" != "200" && "$status" != "201" ]]; then
      echo "Failed on $(basename "$migration") (HTTP $status):" >&2
      echo "$body" >&2
      exit 1
    fi
  done
  echo "Migrations applied."
  exit 0
fi

cat >&2 <<'EOF'
Missing Supabase credentials.

Add at least one of these to Cursor Cloud Agent secrets
(https://cursor.com/dashboard/cloud-agents):

  SUPABASE_ACCESS_TOKEN   — Personal access token from
                            https://supabase.com/dashboard/account/tokens

Optional (preferred for CLI-based pushes):

  SUPABASE_DB_PASSWORD    — Database password from
                            Project Settings → Database

For GitHub Actions, also set repository secrets:
  SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD

For local Cursor Desktop MCP, use OAuth via .cursor/mcp.json or add the
Supabase MCP server in https://cursor.com/agents with an Authorization header.
EOF
exit 1
