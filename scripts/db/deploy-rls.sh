#!/bin/bash

# Deploy RLS Policies to Supabase via Supabase CLI
# Usage: bash scripts/deploy-rls.sh
#
# Prerequisites:
#   npm install -g supabase
#   supabase login (with your Supabase access token)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  source "$PROJECT_ROOT/.env.local"
  set +a
else
  echo "❌ Error: .env.local not found"
  exit 1
fi

echo "🔐 Deploying RLS Policies to Supabase..."
echo ""

# Verify environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
  exit 1
fi

# Extract project ID from URL (e.g., xtyoeajjxgeeemwlcotk from https://xtyoeajjxgeeemwlcotk.supabase.co)
PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Could not extract project ID from NEXT_PUBLIC_SUPABASE_URL"
  echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
  exit 1
fi

echo "📍 Project ID: $PROJECT_ID"
echo "🌍 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "⚠️  Supabase CLI not found. Installing..."
  npm install -g supabase
fi

# Get the SQL file
SQL_FILE="$PROJECT_ROOT/SUPABASE_RLS_CONFIG_EXECUTE.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: $SQL_FILE not found"
  exit 1
fi

echo "📝 SQL to execute: $SQL_FILE"
echo "📊 Lines: $(wc -l < "$SQL_FILE")"
echo ""

# Instructions for manual execution
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Open Supabase Console: https://app.supabase.com/project/$PROJECT_ID/sql/new"
echo ""
echo "2. Copy and paste this SQL:"
echo "---"
cat "$SQL_FILE"
echo "---"
echo ""
echo "3. Click 'Run' to execute all policies"
echo ""
echo "Or use Supabase CLI:"
echo "   supabase db execute --project-ref $PROJECT_ID < $SQL_FILE"
echo ""
echo "✅ After execution, RLS will be enabled on:"
echo "   • user_tenants (SELECT isolation)"
echo "   • site_pages (CRUD multi-tenant)"
echo "   • blocks (CRUD multi-tenant)"
echo "   • articles (CRUD multi-tenant)"
echo "   • content_slots (CRUD multi-tenant)"
echo "   • seo_analysis_history (SELECT isolation)"
