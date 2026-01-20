# Atlassian Forge Versioning Guide

A comprehensive reference for understanding how Forge manages app versions and what to expect during deployments.

---

## Key Concept: Forge Controls Versioning Independently

**Important**: Forge manages versioning automatically and independently of your `package.json` version string. When you deploy, Forge decides whether to create a **major** or **minor** version based on what changed in your code, not what you put in `package.json`.

This means:
- ✅ You *can* update your `package.json` version for documentation purposes
- ❌ But Forge's version assignment will NOT match your `package.json` version
- The Forge platform maintains its own versioning system

---

## Version Types

### Major Versions
- Created when your app has **significant changes** that require site admin approval
- **Not automatically applied** to existing installations
- Site admins must actively consent/upgrade to get a major version
- Examples of changes that trigger major versions:
  - Adding, removing, or changing OAuth scopes/permissions
  - Modifying CSP (Content Security Policy) options
  - Enabling licensing for the first time
  - Changing external egress permissions
  - Modifying `inScopeEUD` from `false` to `true`
  - Adding or removing provider configurations

### Minor Versions
- Created when deploying changes that **don't require major version triggers**
- **Automatically applied** to all sites running the same major version
- No admin consent needed
- Updates happen transparently to users
- Examples:
  - Bug fixes
  - Code improvements
  - UI/UX changes
  - Feature additions that don't change permissions

---

## Version Numbering System

Forge uses semantic versioning: **MAJOR.MINOR**

### Examples:
- `3.37.0` = Major version 3, Minor version 37
- `1.1` = Major version 1, Minor version 1 (initial app version)
- When you deploy a change that doesn't trigger major version rules, Forge increments the minor version (3.36 → 3.37)
- When you deploy a change that triggers major version rules, Forge creates a new major version (3 → 4)

---

## What Happens When You Deploy

### Step 1: You Run `forge deploy`
```bash
forge deploy --non-interactive --environment production
```

### Step 2: Forge Analyzes Your Changes
Forge checks your manifest and code against the previous deployed version to determine:
- Does this change require a major version? (checking permission changes, scope changes, etc.)
- Is this just a minor improvement? (code/UI changes)

### Step 3: Forge Creates a Version
- If **major version rules were triggered**: New major version (e.g., 3 → 4)
- If **no major version rules triggered**: New minor version (e.g., 3.36 → 3.37)

### Step 4: Automatic Distribution
- **Major versions**: Site admins see upgrade notification and must approve
- **Minor versions**: Automatically installed to all sites on that major version immediately

---

## Commands to Check Versions

### List Major Versions
```bash
forge version list
```
Shows all major versions across all environments with deployment dates and configuration details.

### View Major Version Details
```bash
forge version details --major-version 3
```
See what's included in a specific major version (scopes, functions, modules, etc.)

### Compare Two Versions
```bash
forge version compare --version1 3 --version2 4
```
See what changed between major versions.

### Check Installed Versions
```bash
forge install list
```
Shows which major version is installed on each site/environment.

---

## Backporting Minor Versions

You can backport minor version updates to older major versions without requiring a new major version:

```bash
forge deploy --major-version 3 --non-interactive --environment production
```

This allows you to:
- Fix bugs in an older major version
- Push security patches to users who haven't upgraded
- Maintain legacy versions while developing new features

**Limitation**: Cannot backport Custom Entity schema changes.

---

## Your `package.json` Version vs. Forge Version

### What You Control (package.json)
```json
{
  "name": "epic-breakdown",
  "version": "3.36.1"
}
```
- Use this for your own documentation and Git tags
- Update it when you want to mark a release in your code
- **But Forge ignores this value for its versioning system**

### What Forge Controls
The actual version shown on the platform (e.g., `3.37.0`) is determined by:
- Your manifest configuration
- Changes detected since the last deployment
- Which environment you're deploying to (development/staging/production)

### Best Practice
Keep your `package.json` version in sync with what Forge assigns for clarity:
1. After deploying to production, check what version Forge created
2. Update `package.json` to match (if desired for documentation)
3. Commit that change to Git

Example workflow:
```bash
# Deploy to production
forge deploy --non-interactive --environment production
# Output: "The version of your app [3.37.0] that was just deployed..."

# Then update package.json
npm version minor  # Bumps version in package.json
# OR manually edit: "version": "3.37.0"

git add package.json
git commit -m "chore: sync version with Forge deployment 3.37.0"
```

