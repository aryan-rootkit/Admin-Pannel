# 🔄 Automatic Git Workflow Setup

## ✅ What's Configured

### 1. **Pre-Commit Hook** (`.git/hooks/pre-commit`)
- Automatically stages all changes before commit
- Runs automatically when you run `git commit`

### 2. **Post-Commit Hook** (`.git/hooks/post-commit`)
- Automatically pushes to remote after commit
- Runs automatically after successful commit

### 3. **Git Auto Script** (`scripts/git-auto.sh`)
- Complete workflow: stage → commit → pull → push
- Can be run manually or via npm script

## 🚀 Usage

### Option 1: Normal Git Commands (Auto-Enabled)
```bash
# Just commit normally - hooks will auto-stage and push
git commit -m "Your commit message"
# ✅ Automatically stages all changes
# ✅ Automatically pushes after commit
```

### Option 2: Use Auto Script
```bash
# Via npm script
npm run commit "Your commit message"

# Or directly
./scripts/git-auto.sh "Your commit message"

# Or with default message
npm run commit
```

### Option 3: Git Alias (Recommended)
```bash
# Add to your ~/.gitconfig or run:
git config --global alias.ac '!bash scripts/git-auto.sh'

# Then use:
git ac "Your commit message"
```

## 📋 What Happens Automatically

When you run `git commit`:
1. ✅ **Pre-commit hook** stages all changes
2. ✅ Your commit is created
3. ✅ **Post-commit hook** pushes to remote

When you run `npm run commit`:
1. ✅ Stages all changes
2. ✅ Commits with message
3. ✅ Pulls latest changes (rebase)
4. ✅ Pushes to remote

## 🔧 Disable Auto-Push (if needed)

To disable automatic push:
```bash
chmod -x .git/hooks/post-commit
```

To re-enable:
```bash
chmod +x .git/hooks/post-commit
```

## 📝 Example

```bash
# Simple commit (hooks handle staging and pushing)
git commit -m "Update dashboard design"

# Or use auto script
npm run commit "Update dashboard design"

# Or use git alias
git ac "Update dashboard design"
```

All methods will:
- Stage all changes
- Commit with message
- Push to remote
