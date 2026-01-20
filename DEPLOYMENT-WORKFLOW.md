# Deployment Workflow & PR Process

## 🎯 Overview

This repository uses a **PR-based deployment workflow** to ensure all changes are reviewed before deployment to Jira.

## 🔒 Branch Protection & Review Requirements

### Required Setup in Bitbucket

1. **Go to Repository Settings > Branch permissions**
2. **Protect `main` branch:**
   - ✅ Prevent deletion
   - ✅ Require a minimum number of approvals: **1**
   - ✅ Require passing builds
   - ✅ Prevent changes without a pull request
   - ✅ Only allow merge commits (no force push)

3. **Protect `develop` branch (if using):**
   - ✅ Prevent deletion
   - ✅ Require passing builds
   - ✅ Require pull request reviews

## 📋 Deployment Pipeline Flow

```
┌─────────────────┐
│ Feature Branch  │
│   (your work)   │
└────────┬────────┘
         │
         │ 1. Create PR
         ▼
┌─────────────────┐
│   Pull Request  │◄─── Automatic: Lint & Validate
│   (to develop)  │     - forge lint
└────────┬────────┘     - Build frontend
         │              - Run checks
         │
         │ 2. Code Review & Approval Required
         ▼
┌─────────────────┐
│ Develop Branch  │◄─── Automatic: Deploy to Development
│  (merged PR)    │     - Auto-deploy after merge
└────────┬────────┘
         │
         │ 3. Create PR to main (after testing in dev)
         ▼
┌─────────────────┐
│   Pull Request  │◄─── Automatic: Lint & Validate
│   (to main)     │
└────────┬────────┘
         │
         │ 4. Code Review & Approval Required
         ▼
┌─────────────────┐
│   Main Branch   │◄─── Manual Trigger: Deploy to Production
│  (production)   │     - Requires manual approval
└─────────────────┘
```

## 🔄 Standard Workflow

### Step 1: Create Feature Branch

```bash
# Always start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Step 2: Make Changes & Commit

```bash
# Make your changes to the code
# ...

# Commit with descriptive messages
git add .
git commit -m "feat: add new Epic Breakdown feature"
git push origin feature/your-feature-name
```

### Step 3: Create Pull Request

1. Go to Bitbucket repository
2. Click **Create pull request**
3. Set:
   - **Source**: `feature/your-feature-name`
   - **Destination**: `develop`
4. Fill in:
   - **Title**: Clear description of changes
   - **Description**: What changed and why
5. Click **Create pull request**

**✅ Pipeline automatically runs:**
- Lints the code
- Validates manifest.yml
- Builds frontend
- Checks for errors

### Step 4: Code Review

- **Wait for approval** from at least 1 team member
- Address any feedback or requested changes
- Pipeline must pass (green checkmark)

### Step 5: Merge to Develop

Once approved:
1. Click **Merge** in Bitbucket
2. **✅ Automatic deployment to Development environment**
3. Test your changes in dev Jira instance

### Step 6: Deploy to Production

When ready for production:

```bash
# Create PR from develop to main
git checkout main
git pull origin main
git checkout -b release/version-x.y.z
git merge develop
git push origin release/version-x.y.z
```

1. Create PR: `release/version-x.y.z` → `main`
2. Get approval from tech lead/senior dev
3. Merge to `main`
4. **⚠️ Manual Step**: Go to Bitbucket Pipelines
5. Click **Deploy to Production** (manual approval required)

## 🚨 Emergency Hotfix Process

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make the fix
# ...

git add .
git commit -m "fix: critical bug in production"
git push origin hotfix/critical-bug-fix
```

1. Create PR: `hotfix/critical-bug-fix` → `main`
2. Get expedited review
3. Merge and manually deploy to production
4. **Don't forget**: Merge hotfix back to `develop`

```bash
git checkout develop
git merge main
git push origin develop
```

## 🔧 Pipeline Configuration

### Environment Variables Required

Set these in **Bitbucket Repository Settings > Pipelines > Repository variables**:

