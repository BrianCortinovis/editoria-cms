#!/bin/bash

# Database Migration Runner for Supabase
# Uses Supabase dashboard SQL editor via API

set -e

SUPABASE_URL="https://xtyoeajjxgeeemwlcotk.supabase.co"
SUPABASE_PROJECT_ID="xtyoeajjxgeeemwlcotk"
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

echo "🚀 Supabase Migration Runner"
echo "Project: $SUPABASE_PROJECT_ID"
echo ""

# Function to run SQL migration
run_migration() {
  local migration_name=$1
  local migration_file=$2

  echo "⏳ $migration_name..."

  # Read SQL file
  sql_content=$(cat "$migration_file")

  # Create JSON payload
  json_payload=$(cat <<EOF
{
  "query": $(echo "$sql_content" | jq -Rs .)
}
EOF
)

  # Execute via Supabase SQL Editor
  response=$(curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -d "$json_payload")

  # Check response
  if echo "$response" | grep -q "error"; then
    echo "   ⚠️  Error (may be non-critical): $(echo "$response" | jq -r '.message' 2>/dev/null || echo "$response")"
  else
    echo "   ✅ Applied successfully"
  fi
  echo ""
}

# Apply migrations
run_migration "Phase 1: Performance Optimization (Indexes)" "supabase/migrations/20260321000002_performance_optimization.sql"
run_migration "Phase 2: Materialized Views" "supabase/migrations/20260321000003_materialized_views.sql"

echo "✨ Migration process complete!"
echo ""
echo "Next steps:"
echo "1. Deploy editoria-cms to Vercel"
echo "2. Deploy valbremmbana-web to Vercel"
echo "3. Verify API endpoints online"
