#!/bin/bash

set -euo pipefail

REPO="${GITHUB_REPO:-BrianCortinovis/editoria-cms}"
REQUIRED_VARS=(
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  DATABASE_URL
  SUPABASE_ACCESS_TOKEN
)

for var_name in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Variabile mancante: ${var_name}" >&2
    exit 1
  fi
done

gh secret set SUPABASE_URL --body "$SUPABASE_URL" --repo "$REPO"
gh secret set SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY" --repo "$REPO"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE_ROLE_KEY" --repo "$REPO"
gh secret set DATABASE_URL --body "$DATABASE_URL" --repo "$REPO"
gh secret set SUPABASE_ACCESS_TOKEN --body "$SUPABASE_ACCESS_TOKEN" --repo "$REPO"

echo "GitHub Secrets configurati per ${REPO}"
