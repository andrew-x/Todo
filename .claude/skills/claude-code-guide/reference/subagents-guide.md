# Subagent Configuration Best Practices

Actionable guide for creating and maintaining Claude Code subagents.

## What Subagents Are

Subagents are specialized AI assistants that run in their own context window with a custom
system prompt, specific tool access, and independent permissions. They preserve main context
by keeping exploration and implementation isolated.

## File Format

Markdown files with YAML frontmatter. The body IS the system prompt.

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices. Use proactively after code changes.
tools: Read, Glob, Grep, Bash
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

## Locations (Priority Order)

| Location                   | Scope             | Priority    |
| -------------------------- | ----------------- | ----------- |
| `--agents` CLI flag (JSON) | Current session   | 1 (highest) |
| `.claude/agents/`          | Current project   | 2           |
| `~/.claude/agents/`        | All your projects | 3           |
| Plugin `agents/` directory | Where enabled     | 4 (lowest)  |

## Frontmatter Fields

| Field             | Required | Description                                                                  |
| ----------------- | -------- | ---------------------------------------------------------------------------- |
| `name`            | Yes      | Unique identifier (lowercase, hyphens)                                       |
| `description`     | Yes      | When Claude should delegate to this agent                                    |
| `tools`           | No       | Tool allowlist. Inherits all if omitted                                      |
| `disallowedTools` | No       | Tools to deny from inherited/specified list                                  |
| `model`           | No       | `sonnet`, `opus`, `haiku`, or `inherit` (default)                            |
| `permissionMode`  | No       | `default`, `acceptEdits`, `dontAsk`, `delegate`, `bypassPermissions`, `plan` |
| `maxTurns`        | No       | Maximum agentic turns before stopping                                        |
| `skills`          | No       | Skills to preload (full content injected)                                    |
| `mcpServers`      | No       | MCP servers available to this agent                                          |
| `hooks`           | No       | Lifecycle hooks scoped to this agent                                         |
| `memory`          | No       | `user`, `project`, or `local` for persistent memory                          |

## Built-in Subagents

| Agent             | Model    | Tools           | Purpose                                           |
| ----------------- | -------- | --------------- | ------------------------------------------------- |
| Explore           | Haiku    | Read-only       | Fast codebase search (quick/medium/very thorough) |
| Plan              | Inherits | Read-only       | Research for plan mode                            |
| general-purpose   | Inherits | All             | Complex multi-step tasks                          |
| Bash              | Inherits | Bash            | Terminal commands in separate context             |
| statusline-setup  | Sonnet   | Read, Edit      | `/statusline` configuration                       |
| Claude Code Guide | Haiku    | Read-only + Web | Questions about Claude Code features              |

## Good Configuration Example

Read-only reviewer with minimal tools:

```yaml
---
name: code-reviewer
description: Expert code reviewer. Use proactively after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: sonnet
---
You are a senior code reviewer. Focus on code quality, security, and best practices.
```

## Bad Configuration Example

```yaml
---
name: helper
description: Helps with stuff
---
You are helpful.
```

Problems: vague description, no tool restrictions, no model specified, generic prompt.

## Model Selection Guide

- `haiku` — Simple, fast, cheap tasks (linting, searching, quick checks)
- `sonnet` — Balanced capability and cost (reviews, analysis, standard tasks)
- `opus` — Complex reasoning (architecture, debugging, multi-step analysis)
- `inherit` — Use parent's model (default behavior)

## Persistent Memory

```yaml
---
name: code-reviewer
memory: user
---
You are a code reviewer. Update your agent memory with patterns and
recurring issues you discover.
```

| Scope     | Location                             | Use when                      |
| --------- | ------------------------------------ | ----------------------------- |
| `user`    | `~/.claude/agent-memory/<name>/`     | Learnings across all projects |
| `project` | `.claude/agent-memory/<name>/`       | Project-specific, shareable   |
| `local`   | `.claude/agent-memory-local/<name>/` | Project-specific, not shared  |

When enabled: MEMORY.md first 200 lines loaded at startup, Read/Write/Edit auto-enabled.

## Preloading Skills

```yaml
---
name: api-developer
skills:
  - api-conventions
  - error-handling-patterns
---
Implement API endpoints following the conventions from preloaded skills.
```

Full skill content is injected — not just made available for invocation. Subagents do NOT inherit skills from the parent conversation.

## Hooks in Subagents

```yaml
---
name: db-reader
tools: Bash
hooks:
  PreToolUse:
    - matcher: 'Bash'
      hooks:
        - type: command
          command: './scripts/validate-readonly.sh'
---
```

`Stop` hooks in frontmatter are auto-converted to `SubagentStop` events.

## Key Constraints

- Subagents CANNOT spawn other subagents (no nesting)
- Background subagents auto-deny non-pre-approved permissions
- MCP tools are NOT available in background subagents
- Subagents loaded at session start — restart or use `/agents` after manual creation
- If `bypassPermissions` is set on parent, it takes precedence and cannot be overridden

## Disabling Subagents

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-custom-agent)"]
  }
}
```

## Verification Pattern

Use subagents for post-implementation review:

```
> use a subagent to review this code for edge cases
```

This keeps review context isolated and prevents main context pollution.

## Common Mistakes

- Not specifying `tools` (inherits everything — usually too broad)
- Vague description (Claude delegates at wrong times)
- Using `bypassPermissions` without isolation
- Expecting subagents to inherit parent's skills (they do not)
- Not setting `model` (always inherits — may be expensive)
- Creating subagents for trivial tasks (context overhead is significant)

Ref: https://code.claude.com/docs/en/sub-agents
