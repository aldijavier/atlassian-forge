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