---

## Real Example from Epic Breakdown

### Timeline:
1. **Initial deployment**: Code version 3.35.0 → Forge created **major version 1**
2. **Later deployment**: Code version 3.36.0 → Forge created **minor version 36** under major version 3
3. **Hotfix deployment**: Code version 3.36.1 → Forge auto-incremented to **minor version 37** under major version 3

### Why Minor, Not Major?
The sort preference feature only added code and UI changes. No permission changes, no scope changes, no manifest permission modifications. Therefore, Forge treated it as a minor version update.

### Version Progression:
- 3.36.0 deployed → Forge assigned as v3.36
- Code fixed, still 3.36.1 in package.json → Forge assigned as v3.37 (auto-incremented minor)
- User sees the app running as v3.37 after deployment

---

## When Major Version Rules Trigger

The following changes in `manifest.yml` trigger a major version:

- ✅ **Scopes**: Add/remove/change OAuth or Atlassian product scopes
- ✅ **Permissions**: Modify external egress CSP options or URLs
- ✅ **Web Triggers**: Add dynamic web triggers or convert static to dynamic
- ✅ **Licensing**: Enable licensing for first time
- ✅ **Providers**: Add/remove provider configurations
- ✅ **Egress**: Change egress permission category or modify `inScopeEUD` from false→true for first time
- ✅ **Remotes**: Most remote backend changes (see Forge docs for exceptions)

Examples that do NOT trigger major:
- ❌ Fixing a bug in resolver code
- ❌ Updating UI components
- ❌ Changing feature logic
- ❌ Adding new functions (if no new scopes)

---

## Environment-Specific Versioning

### Development Environment
- Used for testing and iteration
- Each deployment can create new versions
- Can tunnel for real-time changes
- No restrictions on version testing

### Staging Environment
- Used for final testing before production
- Cannot use `forge tunnel`
- Must redeploy for code changes
- Good for verifying multi-site compatibility

### Production Environment
- Your live app for customers
- Cannot use `forge tunnel` or `forge logs`
- Use staging/development for debugging
- Deployments are visible to all sites on that version

---

## Troubleshooting Version Issues

### Q: Why didn't my version match what I set in package.json?
**A**: Forge manages versions independently. Your package.json is ignored by Forge's versioning system. Update it after deploying to match the Forge version if desired.

### Q: How do I know if a change triggers a major version?
**A**: Use `forge deploy --verbose` to see detailed analysis. It will tell you if your changes require a major version upgrade.

### Q: What if I accidentally create an unwanted major version?
**A**: Major versions are permanent. You can:
1. Continue with the new version
2. Backport bug fixes to the previous major version if needed
3. In future deployments, ensure permission changes don't inadvertently trigger major versions

### Q: Can I deploy to multiple environments with the same version?
**A**: No, each environment has its own version history. Deployments to development, staging, and production are tracked separately.

### Q: Why should I care about understanding versioning?
**A**: 
- **User Experience**: Major versions require admin approval; minor versions are instant
- **Deployment Strategy**: Know if a change requires user migration planning
- **Rollback**: Understanding versions helps with supporting multiple major versions
- **Release Management**: Proper versioning makes it easier to track what's in production

---

## Commands Reference

| Task | Command |
|------|---------|
| Deploy to production | `forge deploy --non-interactive --environment production` |
| Deploy to development | `forge deploy --non-interactive --environment development` |
| List all versions | `forge version list` |
| View version details | `forge version details --major-version 3` |
| Compare versions | `forge version compare --version1 3 --version2 4` |
| See installations | `forge install list` |
| Deploy verbose output | `forge deploy --verbose --environment production` |
| Backport to major version 2 | `forge deploy --major-version 2 --environment production` |

---

## Summary

- **Forge handles versioning automatically** based on what changed
- **Major versions** = significant changes requiring admin approval
- **Minor versions** = improvements auto-applied to all sites
- **Your package.json** is for documentation; Forge assigns its own versions
- **Always check Forge's feedback** after deployment to see the actual version assigned
- **Plan for major versions** if you're adding scopes or permissions
- **Minor versions** are safe for all deployments without permission changes

---

**Last Updated**: January 2, 2026
**Forge Platform**: Atlassian Forge Cloud
**Reference**: [Official Forge Versions Documentation](https://developer.atlassian.com/platform/forge/versions/)