1. **FORGE_EMAIL** (Secured)
   - **Use a service account**: `forge-deploy@your-company.com`
   - **NOT a personal email** - ensures deployments work even when team members leave
   
2. **FORGE_API_TOKEN** (Secured)
   - Generate from the service account at: https://id.atlassian.com/manage-profile/security/api-tokens
   - Belongs to the service account, not any individual
   
3. **FORGE_DEPLOYMENT_TOKEN** (Optional, Secured)
   - For enhanced security in CI/CD

### Setting up Forge Authentication with Service Account

```bash
# IMPORTANT: Use a dedicated service account for CI/CD
# DO NOT use personal credentials!

# The pipeline uses these credentials automatically
# Set them as SECURED variables in Bitbucket:

FORGE_EMAIL=forge-deploy@your-company.com  # Service account
FORGE_API_TOKEN=<service-account-token>     # From service account
```

**Service Account Setup:**
1. Create `forge-deploy@your-company.com` (or similar)
2. Add to Atlassian Organization with Forge deployment permissions
3. Generate API token for this account
4. Store credentials in Bitbucket variables
5. Document service account access for team leads

## 📊 Pipeline Stages Explained

### 1. Lint & Validate (All PRs)
- Runs on every pull request
- **Blocks merging** if it fails
- Checks:
  - `forge lint` (validates manifest)
  - Frontend builds successfully
  - Dependencies install correctly

### 2. Deploy to Development (develop branch)
- Runs automatically after merge to `develop`
- Deploys to development environment
- Safe to experiment and test

### 3. Deploy to Production (main branch)
- **Manual trigger only**
- Requires explicit approval
- Should only run after thorough testing in dev

## 🎮 Manual Pipeline Runs

You can also trigger deployments manually:

1. Go to **Bitbucket > Pipelines**
2. Click **Run pipeline**
3. Select:
   - **Branch**: The branch to deploy from
   - **Pipeline**: Choose custom pipeline
     - `deploy-dev-manual` - Deploy to dev
     - `deploy-prod-manual` - Deploy to prod

## ✅ Best Practices

### DO ✅
- Always create feature branches from `develop`
- Write clear commit messages
- Request reviews from knowledgeable team members
- Test in development before promoting to production
- Keep PRs focused and small
- Update documentation with code changes

### DON'T ❌
- Never push directly to `main` or `develop`
- Never skip the PR review process
- Never deploy to production without testing in dev
- Never force push to protected branches
- Never commit sensitive data or credentials

## 🔍 Troubleshooting

### Pipeline fails with "Forge authentication failed"

Check environment variables are set correctly in Bitbucket:
- Repository Settings > Pipelines > Repository variables
- Verify the service account (`FORGE_EMAIL`) still has access to the Forge app
- Check if the API token (`FORGE_API_TOKEN`) has expired or been revoked
- Ensure the service account has proper permissions in your Atlassian Organization

### Changes don't appear after deployment

1. Check pipeline completed successfully
2. Verify deployment went to correct environment
3. You may need to hard refresh Jira (Cmd+Shift+R / Ctrl+Shift+R)
4. If manifest changed, run `forge install --upgrade`

### "Manifest validation failed"

Run locally before pushing:
```bash
cd apps/epic-breakdown
forge lint
```

## 📚 Additional Resources

- [Bitbucket Pipelines Documentation](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/)
- [Forge CLI Deployment Guide](https://developer.atlassian.com/platform/forge/cli-reference/deploy/)
- [Branch Permissions Setup](https://support.atlassian.com/bitbucket-cloud/docs/use-branch-permissions/)

## 🎯 Quick Reference Commands

```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/my-feature

# Check lint locally before pushing
cd apps/epic-breakdown && forge lint

# Check pipeline status
# Go to: Bitbucket > Your repo > Pipelines

# View deployment logs
# Go to: Bitbucket > Pipelines > Select build > View logs
```

---

**Remember**: The pipeline is your safety net! 🛡️ It prevents broken code from reaching production and ensures all changes are properly reviewed.
