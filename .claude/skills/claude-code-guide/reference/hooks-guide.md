# Hooks Configuration Best Practices

Actionable guide for configuring and maintaining Claude Code hooks.

## What Hooks Are

Hooks are user-defined shell commands, LLM prompts, or agents that execute automatically
at specific points in Claude Code's lifecycle. Use hooks when an action MUST happen every
time with zero exceptions — do not rely on CLAUDE.md instructions for these.

## Configuration Locations

| Location                      | Scope                        |
| ----------------------------- | ---------------------------- |
| `~/.claude/settings.json`     | All your projects            |
| `.claude/settings.json`       | Current project (shareable)  |
| `.claude/settings.local.json` | Current project (gitignored) |
| Managed policy settings       | Organization-wide            |
| Plugin `hooks/hooks.json`     | Where plugin enabled         |
| Skill/agent frontmatter       | While component active       |

## Available Hook Events

| Event                | When                         | Matcher                                                              | Can Block? |
| -------------------- | ---------------------------- | -------------------------------------------------------------------- | ---------- |
| `SessionStart`       | Session begins/resumes       | startup, resume, clear, compact                                      | No         |
| `UserPromptSubmit`   | User submits prompt          | No matcher                                                           | Yes        |
| `PreToolUse`         | Before tool executes         | Tool name                                                            | Yes        |
| `PermissionRequest`  | Permission dialog shown      | Tool name                                                            | Yes        |
| `PostToolUse`        | After tool succeeds          | Tool name                                                            | No         |
| `PostToolUseFailure` | After tool fails             | Tool name                                                            | No         |
| `Notification`       | Notification sent            | permission_prompt, idle_prompt, auth_success, elicitation_dialog     | No         |
| `SubagentStart`      | Subagent spawned             | Agent type name                                                      | No         |
| `SubagentStop`       | Subagent finishes            | Agent type name                                                      | Yes        |
| `Stop`               | Claude finishes responding   | No matcher                                                           | Yes        |
| `TeammateIdle`       | Agent team member going idle | No matcher                                                           | Yes        |
| `TaskCompleted`      | Task marked completed        | No matcher                                                           | Yes        |
| `PreCompact`         | Before compaction            | manual, auto                                                         | No         |
| `SessionEnd`         | Session terminates           | clear, logout, prompt_input_exit, bypass_permissions_disabled, other | No         |

## Hook Types

### Command hooks (default timeout: 600s)

```json
{
  "type": "command",
  "command": "./scripts/validate.sh",
  "timeout": 600,
  "statusMessage": "Validating..."
}
```

### Prompt hooks (default timeout: 30s)

```json
{
  "type": "prompt",
  "prompt": "Evaluate if $ARGUMENTS should proceed",
  "model": "haiku"
}
```

### Agent hooks (default timeout: 60s)

```json
{
  "type": "agent",
  "prompt": "Verify tests pass: $ARGUMENTS",
  "model": "sonnet"
}
```

Common fields: `timeout`, `statusMessage` (custom spinner text). In skill/agent frontmatter: `once: true` runs hook only once per session.

## Good Configuration Example

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lint-check.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous.sh"
          }
        ]
      }
    ]
  }
}
```

## Exit Code Behavior

- **Exit 0**: Success. Parse stdout for JSON output
- **Exit 2**: Block. stderr fed back as error message
- **Other**: Non-blocking error. stderr shown in verbose mode

## JSON Output (exit 0 only)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Destructive command blocked"
  }
}
```

Universal fields: `continue` (false to stop Claude), `stopReason`, `suppressOutput`, `systemMessage`.

PostToolUse can also return `updatedMCPToolOutput` to modify MCP tool results before Claude sees them.

## Common Hook Input (stdin JSON)

All events receive: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`.
Tool events add: `tool_name`, `tool_input`, `tool_use_id`.

## Matcher Patterns

- Matchers are regex: `Edit|Write` matches either tool
- `Notebook.*` matches anything starting with Notebook
- `mcp__memory__.*` matches all memory server tools
- Omit matcher or use `"*"` to match all occurrences

## MCP Tool Matching

MCP tools follow pattern `mcp__<server>__<tool>`:

- `mcp__memory__.*` — all memory server tools
- `mcp__.*__write.*` — any write tool from any server

## Async Hooks

```json
{
  "type": "command",
  "command": "./run-tests.sh",
  "async": true,
  "timeout": 300
}
```

Async hooks run in background without blocking. Cannot return decisions.

## Environment Variables

- `$CLAUDE_PROJECT_DIR` — project root
- `${CLAUDE_PLUGIN_ROOT}` — plugin root
- `$CLAUDE_CODE_REMOTE` — "true" in remote environments
- `CLAUDE_ENV_FILE` — SessionStart only, for persisting env vars

## Common Mistakes

- Forgetting matchers are regex (unescaped `.` matches any character)
- Using matchers on events that do not support them (Stop, UserPromptSubmit)
- Returning JSON on exit code 2 (ignored — only exit 0 JSON is parsed)
- Not quoting `$CLAUDE_PROJECT_DIR` in commands (fails on paths with spaces)
- Creating infinite Stop hook loops (check `stop_hook_active` field)
- Not making hook scripts executable (`chmod +x`)

## Testing Hooks

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | ./block-dangerous.sh
echo $?  # Should be 2
```

## Debugging

Run `claude --debug` to see hook execution details. Toggle verbose mode with `Ctrl+O`.

Ref: https://code.claude.com/docs/en/hooks
