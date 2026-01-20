# Multi-App Forge Repository Setup

## Repository Structure

We recommend organizing your Bitbucket repo to support multiple Forge apps:

```
jira-forge/
├── README.md                          # Main repo documentation
├── .gitignore                         # Shared gitignore
├── docs/                              # Shared documentation
│   ├── deployment-guide.md
│   └── development-standards.md
├── apps/
│   ├── epic-breakdown/                # Your Epic Breakdown app
│   │   ├── manifest.yml
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── src/
│   │   ├── static/
│   │   └── .forge-env                 # App-specific environment config (gitignored)
│   │
│   ├── another-app/                   # Future apps
│   │   ├── manifest.yml
│   │   └── ...
│   │
│   └── README.md                      # Apps directory guide
│
└── scripts/                           # Shared deployment scripts
    ├── deploy-app.sh
    └── setup-new-app.sh
```

## Benefits of This Structure

1. **Isolation**: Each app is independent with its own dependencies
2. **Scalability**: Easy to add new apps
3. **Clear Organization**: Team knows where to find each app
4. **Shared Resources**: Common scripts and documentation
5. **Version Control**: Track all apps in one place

## Alternative: Monorepo with Workspaces

If you prefer a more integrated approach:

```
jira-forge/
├── package.json                       # Root package.json with workspaces
├── apps/
│   ├── epic-breakdown/
│   └── another-app/
└── packages/                          # Shared libraries
    └── common/
```

## Recommendation

For Forge apps, I recommend the **first structure (isolated apps)** because:
- Each Forge app must be deployed independently
- Different apps may have different dependencies
- Simpler to understand and maintain
- Better alignment with Forge CLI expectations
