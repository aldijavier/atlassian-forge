# Epic Breakdown - Jira Forge App

A production-ready Forge app that provides an enhanced breakdown view for Jira Epics, showing all Stories and their linked Tasks with inline editing capabilities.

## Features

✅ **Epic Overview**: View all Stories under an Epic with task counts  
✅ **Linked Tasks Display**: See all tasks linked to each Story with key details  
✅ **Inline Editing**: Update task summaries and story points directly  
✅ **Assignee Management**: Change task assignees via dropdown  
✅ **Task Creation**: Create new tasks with a professional modal interface  
✅ **Unlinked Tasks Detection**: Identify tasks under the Epic not linked to any Story  
✅ **User Permissions**: Uses `asUser()` API calls to respect user permissions  
✅ **Error Handling**: Comprehensive error messages and validation

## Architecture

- **Frontend**: Custom UI using React and Atlaskit components
- **Backend**: Forge Resolvers handling Jira API interactions
- **Security**: User-context API calls with proper authorization checks

## Configuration

### Custom Field IDs

The app uses Jira custom fields that may vary between instances. Update these in `src/resolvers/index.js`:

```javascript
const CUSTOM_FIELDS = {
  STORY_POINTS: 'customfield_10005',  // Your Story Points field ID
  SPRINT: 'customfield_10007'          // Your Sprint field ID
};
```

**To find your field IDs:**
1. Go to Jira Settings > Issues > Custom fields
2. Click on the field name to see the ID in the URL
3. Or use the API: `GET /rest/api/3/field`

## Installation & Deployment

### Prerequisites

- [Forge CLI](https://developer.atlassian.com/platform/forge/set-up-forge/) installed and logged in
- Node.js 18.x or higher
- Access to a Jira Cloud instance

### First-Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd static/epic-breakdown
   npm install
   cd ../..
   ```

2. **Build the frontend:**
   ```bash
   cd static/epic-breakdown
   npm run build
   cd ../..
   ```

3. **Validate the app:**
   ```bash
   forge lint
   ```

4. **Deploy to development environment:**
   ```bash
   forge deploy --non-interactive -e development
   ```

5. **Install on your Jira site:**
   ```bash
   forge install --non-interactive --site YOUR_SITE_URL --product jira --environment development
   ```
   Example: `forge install --non-interactive --site mycompany.atlassian.net --product jira --environment development`

### After Installation

The app will appear as a panel on Epic issues. Navigate to any Epic in your Jira instance to see it in action.

### Updating the App

#### Code Changes Only (Frontend/Backend)

```bash
# Rebuild frontend if changed
cd static/epic-breakdown && npm run build && cd ../..

# Deploy changes
forge deploy --non-interactive -e development
```

#### Manifest Changes (Scopes/Permissions)

If you modify `manifest.yml` (e.g., adding scopes):

```bash
forge deploy --non-interactive -e development
forge install --non-interactive --upgrade --site YOUR_SITE_URL --product jira --environment development
```

### Development with Tunneling

For live development without deploying:

```bash
forge tunnel
```

**Important:**
- Changes to code files are hot-reloaded via tunnel
- Changes to `manifest.yml` require redeploying and restarting tunnel
- Close tunnel before deploying to production

## Permissions

The app requires the following Jira scopes:

- `read:jira-work` - Read issues, projects, and related data
- `write:jira-work` - Create and update issues
- `read:jira-user` - Fetch assignable users for projects

## Troubleshooting

### Custom Fields Not Working

**Problem**: Story points or sprint data not showing  
**Solution**: Update `CUSTOM_FIELDS` in `src/resolvers/index.js` with your instance's field IDs

### Link Type Errors

**Problem**: "Link type 'Relates' not found"  
**Solution**: The app uses "Relates" link type. Update line 315 in `src/resolvers/index.js` if your instance uses different link types (e.g., "Blocks", "Implements")

### Permission Errors

**Problem**: User can't see data or make changes  
**Solution**: Ensure the user has appropriate Jira permissions for the Epic and project

### Build Errors

**Problem**: `npm run build` fails in static/epic-breakdown  
**Solution**: 
```bash
cd static/epic-breakdown
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Logs & Debugging

View app logs:
```bash
# Last 15 minutes (default)
forge logs -e development

# Specific timeframe
forge logs -e development --since 1h
forge logs -e development --since 30m

# Follow logs in real-time
forge logs -e development --follow
```

## Production Deployment

1. **Build and validate:**
   ```bash
   cd static/epic-breakdown && npm run build && cd ../..
   forge lint
   ```

2. **Deploy to production:**
   ```bash
   forge deploy --non-interactive -e production
   ```

3. **Install or upgrade on production site:**
   ```bash
   # New installation
   forge install --non-interactive --site YOUR_SITE_URL --product jira --environment production
   
   # Upgrade existing installation
   forge install --non-interactive --upgrade --site YOUR_SITE_URL --product jira --environment production
   ```

## File Structure

```
epic-breakdown/
├── manifest.yml                    # Forge app configuration
├── package.json                    # Backend dependencies
├── src/
│   ├── index.js                   # Entry point (exports resolver handler)
│   └── resolvers/
│       └── index.js               # Backend resolvers (API logic)
└── static/epic-breakdown/          # Custom UI React app
    ├── package.json               # Frontend dependencies
    ├── src/
    │   ├── App.js                # Main React component
    │   ├── App.css               # Styling
    │   └── index.js              # React entry point
    └── build/                     # Production build (generated)
```

## API Resolvers

### `getEpicBreakdown`
Fetches Epic details, all Stories, linked tasks, and unlinked tasks.

### `updateTask`
Updates task fields (summary, story points, assignee).

### `createTask`
Creates a new task under the Epic and links it to a Story.

### `getAssigneeOptions`
Fetches assignable users for the project.

## Security Notes

- All API calls use `api.asUser()` to respect user permissions
- No authorization bypass - users can only see/edit what they have Jira permissions for
- Custom fields and sensitive data handled securely
- XSS protection via React's built-in escaping

## Support

For Forge-related help:
- [Forge Documentation](https://developer.atlassian.com/platform/forge/)
- [Forge Community](https://community.developer.atlassian.com/c/forge/)
- [Get Help](https://developer.atlassian.com/platform/forge/get-help/)

## License

MIT
