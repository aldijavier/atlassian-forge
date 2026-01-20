#!/bin/bash

# Prepare Epic Breakdown for Bitbucket Repository
# This script helps prepare your code for pushing to the company repo

set -e

echo "🚀 Epic Breakdown - Bitbucket Preparation Script"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$SCRIPT_DIR"

print_warning "This script will prepare your app for Bitbucket"
print_warning "It will create necessary files and clean up build artifacts"
echo ""

read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Create .gitignore
print_step "Creating .gitignore..."
cat > "$APP_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
build/
dist/
static/*/build/
static/*/node_modules/

# Environment files
.env
.env.local
.forge-env

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Forge specific
.forge/
*.log

# Optional: Uncomment if you want to ignore lock files
# package-lock.json
# static/*/package-lock.json
EOF
print_success ".gitignore created"

# Step 2: Clean build artifacts
print_step "Cleaning build artifacts..."

# Remove node_modules
if [ -d "$APP_DIR/node_modules" ]; then
    rm -rf "$APP_DIR/node_modules"
    print_success "Removed root node_modules"
fi

if [ -d "$APP_DIR/static/epic-breakdown/node_modules" ]; then
    rm -rf "$APP_DIR/static/epic-breakdown/node_modules"
    print_success "Removed frontend node_modules"
fi

# Remove build directory
if [ -d "$APP_DIR/static/epic-breakdown/build" ]; then
    rm -rf "$APP_DIR/static/epic-breakdown/build"
    print_success "Removed frontend build directory"
fi

# Remove .DS_Store files
find "$APP_DIR" -name ".DS_Store" -delete 2>/dev/null || true
print_success "Removed .DS_Store files"

# Remove log files
find "$APP_DIR" -name "*.log" -delete 2>/dev/null || true
print_success "Removed log files"

# Step 3: Create repository structure guide
print_step "Creating BITBUCKET-SETUP.md guide..."
cat > "$APP_DIR/BITBUCKET-SETUP.md" << 'EOF'
# Setting Up in Bitbucket Repository

## Repository Structure

This app should be placed in your Bitbucket repo as:

```
jira-forge/
└── apps/
    └── epic-breakdown/     ← This directory
        ├── manifest.yml
        ├── package.json
        ├── README-PRODUCTION.md
        └── ...
```

## Steps to Add to Bitbucket

### 1. Clone your company repo (if not already cloned)

```bash
cd ~/Documents/Projects
git clone https://bitbucket.org/terbang-ventures/jira-forge.git
cd jira-forge
```

### 2. Create apps directory

```bash
mkdir -p apps
```

### 3. Copy this app

```bash
# From outside the jira-forge directory
cp -r /path/to/epic-breakdown ./jira-forge/apps/epic-breakdown
```

### 4. Initialize git (if repo is new)

```bash
cd jira-forge
git add .
git commit -m "Add Epic Breakdown Forge app"
git push origin main
```

### 5. Update manifest for company deployment

**IMPORTANT**: Before deploying to company Jira, you need to:

1. Create a new Forge app in company's Atlassian account
2. Get the new app ID
3. Update `manifest.yml`:

```yaml
app:
  id: ari:cloud:ecosystem::app/YOUR-COMPANY-APP-ID-HERE
```

## Creating New App ID for Company

```bash
# Login to company account
forge login

# In the app directory
cd apps/epic-breakdown

# Register as new app (will update manifest.yml)
forge register
```

Or manually create at: https://developer.atlassian.com/console/myapps/

## Deploy to Company Jira

```bash
cd apps/epic-breakdown

# Install dependencies
npm install
cd static/epic-breakdown && npm install && npm run build && cd ../..

# Deploy
forge deploy --non-interactive -e development

# Install
forge install --non-interactive \
  --site YOUR_COMPANY.atlassian.net \
  --product jira \
  --environment development
```

## Don't Forget

- [ ] Update custom field IDs in `src/resolvers/index.js` for company Jira
- [ ] Test in development environment first
- [ ] Update README with company-specific info
- [ ] Document deployment process for team
EOF
print_success "BITBUCKET-SETUP.md created"

# Step 4: Check for sensitive data
print_step "Checking for potential sensitive data..."

SENSITIVE_FOUND=false

# Check for common sensitive patterns
if grep -r "password" "$APP_DIR" --exclude-dir=node_modules --exclude="*.md" -i 2>/dev/null | grep -v "# password" > /dev/null; then
    print_warning "Found 'password' in code - please review"
    SENSITIVE_FOUND=true
fi

if grep -r "secret" "$APP_DIR" --exclude-dir=node_modules --exclude="*.md" -i 2>/dev/null | grep -v "# secret" > /dev/null; then
    print_warning "Found 'secret' in code - please review"
    SENSITIVE_FOUND=true
fi

if grep -r "token" "$APP_DIR" --exclude-dir=node_modules --exclude="*.md" -i 2>/dev/null | grep -v "nextPageToken" | grep -v "# token" > /dev/null; then
    print_warning "Found 'token' in code - please review"
    SENSITIVE_FOUND=true
fi

if [ "$SENSITIVE_FOUND" = false ]; then
    print_success "No obvious sensitive data found"
fi

# Step 5: Summary
echo ""
echo "==========================================="
print_success "Preparation Complete!"
echo "==========================================="
echo ""
echo "Your app is ready to push to Bitbucket!"
echo ""
echo "Files created:"
echo "  ✓ .gitignore"
echo "  ✓ BITBUCKET-SETUP.md"
echo ""
echo "Cleaned:"
echo "  ✓ node_modules directories"
echo "  ✓ build directories"
echo "  ✓ .DS_Store files"
echo "  ✓ log files"
echo ""
echo "Next steps:"
echo "1. Review BITBUCKET-SETUP.md"
echo "2. Review COMPANY-DEPLOYMENT-GUIDE.md"
echo "3. Copy this directory to your Bitbucket repo"
echo "4. Create new app ID for company account"
echo "5. Deploy to company Jira"
echo ""
echo "Copy command example:"
echo "  cp -r $APP_DIR ~/path/to/jira-forge/apps/epic-breakdown"
echo ""
