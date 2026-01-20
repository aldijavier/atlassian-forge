# Deploying Epic Breakdown to Company Jira

## Step-by-Step Migration Guide

### Phase 1: Prepare Your Code for Bitbucket

#### 1. Create .gitignore for the app

Create `/apps/epic-breakdown/.gitignore`:

```gitignore
# Node modules
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
build/
dist/
static/*/build/

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

# OS
.DS_Store
Thumbs.db

# Forge specific
.forge/
*.log

# Package locks (optional - discuss with team)
# package-lock.json
# static/*/package-lock.json
```

#### 2. Clean up sensitive data

Before pushing, ensure no sensitive data in:
- `manifest.yml` - The app ID is okay to commit
- No API keys or tokens
- No customer-specific data in code

#### 3. Update manifest.yml for company deployment

You'll need to create a NEW app in your company's Atlassian account:

**Current (your personal):**
```yaml
app:
  id: ari:cloud:ecosystem::app/a4d49205-3afe-4ef6-a5ee-b03822e5f0ea
```

**For company (will be generated):**
```yaml
app:
  id: ari:cloud:ecosystem::app/COMPANY-APP-ID-HERE
```

---

### Phase 2: Set Up Company Forge App

#### 1. Create new app for company Atlassian account

On a team member's machine with company Atlassian access:

```bash
# Login to company Atlassian account
forge login

# Register a new app (don't use forge create, as code already exists)
# Instead, we'll register the existing code as a new app
cd /path/to/epic-breakdown
forge register
```

When prompted:
- **App name**: `epic-breakdown` (or `epic-breakdown-terbang-ventures`)
- **Environment**: Choose your company's Atlassian organization

This will generate a NEW app ID and update your `manifest.yml`.

#### 2. Alternative: Manual app ID update

If you prefer to control the process:

1. In your company's Atlassian Developer Console: https://developer.atlassian.com/console/myapps/
2. Create a new app
3. Copy the app ID (format: `ari:cloud:ecosystem::app/XXXXXXXX`)
4. Update `manifest.yml` with the company app ID

---

### Phase 3: Push to Bitbucket

#### 1. Create the repository structure

```bash
# Clone your company repo
cd ~/Documents/Projects
git clone https://bitbucket.org/terbang-ventures/jira-forge.git
cd jira-forge

# Create apps directory
mkdir -p apps
cd apps

# Copy your epic-breakdown app
cp -r ~/Documents/Projects/epic-breakdown/epic-breakdown ./epic-breakdown

# Clean up the copied directory
cd epic-breakdown
rm -rf node_modules
rm -rf static/epic-breakdown/node_modules
rm -rf static/epic-breakdown/build

# Create app-specific .gitignore
cat > .gitignore << 'EOF'
node_modules/
static/*/node_modules/
static/*/build/
.forge-env
.DS_Store
*.log
EOF
```

#### 2. Create repository README

```bash
cd ~/Documents/Projects/jira-forge
```

Create `README.md`:

```markdown
# Terbang Ventures - Jira Forge Apps

This repository contains all Forge apps for Terbang Ventures' Jira Cloud instance.

## Apps

- **[epic-breakdown](./apps/epic-breakdown/)** - Enhanced Epic breakdown view with inline editing
- *(Add more apps here as you create them)*

## Getting Started

See [docs/deployment-guide.md](./docs/deployment-guide.md) for deployment instructions.

## Repository Structure

```
apps/
  epic-breakdown/     - Epic Breakdown app
  another-app/        - Future apps
docs/                 - Shared documentation
scripts/              - Deployment scripts
```

## Development

Each app has its own README with specific instructions.

## Deployment

Apps are deployed independently. See each app's README for deployment instructions.
```

#### 3. Create deployment documentation

```bash
mkdir -p docs
```

Create `docs/deployment-guide.md` with company-specific instructions.

#### 4. Commit and push

```bash
cd ~/Documents/Projects/jira-forge

# Add all files
git add .

# Commit
git commit -m "Add Epic Breakdown app

- Initial import of Epic Breakdown Forge app
- Production-ready with error handling and security fixes
- Configured for company deployment"

# Push to Bitbucket
git push origin main  # or master, depending on your default branch
```

---

### Phase 4: Deploy to Company Jira

#### On CI/CD or Team Machine

