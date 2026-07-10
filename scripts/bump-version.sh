#!/bin/bash
# Bump Nexart version (SemVer)
# Usage: npm run bump-version 0.8.0

set -e

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "❌ Usage: npm run bump-version <version>"
  echo "   Example: npm run bump-version 0.8.0"
  exit 1
fi

# Validate semver format
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Invalid version format. Use MAJOR.MINOR.PATCH (e.g., 0.8.0)"
  exit 1
fi

CURRENT=$(grep '"version"' package.json | head -1 | grep -o '[0-9]*\.[0-9]*\.[0-9]*')

echo "📦 Bumping version: $CURRENT → $NEW_VERSION"

# Update package.json
sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json

# Also update .env.local if it exists
if [ -f .env.local ]; then
  sed -i '' "s/NEXT_PUBLIC_VERSION=.*/NEXT_PUBLIC_VERSION=$NEW_VERSION/" .env.local || \
  echo "NEXT_PUBLIC_VERSION=$NEW_VERSION" >> .env.local
fi

# Git commit & tag
git add package.json .env.local 2>/dev/null || git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release $NEW_VERSION"

echo "✅ Version bumped"
echo "📤 Push with: git push origin main --tags"
