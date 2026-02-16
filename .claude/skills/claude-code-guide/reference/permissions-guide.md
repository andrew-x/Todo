# Permission and Security Best Practices

Actionable guide for configuring Claude Code permissions and security.

## Permission System Overview

Claude Code uses a tiered permission system:

| Tool type         | Example          | Approval required | "Don't ask again" scope       |
| ----------------- | ---------------- | ----------------- | ----------------------------- |
| Read-only         | File reads, Grep | No                | N/A                           |
| Bash commands     | Shell execution  | Yes               | Permanent per project+command |
| File modification | Edit/write files | Yes               | Until session end             |

## Permission Modes

Set via `defaultMode` in settings or use Shift+Tab to toggle plan mode:

| Mode                | Description                               |
| ------------------- | ----------------------------------------- |
| `default`           | Prompts for permission on first use       |
| `acceptEdits`       | Auto-accepts file edits for session       |
| `plan`              | Read-only — no modifications or commands  |
| `dontAsk`           | Auto-denies unless pre-approved via rules |
| `delegate`          | Coordination-only for agent team leads    |
| `bypassPermissions` | Skips all checks (containers/VMs only!)   |

## Rule Evaluation Order

**deny -> ask -> allow** — first match wins. Deny rules always take precedence.

## Rule Syntax

### Match all uses of a tool

```
Bash          # All Bash commands
Read          # All file reads
Edit          # All file edits
WebFetch      # All web fetches
```

### Specifiers for fine-grained control

```
Bash(npm run build)          # Exact command match
Bash(npm run *)              # Glob wildcard
Read(./.env)                 # Specific file
WebFetch(domain:example.com) # Specific domain
Task(Explore)                # Specific subagent
Skill(commit)                # Specific skill
Skill(review-pr *)           # Skill with arguments
mcp__puppeteer               # All tools from MCP server
mcp__puppeteer__navigate     # Specific MCP tool
```

### Wildcard patterns for Bash

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Bash(* --version)",
      "Bash(* --help *)"
    ],
    "deny": ["Bash(git push *)", "Bash(rm -rf *)"]
  }
}
```

Space before `*` matters: `Bash(ls *)` matches `ls -la` but NOT `lsof`.

## Read and Edit Patterns (gitignore spec)

| Pattern  | Meaning                       | Example                          |
| -------- | ----------------------------- | -------------------------------- |
| `//path` | Absolute filesystem path      | `Read(//Users/alice/secrets/**)` |
| `~/path` | Home directory relative       | `Read(~/.zshrc)`                 |
| `/path`  | Relative to settings file     | `Edit(/src/**/*.ts)`             |
| `path`   | Relative to current directory | `Read(*.env)`                    |

**Warning**: `/Users/alice/file` is NOT absolute — it is relative to settings file. Use `//Users/alice/file`.

`*` matches files in one directory. `**` matches recursively.

## Good Configuration Example

```json
{
  "permissions": {
    "allow": [
      "Bash(yarn *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash(git push --force *)",
      "Bash(rm -rf *)",
      "Read(*.env)",
      "Read(**/credentials*)"
    ]
  }
}
```

## Bad Configuration Example

```json
{
  "permissions": {
    "allow": ["Bash"]
  }
}
```

Problem: allows ALL Bash commands without approval. Use specific patterns.

## Disabling Subagents

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-agent)"]
  }
}
```

Or via CLI: `claude --disallowedTools "Task(Explore)"`

## Sandboxing

Use `/sandbox` for OS-level file and network isolation on Bash commands:

- Permissions control which tools Claude can USE
- Sandboxing prevents Bash commands from ACCESSING restricted resources
- Use both for defense-in-depth

## Managed Settings (Organizations)

Deploy `managed-settings.json` to system directories:

- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux: `/etc/claude-code/managed-settings.json`

Managed-only settings:

- `disableBypassPermissionsMode` — prevent `bypassPermissions`
- `allowManagedPermissionRulesOnly` — only managed rules apply
- `allowManagedHooksOnly` — only managed hooks and SDK hooks allowed
- `strictKnownMarketplaces` — controls allowed plugin marketplaces

## Settings Precedence

Managed > CLI args > Local project > Shared project > User settings.

If a permission is allowed in user settings but denied in project settings, the project setting wins.

## Common Mistakes

- Using `/path` thinking it is absolute (it is relative to settings file — use `//path`)
- Allowing `Bash` without specifier (permits ALL commands)
- Using `--dangerously-skip-permissions` outside containers
- Not combining permissions with sandboxing
- Trusting Bash argument constraints (use PreToolUse hooks for reliable validation)
- Forgetting that Bash is aware of shell operators (`safe-cmd && evil-cmd` is blocked)

## Working Directories

- Default: directory where Claude was launched
- Extend with: `--add-dir <path>`, `/add-dir`, or `additionalDirectories` in settings
- Additional directories follow same permission rules

Ref: https://code.claude.com/docs/en/permissions
