# Jira Forge Apps - Terbang Ventures

> Monorepo for Atlassian Forge apps deployed to Terbang Ventures' Jira Cloud instance.

[![Forge](https://img.shields.io/badge/Forge-Apps-orange.svg)](https://developer.atlassian.com/platform/forge/)
[![Jira](https://img.shields.io/badge/Jira-Cloud-blue.svg)](https://jurnal.atlassian.net)

## 📋 Overview

This repository serves as a centralized monorepo for all Forge apps developed for Terbang Ventures' Jira instance. It provides a shared infrastructure for developing, testing, and deploying multiple apps efficiently.

Each application resides in its own directory within `apps/` and operates as an independent project with its own lifecycle, while benefiting from shared documentation and deployment workflows.

**Jira Instance**: [jurnal.atlassian.net](https://jurnal.atlassian.net)

## ⚡ Quick References

- **[Company Deployment Guide](./COMPANY-DEPLOYMENT-GUIDE.md)** 📚 - Full deployment documentation
- **[Claude Development Guide](./CLAUDE.md)** 🤖 - Development guidelines for AI-assisted coding

## 📂 Repository Structure

```
jira-forge/
├── README.md                    # This file
├── apps/                        # Directory containing all Forge apps
│   ├── [app-name]/              # Individual app directory
│   │   ├── src/                 # App source code
│   │   ├── static/              # Custom UI frontend (if applicable)
│   │   ├── manifest.yml         # App configuration
│   │   ├── package.json         # App dependencies
│   │   ├── README.md            # App-specific documentation
│   │   └── CONTRIBUTING.md      # App-specific contribution guide
│   │
│   └── ...                      # Other apps

## 🧠 Core Concepts

### Monorepo Strategy
This repository uses a simple directory-based monorepo structure. All apps share root deployment scripts and documentation, but manage their own dependencies and Forge manifests.

### AI-First Development
We use **AGENTS.md** and **.cursorrules** to ensure AI agents have full context of our coding standards and repository architecture. Developers are encouraged to use the **Atlassian MCP** for product data context.

## 📦 Applications

### [Epic Breakdown](./apps/epic-breakdown)
Manages the relationship between Epics, Stories, and Tasks. Features a custom frontend for managing "split" link types and visualising progress across the hierarchy.

### [PRD Sync Guardian](./apps/prd-sync-guardian)
Ensures that PRD documents and Jira issues remain in sync. Prevents data silos and ensures that the source of truth is consistent across platforms.

### [Program Report](./apps/program-report)
A high-level dashboard for tracking multiple Epics under a "Program". Includes health indicators (On Track, At Risk, Late) and relative due date tracking.

### [QA Test Case Manager](./apps/qa-test-case-manager)
Provides QA test case management features for organizing and tracking test cases within Jira issues.

### [Augment Description Generator](./apps/augment-description-generator)
Utility app that generates descriptions for Jira issues using automated generation capabilities.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **Forge CLI**: `npm install -g @forge/cli`
- **Forge Account**: [developer.atlassian.com](https://developer.atlassian.com)
- **Git** with SSH configured for Bitbucket
- **Access** to Terbang Ventures Bitbucket workspace

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone git@bitbucket.org:terbang-ventures/jira-forge.git
   cd jira-forge
   ```

2. **Login to Forge**:
   ```bash
   forge login
   ```

3. **Choose an app to work on**:
   ```bash
   cd apps/<app-name>
   ```

4. **Follow app-specific README**:
   Refer to the `README.md` inside the app's directory for next steps.

## 📖 Working with Apps

### Developing an Existing App

```bash
# Navigate to the app
cd apps/<app-name>

# Install dependencies
npm install

# Register your own dev app (one-time)
forge register
# Name it: "<App Name> - Dev - [YourName]"

# Start development
forge tunnel
```

**Important**: Each developer should register their own app for development to avoid conflicts with production or other team members.

### Creating a New App

```bash
# Navigate to apps directory
cd apps

# Create new Forge app
forge create

# Follow prompts:
# - App name: descriptive-app-name
# - Template: Choose appropriate template
# - Path: ./descriptive-app-name

# App structure will be created:
apps/
└── descriptive-app-name/
    ├── src/
    ├── manifest.yml
    └── package.json
```

**After creating**:

1. **Create app README.md**:
   Copy a template from an existing app or create a new one describing features and setup.

2. **Create CONTRIBUTING.md**:
   Define contribution guidelines specific to the app if they differ from the defaults.

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add new app [app-name]"
   git push origin main
   ```

## 🔧 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/<app-name>/<description>` - New features
- `fix/<app-name>/<description>` - Bug fixes
- `docs/<description>` - Documentation updates

**Example**:
```bash
git checkout -b feature/epic-breakdown/add-comments-field
```

### Making Changes

1. **Create feature branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/<app-name>/your-feature
   ```

2. **Navigate to app and develop**:
   ```bash
   cd apps/<app-name>
   forge tunnel  # Live development
   ```

3. **Test thoroughly**:
   - Follow app's testing checklist
   - Run `forge lint`
   - Build frontend if applicable

4. **Commit with conventional commits**:
   ```bash
   git add .
   git commit -m "feat(<app-name>): add new feature"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/<app-name>/your-feature
   ```
   Then create Pull Request on Bitbucket.

### Commit Message Format

```
<type>(<app-name>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🚢 Deployment

### Development Deployment

**For testing new features only**. Use `forge tunnel` for local development.

```bash
cd apps/<app-name>
forge deploy -e development
```

### Production Deployment

**⚠️ Only authorized team members**

```bash
cd apps/<app-name>

# Ensure on main and up-to-date
git checkout main
git pull origin main

# Build if needed (for Custom UI apps)
cd static/<app-name> && npm run build && cd ../..

# Validate
forge lint

# Deploy
forge deploy -e production

# Install (first time) or upgrade
forge install --upgrade -e production
```

## 📋 App Configuration

### Custom Field IDs

If your app uses custom Jira fields, document them in the app's `README.md` or a configuration file.

### App Registration

- **Development**: Each developer registers their own app instance (`forge register`).
- **Production**: Single shared app per environment linked to the main repository.

## 🗂️ App Organization Best Practices

### Directory Structure

Each app should follow this structure:

```
apps/your-app/
├── src/
│   ├── index.js              # Entry point
│   └── resolvers/            # Backend logic
├── static/                   # Frontend (if Custom UI)
│   └── your-app/
│       ├── src/
│       └── package.json
├── manifest.yml              # Forge configuration
├── package.json              # Dependencies
├── README.md                 # App documentation
├── CONTRIBUTING.md           # Contribution guide
└── .gitignore                # Git ignore rules
```

## 🤝 Contributing

### For App-Specific Contributions
See the specific app's `CONTRIBUTING.md`.

### For Repository-Level Changes
1. **Adding a new app**: Follow "Creating a New App" section.
2. **Updating shared docs**: Create PR with changes to root docs.
3. **Repository structure**: Discuss with team first.

## 🔍 Troubleshooting

### Common Issues

**1. Duplicate app panels appearing**
- **Fix**: `forge uninstall -e development -s jurnal.atlassian.net` in the app directory.

**2. "You don't have access to this app"**
- **Fix**: Ensure the app is deployed to production for general access, or you are added to the development app's access list.

**3. Multiple apps interfering**
- **Fix**: Register separate dev apps for each developer.

## 📞 Support & Contact

- **Development Issues**: Post in team Slack/chat
- **Deployment Issues**: Contact DevOps/authorized deployers
- **Forge Platform**: [Atlassian Community](https://community.developer.atlassian.com/)

## 📄 License

Internal use only - Terbang Ventures

---

## ⚡ Quick Commands Reference

```bash
# Clone repo
git clone git@bitbucket.org:terbang-ventures/jira-forge.git

# Work on an app
cd jira-forge/apps/<app-name>
npm install
forge tunnel

# Create new app
cd jira-forge/apps
forge create

# Deploy to development
cd apps/<app-name>
forge deploy -e development

# View logs
forge logs -e development
```
