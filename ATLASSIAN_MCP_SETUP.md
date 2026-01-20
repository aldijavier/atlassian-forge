# Setting up Atlassian Official MCP

The Atlassian Model Context Protocol (MCP) server allows AI agents (like Cursor or Claude Desktop) to securely access your Jira and Confluence data. This provides the agent with real-time context on your issues, pages, and projects.

## Prerequisites
- An Atlassian Cloud account (Terbang Ventures Jira instance).
- An AI client that supports MCP (e.g., [Cursor](https://cursor.com), [Claude Desktop](https://claude.ai/download)).

## Configuration Steps

### 1. Identify the Server
Atlassian provides an official MCP implementation. You can find the source and latest instructions here:
[Atlassian MCP on GitHub](https://github.com/atlassian/atlassian-mcp-server)

### 2. Add to your AI Client

#### For Cursor
1. Open Cursor Settings -> Models -> MCP.
2. Add a new MCP server:
   - **Name**: `Atlassian Official`
   - **Type**: `command`
   - **Command**: `npx -y @atlassian/mcp-server`

#### For Antigravity
1. Open the **MCP Store** from the side panel (icon with three dots `...` or `MCP` label).
2. You can search for the "Atlassian" server in the store and install it directly via the UI.
3. Alternatively, to configure it manually:
   - Click "Manage MCP Servers" -> "View raw config".
   - Add the configuration to your `mcp_config.json`:
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@atlassian/mcp-server"],
      "env": {
        "ATLASSIAN_URL": "https://jurnal.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

#### For VS Code (Generic)
If you are using VS Code without Antigravity/Cursor, you can use extensions like **Cline** or **Roo Code** which support MCP:
1. Install the extension (e.g., Cline).
2. Open its settings and locate the MCP configuration.
3. Add the same `npx` command and environment variables as shown above.

#### For Claude Desktop
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": [
        "-y",
        "@atlassian/mcp-server"
      ],
      "env": {
        "ATLASSIAN_URL": "https://jurnal.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools
Once connected, your agent will have access to:
- `jira_get_issue`: Get detailed information about a Jira issue.
- `jira_search_issues`: Search for issues using JQL.
- `confluence_get_page`: Read content from Confluence pages.
- `confluence_search_pages`: Search for documentation.

## Synergy with Forge Development
While the Atlassian MCP provides **product context** (what needs to be built), our proposed **Forge Helper MCP** will provide **development context** (how to build/deploy it).
