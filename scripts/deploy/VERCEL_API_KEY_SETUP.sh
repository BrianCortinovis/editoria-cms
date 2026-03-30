#!/bin/bash

# Script to set ANTHROPIC_API_KEY in Vercel
# Usage: bash VERCEL_API_KEY_SETUP.sh sk-ant-v1-xxxxx

if [ -z "$1" ]; then
  echo "Usage: bash VERCEL_API_KEY_SETUP.sh sk-ant-v1-xxxxx"
  exit 1
fi

API_KEY="$1"

cd /Users/briancortinovis/Documents/editoria-cms

echo "🔑 Setting ANTHROPIC_API_KEY in Vercel..."

# Try via Vercel CLI
if command -v vercel &> /dev/null; then
  echo "$API_KEY" | vercel env add ANTHROPIC_API_KEY --yes
  
  echo "✅ API key added!"
  echo ""
  echo "⏳ Triggering redeploy..."
  
  git commit --allow-empty -m "chore: redeploy with ANTHROPIC_API_KEY configured"
  git push origin main
  
  echo "✅ Done! Vercel is redeploying..."
else
  echo "❌ Vercel CLI not found"
  echo "   Please add the key manually:"
  echo "   https://vercel.com/briancortinovis-projects/editoria-cms/settings/environment-variables"
fi

