# Program Report Tool

A Jira Forge application that provides a high-level "Program" view by aggregating Epics, Stories, and Tasks across multiple projects.

## Features
- **Global Page**: Accessible via the Apps menu.
- **Dynamic Selection**: Use any Jira issue (e.g., a Task) as a "Program Container" by linking Epics to it.
- **Timeline Tracking**: Visualises `duedate` for Epics, Stories, and Tasks.
- **Progress Tracking**: Automatically calculates completion percentage for each Epic based on child stories.
- **Read-Only**: Designed for stakeholders and program managers to view status without accidental edits.

## Folder Structure
- `src/`: Backend logic and Forge resolvers.
- `static/program-report/`: React frontend source code.
- `manifest.yml`: App configuration and permissions.

## Setup Instructions
1. Navigate to the app folder: `cd apps/program-report`
2. Install dependencies: `npm install && cd static/program-report && npm install`
3. Build the frontend: `npm run build`
4. Deploy to Jira: `forge deploy`
5. Install on site: `forge install`

## Usage Guide
1. Create a "Program" issue (Task or custom type).
2. Link Epics to this issue using standard Jira links.
3. Open the **Program Report** app from the Jira Apps menu.
4. Search for your Program issue by Key or Summary.

## 📖 Related Docs
- [Repository AGENTS.md](../../AGENTS.md) - Coding standards.
- [Deployment Guide](../../COMPANY-DEPLOYMENT-GUIDE.md) - How to deploy to production.
