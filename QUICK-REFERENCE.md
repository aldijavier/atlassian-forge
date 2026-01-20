# Epic Breakdown - Quick Reference

## 🚀 Quick Deploy

```bash
# Use the deployment script
./deploy.sh

# Or manually:
cd static/epic-breakdown && npm run build && cd ../..
forge deploy --non-interactive -e development
forge install --non-interactive --site YOUR_SITE.atlassian.net --product jira -e development
```

## 📝 Common Commands

### Deploy Changes
```bash
# Frontend changes
cd static/epic-breakdown && npm run build && cd ../..
forge deploy --non-interactive -e development

# Backend changes only
forge deploy --non-interactive -e development

# Manifest changes (requires reinstall)
forge deploy --non-interactive -e development
forge install --non-interactive --upgrade --site YOUR_SITE.atlassian.net --product jira -e development
```

### Development
```bash
# Live development (hot reload)
forge tunnel

# View logs
forge logs -e development --follow
forge logs -e development --since 30m
```

### Troubleshooting
```bash
# Validate configuration
forge lint

# Check errors
forge logs -e development -n 50

# Rebuild frontend
cd static/epic-breakdown
rm -rf node_modules package-lock.json
npm install
npm run build
```

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `manifest.yml` | App configuration, permissions, modules |
| `src/resolvers/index.js` | Backend logic, custom field IDs |
| `static/epic-breakdown/src/App.js` | Frontend React component |
| `static/epic-breakdown/src/App.css` | Styles |

## 🔧 Important Settings

### Custom Fields (src/resolvers/index.js)
```javascript
const CUSTOM_FIELDS = {
  STORY_POINTS: 'customfield_10005',  // ← Change this
  SPRINT: 'customfield_10007'          // ← Change this
};
```

### Link Type (src/resolvers/index.js, line ~315)
```javascript
type: { name: "Relates" }  // ← Change if needed
```

## 📊 App Structure

```
Epic (DEV-100)
├── Story 1 (DEV-101)
│   ├── Task 1 (DEV-102) [linked]
│   ├── Task 2 (DEV-103) [linked]
│   └── Task 3 (DEV-104) [linked]
├── Story 2 (DEV-105)
│   └── Task 4 (DEV-106) [linked]
└── Task 5 (DEV-107) [unlinked - shown in warning section]
```

## 🎯 Features

- ✅ View all Stories under Epic
- ✅ View linked Tasks for each Story
- ✅ Create new Tasks (modal)
- ✅ Edit summaries (inline)
- ✅ Edit story points (inline)
- ✅ Change assignees (dropdown)
- ✅ Detect unlinked Tasks
- ✅ User permissions respected

## 🔒 Permissions Required

```yaml
permissions:
  scopes:
    - read:jira-work      # Read issues
    - write:jira-work     # Create/update issues
    - read:jira-user      # Fetch assignable users
```

## 🐛 Common Issues

### "Custom field not found"
→ Update `CUSTOM_FIELDS` in `src/resolvers/index.js`

### "Link type 'Relates' not found"
→ Change link type on line ~315 in `src/resolvers/index.js`

### "Permission denied"
→ User needs Jira permissions for the Epic/project

### "Module not found" during build
→ `cd static/epic-breakdown && rm -rf node_modules && npm install`

### App not showing on Epic
→ Check manifest conditions and redeploy

## 📚 Documentation

- Full guide: `README-PRODUCTION.md`
- Changes log: `PRODUCTION-CHANGES.md`
- Deploy checklist: `PRE-DEPLOYMENT-CHECKLIST.md`

## 🆘 Get Help

- Forge Docs: https://developer.atlassian.com/platform/forge/
- Community: https://community.developer.atlassian.com/c/forge/
- Logs: `forge logs -e development --follow`

## 💡 Tips

1. **Always test in development first**
2. **Use `forge tunnel` for rapid development**
3. **Check logs when something goes wrong**
4. **Verify custom field IDs per instance**
5. **Rebuild frontend after UI changes**
6. **Run `forge lint` before deploying**

## 🔄 Update Workflow

```
Code Change → Build Frontend → Lint → Deploy → Test
     ↓              ↓            ↓       ↓       ↓
   edit         npm run       forge   forge   verify
   files         build         lint   deploy  in Jira
```

---

**Production Ready!** 🎉 All security fixes, error handling, and UX improvements applied.
