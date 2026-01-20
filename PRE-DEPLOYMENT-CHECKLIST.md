# Pre-Deployment Checklist

Use this checklist before deploying to production.

## Configuration

- [ ] **Custom Field IDs Verified**
  - Location: `src/resolvers/index.js` (lines 9-12)
  - Story Points field: `customfield_10005`
  - Sprint field: `customfield_10007`
  - How to verify: Jira Settings > Issues > Custom fields

- [ ] **Link Type Verified**
  - Location: `src/resolvers/index.js` (line ~315)
  - Current: "Relates"
  - Alternative: "Blocks", "Implements", "Caused by", etc.
  - How to verify: Create a link manually in Jira to see available types

## Code Quality

- [x] ✅ Forge lint passes (No issues)
- [x] ✅ Frontend builds successfully
- [x] ✅ No compilation errors
- [x] ✅ Security: All API calls use `asUser()`
- [x] ✅ Error handling implemented
- [x] ✅ User input validation added

## Testing (Do Before Production)

- [ ] **Development Environment Testing**
  - [ ] Deploy to development
  - [ ] Install on test Jira site
  - [ ] Test on an Epic with Stories
  - [ ] Create a new task via modal
  - [ ] Edit task summary inline
  - [ ] Edit story points inline
  - [ ] Change task assignee
  - [ ] Verify unlinked tasks detection
  - [ ] Test with different user permissions
  - [ ] Check error messages display correctly
  - [ ] Verify loading states work

- [ ] **Edge Cases**
  - [ ] Epic with no Stories
  - [ ] Story with no linked tasks
  - [ ] Task with no assignee
  - [ ] Task with no story points
  - [ ] Very long task summaries
  - [ ] User with limited permissions

## Documentation

- [x] ✅ README-PRODUCTION.md created
- [x] ✅ PRODUCTION-CHANGES.md created
- [x] ✅ Deploy script created
- [ ] Internal team documentation updated
- [ ] Screenshots/demo prepared (if needed)

## Permissions & Access

- [x] ✅ Required scopes in manifest:
  - [x] `read:jira-work`
  - [x] `write:jira-work`
  - [x] `read:jira-user`

- [ ] **User Permissions Tested**
  - [ ] Admin user can see everything
  - [ ] Regular user sees only permitted data
  - [ ] User without edit permissions can't modify

## Deployment Steps

### Development Deployment

```bash
# 1. Build
cd static/epic-breakdown && npm run build && cd ../..

# 2. Validate
forge lint

# 3. Deploy
forge deploy --non-interactive -e development

# 4. Install
forge install --non-interactive --site YOUR_DEV_SITE --product jira --environment development
```

- [ ] Development deployed
- [ ] Development installed
- [ ] Development tested

### Production Deployment

```bash
# 1. Build
cd static/epic-breakdown && npm run build && cd ../..

# 2. Validate
forge lint

# 3. Deploy
forge deploy --non-interactive -e production

# 4. Install/Upgrade
forge install --non-interactive --upgrade --site YOUR_PROD_SITE --product jira --environment production
```

- [ ] Production deployed
- [ ] Production installed/upgraded
- [ ] Production smoke tested

## Post-Deployment

- [ ] **Monitoring**
  - [ ] Check logs: `forge logs -e production --follow`
  - [ ] Monitor for errors in first hour
  - [ ] Verify performance is acceptable

- [ ] **User Communication**
  - [ ] Notify users of new feature
  - [ ] Share documentation/guide
  - [ ] Provide feedback channel

- [ ] **Rollback Plan Ready**
  - [ ] Previous version documented
  - [ ] Rollback procedure tested
  - [ ] Team knows how to rollback if needed

## Known Limitations

Document any known issues or limitations:

1. **Custom Fields**: Must be configured per Jira instance
2. **Link Types**: "Relates" link type must exist
3. **Performance**: Large Epics (>100 stories) may be slow
4. **Browser**: Requires modern browser (Chrome, Firefox, Safari, Edge)

## Support Contacts

- **Forge Issues**: https://community.developer.atlassian.com/c/forge/
- **Internal Support**: [Your team contact]
- **Documentation**: README-PRODUCTION.md

## Sign-Off

- [ ] Code reviewed by: _______________
- [ ] Tested by: _______________
- [ ] Approved by: _______________
- [ ] Deployed by: _______________
- [ ] Date: _______________

---

**Note**: For first-time deployment, you MUST test in development first!