```bash
# Clone the repo
git clone https://bitbucket.org/terbang-ventures/jira-forge.git
cd jira-forge/apps/epic-breakdown

# Login to company Forge account
forge login
# Follow prompts to authenticate with company Atlassian account

# Install dependencies
npm install
cd static/epic-breakdown
npm install
cd ../..

# Build frontend
cd static/epic-breakdown
npm run build
cd ../..

# Validate
forge lint

# Deploy to development first
forge deploy --non-interactive -e development

# Install on company Jira site
forge install --non-interactive \
  --site YOUR_COMPANY.atlassian.net \
  --product jira \
  --environment development
```

#### After Testing, Deploy to Production

```bash
cd jira-forge/apps/epic-breakdown

# Deploy to production
forge deploy --non-interactive -e production

# Install/upgrade on production
forge install --non-interactive --upgrade \
  --site YOUR_COMPANY.atlassian.net \
  --product jira \
  --environment production
```

---

### Phase 5: Team Collaboration Setup

#### 1. Document custom field IDs for company Jira

Update `apps/epic-breakdown/src/resolvers/index.js`:

```javascript
const CUSTOM_FIELDS = {
  STORY_POINTS: 'customfield_10005',  // ← Verify this for company Jira
  SPRINT: 'customfield_10007'          // ← Verify this for company Jira
};
```

**To find your company's field IDs:**
```bash
# Use Forge to query
forge install --non-interactive \
  --site YOUR_COMPANY.atlassian.net \
  --product jira

# Then in a temporary resolver, call:
# GET /rest/api/3/field
```

Or go to: Jira Settings > Issues > Custom fields > Click field > Check URL

#### 2. Set up CI/CD (optional but recommended)

Create `.bitbucket-pipelines.yml` in repo root:

```yaml
image: node:18

pipelines:
  branches:
    main:
      - step:
          name: Deploy Epic Breakdown to Development
          script:
            - cd apps/epic-breakdown
            - npm install
            - cd static/epic-breakdown && npm install && npm run build && cd ../..
            - npx @forge/cli@latest deploy --non-interactive -e development
          artifacts:
            - apps/epic-breakdown/static/epic-breakdown/build/**

    production:
      - step:
          name: Deploy Epic Breakdown to Production
          script:
            - cd apps/epic-breakdown
            - npm install
            - cd static/epic-breakdown && npm install && npm run build && cd ../..
            - npx @forge/cli@latest deploy --non-interactive -e production
```

**Note**: You'll need to set up Forge authentication in Bitbucket Pipelines using secured environment variables.

---

### Phase 6: Team Access & Permissions

#### 1. Add team members to Atlassian Developer Console

1. Go to https://developer.atlassian.com/console/myapps/
2. Select your organization
3. Go to Settings > Members
4. Add team members with appropriate roles

#### 2. Document who can deploy

Create `docs/deployment-permissions.md`:

```markdown
# Deployment Permissions

## Production Deployments
- Approved by: [Tech Lead, DevOps]
- Deployed by: [DevOps Team]

## Development Deployments
- Any developer can deploy to development
- Requires code review

## Access
- Forge CLI access: [List of people]
- Atlassian Developer Console: [List of people]
```

---

## Quick Commands Summary

```bash
# Clone and setup
git clone https://bitbucket.org/terbang-ventures/jira-forge.git
cd jira-forge/apps/epic-breakdown

# Build and deploy
npm install
cd static/epic-breakdown && npm install && npm run build && cd ../..
forge lint
forge deploy --non-interactive -e development

# Install on company Jira
forge install --non-interactive \
  --site YOUR_COMPANY.atlassian.net \
  --product jira \
  --environment development
```

---

## Troubleshooting

### "App already exists" error
- You need to create a new app ID for the company account
- Run `forge register` or create in Developer Console

### Permission errors
- Ensure you're logged into the company Atlassian account: `forge login`
- Check you have deployment permissions in Developer Console

### Custom fields not working
- Update `CUSTOM_FIELDS` in `src/resolvers/index.js` with company Jira field IDs

### Different Jira site
- Replace `YOUR_COMPANY.atlassian.net` with actual site URL
- Can be found in Jira URL bar

---

## Next Steps

1. ☐ Create `.gitignore` files
2. ☐ Clean sensitive data
3. ☐ Push to Bitbucket
4. ☐ Create new app in company Atlassian account
5. ☐ Update manifest.yml with company app ID
6. ☐ Verify custom field IDs for company Jira
7. ☐ Deploy to development
8. ☐ Test thoroughly
9. ☐ Deploy to production
10. ☐ Document for team
