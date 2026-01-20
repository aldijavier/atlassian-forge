# Quick Setup: PR-Based Deployment Pipeline

## 🚀 Quick Start (5 minutes)

### 1. Enable Pipelines in Bitbucket

```bash
# The bitbucket-pipelines.yml is already in your repo
# Just need to enable it in Bitbucket:
```

1. Go to your Bitbucket repository
2. Click **Repository settings** (gear icon)
3. Under **PIPELINES**, click **Settings**
4. Toggle **Enable Pipelines** to ON

### 2. Add Forge Credentials (Team Approach)

**⚠️ IMPORTANT**: Use a **shared service account** for team deployments, not personal credentials!

#### Option A: Create a Service Account (Recommended)
1. Create a dedicated Atlassian account: `forge-deploy@your-company.com`
2. Add this account to your Atlassian Organization with appropriate permissions
3. Generate API token for this service account
4. Share access to this account securely with your team leads

#### Option B: Use CI/CD Bot Account
If your company has an existing CI/CD bot account, use that instead.

#### Configure Bitbucket Variables
1. In Bitbucket, go to **Repository settings > Pipelines > Repository variables**
2. Add these **SECURED** variables:

| Variable Name | Value | Secured |
|---------------|-------|---------|
| `FORGE_EMAIL` | forge-deploy@your-company.com | ✅ Yes |
| `FORGE_API_TOKEN` | [Service account token](https://id.atlassian.com/manage-profile/security/api-tokens) | ✅ Yes |

**Why service account?**
- ✅ Deployments don't break when team members leave
- ✅ Clear separation between personal and CI/CD access
- ✅ Easier to audit and manage permissions
- ✅ Token rotation doesn't affect individuals

### 3. Set Up Branch Protection

1. Go to **Repository settings > Branch permissions**
2. Click **Add a branch permission**
3. Configure for `main`:
   ```
   Branch name: main
   ✅ Prevent deletion
   ✅ Require a minimum number of approvals: 1
   ✅ Require passing builds
   ✅ Prevent changes without a pull request
   ```
4. Click **Create**

### 4. Test It! 🎉

```bash
# Create a test branch
git checkout -b test/pipeline-setup

# Make a small change
echo "# Pipeline enabled!" >> apps/epic-breakdown/README.md

# Push it
git add .
git commit -m "test: pipeline configuration"
git push origin test/pipeline-setup
```

Then in Bitbucket:
1. Create a Pull Request
2. Watch the pipeline run automatically! ✨
3. You'll see "Lint & Validate" running
4. Merge only works if pipeline passes ✅

## 📖 Full Documentation

See [DEPLOYMENT-WORKFLOW.md](./DEPLOYMENT-WORKFLOW.md) for complete workflow and best practices.

## 🎯 What You Get

✅ **No more unreviewed deploys** - All changes need PR approval  
✅ **Automatic validation** - Lint checks run on every PR  
✅ **Safe deployments** - Test in dev before production  
✅ **Audit trail** - Every change tracked in Git history  
✅ **Manual prod approval** - No accidental production deploys  

## 🔄 New Workflow Summary

**Old way** (risky):
```bash
# Anyone could do this anytime 😱
forge deploy -e production
```

**New way** (safe):
```bash
1. Create feature branch
2. Push changes
3. Create PR → Automatic validation
4. Get approval → Required review
5. Merge → Auto-deploy to dev
6. Test in dev
7. PR to main → Another review
8. Manual deploy to prod → Explicit approval
```

## ⚡ Common Commands

```bash
# Start new work
git checkout develop
git pull
git checkout -b feature/your-feature

# Push changes (triggers pipeline on PR)
git push origin feature/your-feature

# Check pipeline status
# Go to Bitbucket > Pipelines
```

---

**Need help?** Check [DEPLOYMENT-WORKFLOW.md](./DEPLOYMENT-WORKFLOW.md) for troubleshooting and detailed steps.
