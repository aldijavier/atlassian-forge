# 🎯 Quick Start: Moving to Company Bitbucket

## TL;DR - Fast Track

```bash
# 1. Prepare your code
cd /Users/mekari/Documents/Projects/epic-breakdown/epic-breakdown
./prepare-for-bitbucket.sh

# 2. Clone company repo
cd ~/Documents/Projects
git clone https://bitbucket.org/terbang-ventures/jira-forge.git
cd jira-forge

# 3. Create structure
mkdir -p apps
mkdir -p docs
mkdir -p scripts

# 4. Copy your app
cp -r /Users/mekari/Documents/Projects/epic-breakdown/epic-breakdown ./apps/epic-breakdown

# 5. Create repo README
cat > README.md << 'EOF'
# Terbang Ventures - Jira Forge Apps

Collection of Forge apps for Terbang Ventures' Jira Cloud instance.

## Apps

- **[epic-breakdown](./apps/epic-breakdown/)** - Enhanced Epic breakdown view

## Structure

- `apps/` - Individual Forge applications
- `docs/` - Shared documentation
- `scripts/` - Deployment and utility scripts

## Getting Started

Each app has its own README. See app directory for specific instructions.
EOF

# 6. Copy deployment script
cp ./apps/epic-breakdown/deploy-app-script.sh ./scripts/deploy-app.sh
chmod +x ./scripts/deploy-app.sh

# 7. Commit and push
git add .
git commit -m "Add Epic Breakdown Forge app

- Production-ready Epic breakdown viewer
- Inline editing capabilities
- Error handling and validation
- Ready for company deployment"
git push origin main

# 8. Set up for company deployment
# (On your machine or CI/CD)
cd apps/epic-breakdown
forge login  # Login to company Atlassian account
forge register  # Creates new app ID for company
```

## Important: Before Company Deployment

### 1. Create New App ID

Your personal app ID won't work for company Jira. You need to create a new one:

**Option A: Using Forge CLI**
```bash
cd ~/Documents/Projects/jira-forge/apps/epic-breakdown
forge login  # Use company credentials
forge register
# This will update manifest.yml with new app ID
```

**Option B: Developer Console**
1. Go to https://developer.atlassian.com/console/myapps/
2. Login with company account
3. Click "Create" > "Custom app"
4. Copy the app ID
5. Update `manifest.yml`:
   ```yaml
   app:
     id: ari:cloud:ecosystem::app/NEW-COMPANY-APP-ID
   ```

### 2. Verify Custom Field IDs

Company Jira may have different field IDs:

```bash
# Update in apps/epic-breakdown/src/resolvers/index.js
const CUSTOM_FIELDS = {
  STORY_POINTS: 'customfield_10005',  # ← Verify
  SPRINT: 'customfield_10007'          # ← Verify
};
```

**How to find:**
- Jira Settings > Issues > Custom fields > Click field > Check URL
- Or ask Jira admin

### 3. Deploy to Company

```bash
cd ~/Documents/Projects/jira-forge/apps/epic-breakdown

# Build
npm install
cd static/epic-breakdown && npm install && npm run build && cd ../..

# Deploy to development first
forge deploy --non-interactive -e development

# Install on company Jira
forge install --non-interactive \
  --site terbangventures.atlassian.net \  # ← Your company URL
  --product jira \
  --environment development

# Test thoroughly, then deploy to production
forge deploy --non-interactive -e production
forge install --non-interactive --upgrade \
  --site terbangventures.atlassian.net \
  --product jira \
  --environment production
```

## Multi-App Repository Structure

Your Bitbucket repo will look like this:

```
bitbucket.org/terbang-ventures/jira-forge/
├── README.md
├── .gitignore
├── apps/
│   ├── epic-breakdown/           # ← Your first app
│   │   ├── manifest.yml
│   │   ├── package.json
│   │   ├── src/
│   │   ├── static/
│   │   └── README-PRODUCTION.md
│   │
│   └── future-app/               # ← Add more apps here
│       ├── manifest.yml
│       └── ...
│
├── docs/
│   ├── deployment-guide.md
│   └── development-standards.md
│
└── scripts/
    └── deploy-app.sh             # Shared deployment script
```

## Benefits of This Structure

✅ **Scalable** - Easy to add new Forge apps  
✅ **Organized** - Each app is isolated  
✅ **Shared** - Common scripts and docs  
✅ **Clear** - Team knows where everything is  
✅ **Version Control** - Track all apps together  

## Adding Future Apps

When you create more Forge apps:

```bash
cd ~/Documents/Projects/jira-forge/apps

# Create new app
forge create -t jira-issue-panel-ui-kit my-new-app
cd my-new-app

# Develop...

# When ready, just commit
git add .
git commit -m "Add my-new-app"
git push
```

## Team Collaboration

### Who Needs What

**Developers:**
- Git access to Bitbucket
- Forge CLI installed
- Company Atlassian credentials

**For Deployment:**
- Access to Atlassian Developer Console
- Admin rights in company Jira (for installation)

**For Development Only:**
- Git access sufficient
- Can test with `forge tunnel` without deployment rights

### Deployment Workflow

```
Developer → Code → PR → Review → Merge → Deploy (by authorized person)
```

## Checklist

- [ ] Run `prepare-for-bitbucket.sh`
- [ ] Clone Bitbucket repo
- [ ] Copy app to `apps/epic-breakdown/`
- [ ] Create repo README
- [ ] Push to Bitbucket
- [ ] Create new app ID for company
- [ ] Update manifest.yml
- [ ] Verify custom field IDs
- [ ] Deploy to development
- [ ] Test thoroughly
- [ ] Deploy to production
- [ ] Document for team

## Need Help?

See these detailed guides:
- `COMPANY-DEPLOYMENT-GUIDE.md` - Complete step-by-step
- `REPOSITORY-SETUP.md` - Multi-app structure details
- `BITBUCKET-SETUP.md` - Bitbucket-specific setup
- `README-PRODUCTION.md` - App deployment guide

## Quick Commands Reference

```bash
# Prepare for Bitbucket
./prepare-for-bitbucket.sh

# Deploy any app
cd apps/APP_NAME
forge deploy --non-interactive -e development

# Or use shared script
./scripts/deploy-app.sh epic-breakdown development

# View logs
cd apps/APP_NAME
forge logs -e development --follow
```

---

**You're all set!** 🚀

Your app is ready to be pushed to Bitbucket and deployed to company Jira.
