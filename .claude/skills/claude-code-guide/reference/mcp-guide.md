# MCP Server Best Practices

Actionable guide for configuring and managing MCP (Model Context Protocol) servers.

## What MCP Servers Are

MCP extends Claude with external service access — GitHub, databases, Playwright, Sentry,
filesystems, and more. Each server registers tools that Claude can use, but those tool
definitions consume context permanently.

## Configuration

Configure in `.mcp.json` at project root:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

Environment variables are supported: `${VAR}` and `${VAR:-default}` in `command`, `args`, `env`, `url`, `headers`.

Or configure via `/mcp` command during a session.

**Note**: SSE transport is deprecated — use HTTP (`--transport http`) where available.

## MCP Scopes

| Scope             | Storage                             | Purpose                    |
| ----------------- | ----------------------------------- | -------------------------- |
| `local` (default) | `~/.claude.json` under project path | Private, current project   |
| `project`         | `.mcp.json` at project root         | Shared via version control |
| `user`            | `~/.claude.json`                    | Cross-project personal     |

**Important**: MCP "local" scope stores in `~/.claude.json` (home dir), NOT `.claude/settings.local.json`.

## Context Overhead

Every MCP server adds tool definitions to your context window:

- Tool descriptions are present even when the server is idle
- This is the primary cost of MCP — not the tool calls themselves
- When MCP tool descriptions exceed **10% of context window**, tool search auto-activates
- Tool search defers tools and loads them on-demand, reducing idle overhead
- Set `ENABLE_TOOL_SEARCH=auto:<N>` for a lower threshold (e.g., `auto:5` for 5%)
- Tool search requires Sonnet 4+ or Opus 4+ (not Haiku)
- Token limits: warning at **10,000 tokens** per tool output, default max **25,000** (`MAX_MCP_OUTPUT_TOKENS`)

## Prefer CLI Tools When Available

CLI tools have zero context overhead — Claude runs them directly via Bash:

| Instead of MCP server | Use CLI tool |
| --------------------- | ------------ |
| GitHub MCP            | `gh` CLI     |
| AWS MCP               | `aws` CLI    |
| GCP MCP               | `gcloud` CLI |
| Sentry MCP            | `sentry-cli` |

Only use MCP when the CLI tool does not exist or the MCP server provides significantly
better functionality.

## Good Configuration

Only enable servers you actively use:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-playwright"]
    }
  }
}
```

## Bad Configuration

Enabling many servers "just in case":

```json
{
  "mcpServers": {
    "memory": { "command": "..." },
    "filesystem": { "command": "..." },
    "github": { "command": "..." },
    "slack": { "command": "..." },
    "postgres": { "command": "..." },
    "redis": { "command": "..." }
  }
}
```

Problem: 6 servers with potentially dozens of tool definitions consuming context.

## Monitoring Context Usage

- Run `/context` to see what is consuming space
- Run `/mcp` to see configured servers and disable unused ones
- Use `/cost` to track token usage

## MCP Tools in Hooks

MCP tools appear as regular tools in hook events:

- Naming pattern: `mcp__<server>__<tool>`
- Example: `mcp__memory__create_entities`
- Match with regex: `mcp__memory__.*`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__.*__write.*",
        "hooks": [{ "type": "command", "command": "./validate-mcp-write.sh" }]
      }
    ]
  }
}
```

## MCP in Subagents

- Subagents can access MCP servers via the `mcpServers` frontmatter field
- Reference an already-configured server by name, or provide inline definition
- MCP tools are NOT available in background subagents
- If `tools` is omitted, subagent inherits all tools including MCP

## Plugin MCP Servers

Plugins can bundle MCP servers. Use `${CLAUDE_PLUGIN_ROOT}` for paths in plugin
MCP configurations.

## MCP Resources and Prompts

- **Resources**: Use `@server:protocol://resource/path` to reference MCP resources as context
- **Prompts**: MCP prompts appear as `/mcp__<server>__<prompt>` commands
- Manage via `/mcp` command — includes OAuth authentication for servers that require it

## Managed MCP (Organizations)

Deploy `managed-mcp.json` to system directories for exclusive control, or use `allowedMcpServers`/`deniedMcpServers` in managed settings for policy-based restriction. Entries can filter by `serverName`, `serverCommand`, or `serverUrl` (wildcards supported).

## Audit Checklist

- [ ] Only actively used MCP servers are enabled
- [ ] CLI alternatives are used where possible (`gh` instead of GitHub MCP)
- [ ] `/context` shows reasonable MCP context usage
- [ ] Tool search threshold is set if many tools are registered
- [ ] Subagent MCP access is explicitly scoped

## Common Mistakes

- Enabling MCP servers you rarely use (constant context overhead)
- Using MCP when a CLI tool exists (unnecessary context consumption)
- Not monitoring context usage after adding servers
- Forgetting that background subagents cannot use MCP tools
- Not using tool search threshold for large tool sets

Ref: https://code.claude.com/docs/en/mcp
Ref: https://code.claude.com/docs/en/costs
