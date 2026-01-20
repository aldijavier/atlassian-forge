#!/bin/bash

# Quick Deploy Script for Specific App
# Usage: ./scripts/deploy-app.sh epic-breakdown development

set -e

if [ $# -lt 2 ]; then
    echo "Usage: ./scripts/deploy-app.sh <app-name> <environment>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy-app.sh epic-breakdown development"
    echo "  ./scripts/deploy-app.sh epic-breakdown production"
    echo ""
    echo "Available apps:"
    ls -1 apps/ 2>/dev/null | grep -v README || echo "  (none yet)"
    exit 1
fi

APP_NAME=$1
ENVIRONMENT=$2
APP_DIR="apps/$APP_NAME"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo "🚀 Deploying $APP_NAME to $ENVIRONMENT"
echo "======================================="
echo ""

# Check if app exists
if [ ! -d "$APP_DIR" ]; then
    echo "Error: App directory '$APP_DIR' not found"
    exit 1
fi

cd "$APP_DIR"

# Check for manifest
if [ ! -f "manifest.yml" ]; then
    echo "Error: manifest.yml not found in $APP_DIR"
    exit 1
fi

# Install backend dependencies
print_step "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

# Check if there's a static directory (Custom UI)
if [ -d "static" ]; then
    for static_app in static/*; do
        if [ -d "$static_app" ] && [ -f "$static_app/package.json" ]; then
            print_step "Building frontend: $(basename $static_app)..."
            cd "$static_app"
            npm install
            npm run build
            cd ../..
            print_success "Frontend built successfully"
        fi
    done
fi

# Lint
print_step "Running forge lint..."
forge lint
print_success "Lint passed"

# Deploy
print_step "Deploying to $ENVIRONMENT..."
forge deploy --non-interactive -e "$ENVIRONMENT"
print_success "Deployment complete!"

echo ""
echo "======================================="
print_success "Deployment Successful!"
echo "======================================="
echo ""
echo "App: $APP_NAME"
echo "Environment: $ENVIRONMENT"
echo ""
echo "To install on a Jira site:"
echo "  forge install --non-interactive --site YOUR_SITE.atlassian.net --product jira -e $ENVIRONMENT"
echo ""
echo "To upgrade existing installation:"
echo "  forge install --non-interactive --upgrade --site YOUR_SITE.atlassian.net --product jira -e $ENVIRONMENT"
echo ""
