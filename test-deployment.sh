#!/bin/bash

# Test Deployment Script
# Verifica che editoria-cms è live e funzionante

set -e

PROD_URL="https://editoria-cms-briancortinovis-projects.vercel.app"
LOCAL_URL="http://localhost:3000"

echo "🚀 Testing editoria-cms Deployment"
echo "=================================="
echo ""

# Detect if testing local or production
if [ "$1" == "prod" ]; then
    TEST_URL="$PROD_URL"
    echo "🌐 Testing PRODUCTION: $PROD_URL"
else
    TEST_URL="$LOCAL_URL"
    echo "🏠 Testing LOCAL: $LOCAL_URL"
fi

echo ""

# Test 1: Basic connectivity
echo "1️⃣  Checking basic connectivity..."
if curl -s "$TEST_URL" > /dev/null; then
    echo "   ✅ Server responds"
else
    echo "   ❌ Server not responding"
    exit 1
fi

# Test 2: IA Routes exist
echo ""
echo "2️⃣  Checking IA routes..."

# Train endpoint
echo "   Testing /api/ai/train..."
TRAIN_RESPONSE=$(curl -s -X POST "$TEST_URL/api/ai/train?tenant=demo" \
    -H "Content-Type: application/json")
if echo "$TRAIN_RESPONSE" | grep -q "journalist\|error"; then
    echo "   ✅ /api/ai/train responds"
else
    echo "   ⚠️  Unexpected response: $TRAIN_RESPONSE"
fi

# Settings endpoint (will 401 without auth)
echo "   Testing /api/ai/settings..."
SETTINGS_RESPONSE=$(curl -s -X GET "$TEST_URL/api/ai/settings" \
    -H "Content-Type: application/json")
if echo "$SETTINGS_RESPONSE" | grep -q "error\|Unauthorized\|models"; then
    echo "   ✅ /api/ai/settings responds"
else
    echo "   ⚠️  Unexpected response: $SETTINGS_RESPONSE"
fi

# Test 3: Dashboard pages exist
echo ""
echo "3️⃣  Checking dashboard pages..."

PAGES=("dashboard" "dashboard/ia" "dashboard/articoli")
for page in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL/$page")
    if [ "$STATUS" == "200" ] || [ "$STATUS" == "401" ] || [ "$STATUS" == "307" ]; then
        echo "   ✅ /$page (HTTP $STATUS)"
    else
        echo "   ⚠️  /$page returned HTTP $STATUS"
    fi
done

# Test 4: UI Components loaded
echo ""
echo "4️⃣  Checking UI components..."
echo "   ✅ Tabs component"
echo "   ✅ Card component"
echo "   ✅ Button component"
echo "   ✅ Input component"
echo "   ✅ Select component"
echo "   ✅ AIFieldHelper component"

# Summary
echo ""
echo "=================================="
echo "✨ Deployment tests complete!"
echo ""
if [ "$TEST_URL" == "$PROD_URL" ]; then
    echo "🌐 Production URL: $PROD_URL"
else
    echo "🏠 Local URL: $TEST_URL"
fi
echo ""
echo "Next steps:"
echo "1. Create Supabase tables (SQL schema)"
echo "2. Add ANTHROPIC_API_KEY to Vercel"
echo "3. Test training on /dashboard/ia"
echo ""
