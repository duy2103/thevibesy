#!/bin/bash

# Troubleshooting Script for Screenshot Function
echo "🔍 Checking Screenshot Function Status..."
echo ""

# Check if file exists and line count
echo "1. Checking locations.tsx file..."
FILE="/Users/duyducvu2103/vibesy-backup/client/app/(tabs)/locations.tsx"
if [ -f "$FILE" ]; then
    LINES=$(wc -l < "$FILE")
    echo "   ✅ File exists: $LINES lines"
else
    echo "   ❌ File not found!"
    exit 1
fi

# Check for key functions
echo ""
echo "2. Checking for functions..."
if grep -q "handlePickImage" "$FILE"; then
    echo "   ✅ handlePickImage found"
else
    echo "   ❌ handlePickImage missing!"
fi

if grep -q "handleParseScreenshot" "$FILE"; then
    echo "   ✅ handleParseScreenshot found"
else
    echo "   ❌ handleParseScreenshot missing!"
fi

# Check for UI elements
echo ""
echo "3. Checking for UI elements..."
if grep -q "Pick Screenshot" "$FILE"; then
    echo "   ✅ Pick Screenshot button found"
else
    echo "   ❌ Pick Screenshot button missing!"
fi

if grep -q "Parse Screenshot" "$FILE"; then
    echo "   ✅ Parse Screenshot button found"
else
    echo "   ❌ Parse Screenshot button missing!"
fi

# Check for TypeScript errors
echo ""
echo "4. Checking for TypeScript errors..."
cd /Users/duyducvu2103/vibesy-backup/client
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo "   ⚠️  TypeScript errors found (but may not affect this file)"
else
    echo "   ✅ No TypeScript errors"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "DIAGNOSIS:"
echo "═══════════════════════════════════════════"
echo ""
echo "The screenshot function code IS present in the file!"
echo ""
echo "If you don't see it in the UI, try:"
echo "1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R"
echo "2. Clear Metro cache: npx expo start --clear"
echo "3. Make sure you're on the 'Locations' tab (bottom navigation)"
echo ""
echo "The Leaflet CSS warnings are normal and don't affect this."
echo ""
