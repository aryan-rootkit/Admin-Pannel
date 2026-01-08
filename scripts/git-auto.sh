#!/bin/bash

# Git Auto Script: Stage, Commit, Push, Pull
# Usage: ./scripts/git-auto.sh "commit message"

COMMIT_MESSAGE="${1:-Auto commit: $(date +'%Y-%m-%d %H:%M:%S')}"

echo "🔄 Auto Git Workflow Started..."
echo "📝 Commit Message: $COMMIT_MESSAGE"
echo ""

# Stage all changes
echo "1️⃣  Staging all changes..."
git add -A
STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Commit
echo "2️⃣  Committing changes..."
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo "❌ Commit failed"
    exit 1
fi

# Pull latest changes
echo "3️⃣  Pulling latest changes..."
git pull --rebase

if [ $? -ne 0 ]; then
    echo "⚠️  Pull had conflicts or errors, but continuing..."
fi

# Push
echo "4️⃣  Pushing to remote..."
git push

if [ $? -eq 0 ]; then
    echo "✅ All done! Changes committed and pushed."
else
    echo "❌ Push failed"
    exit 1
fi
