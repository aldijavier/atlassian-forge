#!/bin/bash

# Epic Breakdown - Quick Deployment Script
# This script helps deploy your Forge app step by step

set -e  # Exit on error

echo "🚀 Epic Breakdown - Deployment Helper"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "manifest.yml" ]; then
    echo "❌ Error: manifest.yml not found. Please run this script from the app root directory."
    exit 1
fi

print_success "Found manifest.yml"
echo ""

# Step 1: Verify custom field configuration
print_warning "IMPORTANT: Have you verified your custom field IDs?"
echo "Edit src/resolvers/index.js and update CUSTOM_FIELDS if needed:"
echo "  - STORY_POINTS: customfield_10005"
echo "  - SPRINT: customfield_10007"
echo ""
read -p "Press Enter to continue after verifying, or Ctrl+C to abort..."
echo ""

# Step 2: Install dependencies
print_step "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"
echo ""

print_step "Installing frontend dependencies..."
cd static/epic-breakdown
npm install
print_success "Frontend dependencies installed"
echo ""

# Step 3: Build frontend
print_step "Building frontend..."
npm run build
cd ../..
print_success "Frontend build complete"
echo ""

# Step 4: Lint
print_step "Running Forge lint..."
forge lint
print_success "Lint passed"
echo ""

# Step 5: Ask for environment
echo "Which environment do you want to deploy to?"
echo "1) development"
echo "2) staging"
echo "3) production"
read -p "Enter choice (1-3): " env_choice

case $env_choice in
    1) ENVIRONMENT="development" ;;
    2) ENVIRONMENT="staging" ;;
    3) ENVIRONMENT="production" ;;
    *) echo "Invalid choice. Defaulting to development"; ENVIRONMENT="development" ;;
esac

print_success "Deploying to: $ENVIRONMENT"
echo ""

# Step 6: Deploy
print_step "Deploying to $ENVIRONMENT environment..."
forge deploy --non-interactive -e $ENVIRONMENT
print_success "Deployment complete!"
echo ""

# Step 7: Ask about installation
read -p "Do you want to install/upgrade on a site? (y/n): " install_choice

if [[ $install_choice == "y" || $install_choice == "Y" ]]; then
    read -p "Enter your Jira site URL (e.g., mycompany.atlassian.net): " SITE_URL
    
    echo ""
    echo "Choose installation type:"
    echo "1) New installation"
    echo "2) Upgrade existing installation"
    read -p "Enter choice (1-2): " install_type
    
    if [[ $install_type == "2" ]]; then
        print_step "Upgrading app on $SITE_URL..."
        forge install --non-interactive --upgrade --site $SITE_URL --product jira --environment $ENVIRONMENT
    else
        print_step "Installing app on $SITE_URL..."
        forge install --non-interactive --site $SITE_URL --product jira --environment $ENVIRONMENT
    fi
    
    print_success "Installation complete!"
    echo ""
fi

# Final message
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Deployment Successful!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Navigate to any Epic in your Jira instance"
echo "2. Look for the 'Epic Breakdown' panel"
echo "3. Test the functionality:"
echo "   - View Stories and linked Tasks"
echo "   - Create new Tasks"
echo "   - Edit summaries and story points"
echo "   - Change assignees"
echo ""
echo "To view logs:"
echo "  forge logs -e $ENVIRONMENT --follow"
echo ""
echo "For more information, see README-PRODUCTION.md"
echo ""
