#!/bin/bash

# Test script per IA APIs (localhost)

BASE_URL="http://localhost:3000"

echo "🧪 Testing IA APIs..."
echo ""

# Test 1: Test settings GET (require auth - will fail without session)
echo "1️⃣  Testing GET /api/ai/settings (no auth - expect 401)"
curl -s -X GET "$BASE_URL/api/ai/settings" \
  -H "Content-Type: application/json" | jq '.' || echo "Expected failure"
echo ""

# Test 2: Test training endpoint (no auth required for demo)
echo "2️⃣  Testing POST /api/ai/train (demo tenant)"
curl -s -X POST "$BASE_URL/api/ai/train?tenant=demo" \
  -H "Content-Type: application/json" | jq '.' || echo "Train API test"
echo ""

# Test 3: Test generate endpoint (requires ANTHROPIC_API_KEY)
echo "3️⃣  Testing POST /api/ai/generate (requires API key)"
curl -s -X POST "$BASE_URL/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "title",
    "fieldType": "title",
    "currentValue": "",
    "style": "auto"
  }' | jq '.' || echo "Generate API test"
echo ""

echo "✅ API tests complete"
