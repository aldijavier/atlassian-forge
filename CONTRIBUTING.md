# Contributing to Epic Breakdown

Thank you for your interest in contributing to the Epic Breakdown Forge app! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Deployment](#deployment)

## Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher
- **Forge CLI**: Install via `npm install -g @forge/cli`
- **Forge Account**: Sign up at [developer.atlassian.com](https://developer.atlassian.com)
- **Git**: For version control
- **Bitbucket Access**: SSH key configured for terbang-ventures workspace

### Clone the Repository

```bash
# Clone the repository
git clone git@bitbucket.org:terbang-ventures/jira-forge.git
cd jira-forge/apps/epic-breakdown

# Install dependencies
npm install
cd static/epic-breakdown && npm install && cd ../..
```

## Development Setup

### 1. Forge Authentication

```bash
# Login to Forge (one-time setup)
forge login
```

### 2. Register Your Development App

Each developer should register their own app for development:

```bash
# Register a new app (use your name in the app name)
forge register

# Example: "Epic Breakdown - Dev - YourName"
```

This creates a new app ID in your `manifest.yml` locally (don't commit this).

### 3. Configure Custom Fields

Update `src/resolvers/index.js` with your Jira instance's custom field IDs:

```javascript
const CUSTOM_FIELDS = {
  STORY_POINTS: 'customfield_10005',  // Check your Jira settings
  SPRINT: 'customfield_10007'          // Check your Jira settings
};
```

**To find custom field IDs:**
1. Go to Jira Settings > Issues > Custom fields
2. Click on a field name
3. Check the URL: `...customfield_10005`

### 4. Start Development

```bash
# Build the frontend
cd static/epic-breakdown && npm run build && cd ../..

# Deploy to your dev app
forge deploy -e development

# Install on your test Jira site
forge install

# Start tunnel for live development
forge tunnel
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code, always deployable
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation updates

### Creating a New Feature

1. **Create a feature branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Frontend: `static/epic-breakdown/src/App.js` and `App.css`
   - Backend: `src/resolvers/index.js`
   - Manifest: `manifest.yml` (permissions, modules)

3. **Test locally:**
   ```bash
   # Rebuild frontend
   cd static/epic-breakdown && npm run build && cd ../..
   
   # Deploy to your dev environment
   forge deploy -e development
   
   # Test with tunnel
   forge tunnel
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add status column editing
fix: resolve assignee dropdown search issue
docs: update README with new features
refactor: improve getAssigneeOptions performance
```

## Code Guidelines

### Frontend (React)

**File Structure:**
```
static/epic-breakdown/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main component
│   ├── App.css         # Styles
│   └── index.js        # Entry point
└── package.json
```

**React Best Practices:**
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names
- Add comments for complex logic
- Handle loading and error states

**Example:**
```javascript
const handleUpdateTask = async (taskKey, field, value) => {
  try {
    setError(null);
    await invoke('updateTask', { 
      issueKey: taskKey,
      updates: { [field]: value }
    });
    setEditingCell(null);
    await loadData(); // Refresh data
  } catch (err) {
    console.error('Update failed:', err);
    setError(`Failed to update task: ${err.message}`);
  }
};
```

### Backend (Resolvers)

**File Structure:**
```
src/
├── index.js              # Re-exports handler
└── resolvers/
    └── index.js          # All resolver functions
```

**Resolver Best Practices:**
- Always use `api.asUser()` for security
- Add JSDoc comments for functions
- Handle errors gracefully
- Log important operations
- Validate input data

**Example:**
```javascript
/**
 * Updates an existing task with proper field mapping
 * Uses asUser() to ensure user has permission to edit
 */
resolver.define('updateTask', async ({ payload }) => {
  const { issueKey, updates } = payload;
  
  try {
    const updateFields = {};
    
    if (updates.summary) {
      updateFields.summary = updates.summary;
    }
    
    // ... more field mappings
    
    const response = await api.asUser().requestJira(
      route`/rest/api/3/issue/${issueKey}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: updateFields })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update: ${response.status} - ${errorText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
});
```

### CSS Styling

- Use BEM-like naming: `.component-name`, `.component-name__element`
- Keep styles organized by component
- Use CSS variables for colors (if needed)
- Ensure responsive design

## Testing

### Manual Testing Checklist

Before submitting your changes, test the following:

**Basic Functionality:**
- [ ] App loads on Epic issue page
- [ ] Shows "Not an Epic" message on non-Epic issues
- [ ] Displays Stories and linked Tasks correctly
- [ ] "To Do" count is accurate

**Editing Features:**
- [ ] Summary editing works (click, edit, save)
- [ ] Story Points editing works
- [ ] Assignee dropdown shows relevant users
- [ ] Assignee search works (middle name too)
- [ ] Sprint dropdown shows active sprints
- [ ] Status dropdown shows valid statuses
- [ ] Changes save successfully

**Task Creation:**
- [ ] Modal opens when clicking "+ Add Task"
- [ ] Task creates successfully
- [ ] Task appears immediately (auto-refresh)
- [ ] Task is linked to correct Story

**Navigation:**
- [ ] Clicking issue keys opens them in new tab
- [ ] Story keys are clickable
- [ ] Task keys are clickable

**Edge Cases:**
- [ ] Epic with no Stories shows appropriate message
- [ ] Story with no Tasks shows "No tasks linked yet"
- [ ] Unassigned tasks show "Unassigned"
- [ ] Long summaries don't break layout

### Testing with Forge Tunnel

```bash
# Start tunnel for live development
forge tunnel

# Open an Epic in your Jira
# Make changes to the code
# See changes immediately without redeployment
```

### Checking Logs

```bash
# View application logs
forge logs -e development

# Follow logs in real-time
forge logs -e development --follow
```

## Submitting Changes

### Before Submitting

1. **Run lint check:**
   ```bash
   forge lint
   ```

2. **Build frontend:**
   ```bash
   cd static/epic-breakdown && npm run build && cd ../..
   ```

3. **Test thoroughly** using the checklist above

4. **Update documentation** if needed

### Creating a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on Bitbucket:**
   - Go to: https://bitbucket.org/terbang-ventures/jira-forge
   - Click "Create pull request"
   - Select your branch
   - Fill in the PR template:

   ```markdown
   ## Description
   Brief description of what this PR does
   
   ## Changes Made
   - Added feature X
   - Fixed bug Y
   - Updated documentation Z
   
   ## Testing
   - [ ] Tested manually on dev environment
   - [ ] Checked all edge cases
   - [ ] Verified no console errors
   
   ## Screenshots (if applicable)
   [Add screenshots of UI changes]
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Forge lint passes
   - [ ] Frontend builds successfully
   - [ ] Tested on development environment
   - [ ] Documentation updated
   ```

3. **Request Review:**
   - Tag at least one team member for review
   - Address any feedback

4. **Merge:**
   - Once approved, merge to `main`
   - Delete your feature branch

## Deployment

### Development Environment

Automatic - every merge to `main` can trigger deployment:

```bash
forge deploy -e development
```

### Production Environment

Only authorized team members should deploy to production:

```bash
# Ensure you're on main and up-to-date
git checkout main
git pull origin main

# Build
cd static/epic-breakdown && npm run build && cd ../..

# Lint check
forge lint

# Deploy to production
forge deploy -e production

# Upgrade installation on production Jira
forge install --upgrade -e production
```

**Production Deployment Checklist:**
- [ ] All tests pass on development
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Custom field IDs verified for production Jira
- [ ] Backup plan ready
- [ ] Team notified of deployment

## Project Structure

```
epic-breakdown/
├── src/
│   ├── index.js                    # Entry point (re-exports handler)
│   └── resolvers/
│       └── index.js                # Backend resolver functions
├── static/
│   └── epic-breakdown/
│       ├── public/
│       │   └── index.html          # HTML template
│       ├── src/
│       │   ├── App.js              # Main React component
│       │   ├── App.css             # Styles
│       │   └── index.js            # React entry point
│       ├── build/                  # Built frontend (git-ignored)
│       └── package.json            # Frontend dependencies
├── manifest.yml                    # Forge app configuration
├── package.json                    # Backend dependencies
├── README.md                       # Project overview
├── CONTRIBUTING.md                 # This file
├── PRE-DEPLOYMENT-CHECKLIST.md    # Deployment checklist
└── [Other documentation files]
```

## Key Configuration Files

### `manifest.yml`
- App metadata (name, ID)
- Modules (issue panel, resolvers)
- Permissions (scopes)
- Resources (frontend build path)

### `src/resolvers/index.js`
- Custom field IDs (STORY_POINTS, SPRINT)
- All backend resolver functions
- Jira API integrations

### `static/epic-breakdown/package.json`
- Frontend dependencies
- Build scripts
- Homepage setting (for relative paths)

## Troubleshooting

### Common Issues

**1. App doesn't appear on Epic page**
- Check manifest.yml has correct issue type condition
- Verify app is installed: `forge install`
- Check browser console for errors

**2. "Authentication failed" errors**
- Ensure using `api.asUser()` not `api.asApp()`
- Check permissions in manifest.yml
- Verify user has Jira permissions

**3. Frontend not updating**
- Rebuild: `cd static/epic-breakdown && npm run build`
- Clear browser cache
- Check homepage field in package.json is set to "."

**4. Custom field not found**
- Verify field IDs in `src/resolvers/index.js`
- Check field exists in your Jira project

**5. Forge tunnel not working**
- Restart tunnel: `Ctrl+C` then `forge tunnel`
- Check forge login: `forge whoami`
- Ensure only one tunnel running

### Getting Help

- **Internal Team**: Post in team chat/channel
- **Forge Documentation**: https://developer.atlassian.com/platform/forge/
- **Community Forum**: https://community.developer.atlassian.com/c/forge/
- **Issue Tracker**: Create an issue in this repository

## Resources

- [Forge Documentation](https://developer.atlassian.com/platform/forge/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Jira Agile REST API](https://developer.atlassian.com/cloud/jira/software/rest/)
- [React Documentation](https://react.dev/)
- [Atlaskit Components](https://atlassian.design/)

## Questions?

If you have questions about contributing, reach out to the team or check the documentation files:
- `README.md` - Project overview
- `README-PRODUCTION.md` - Production deployment guide
- `QUICK-REFERENCE.md` - Quick reference for common tasks
- `PRE-DEPLOYMENT-CHECKLIST.md` - Pre-deployment checklist

Happy coding! 🚀
