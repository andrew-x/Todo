# Skills Authoring Best Practices

Actionable guide for creating and maintaining Claude Code skills.

## What Skills Are

Skills are SKILL.md files with instructions that extend Claude's capabilities. They load
on-demand (only description in context until invoked), making them ideal for specialized
knowledge that should not consume context at all times.

## Directory Structure

```
my-skill/
├── SKILL.md           # Main instructions (required, under 500 lines)
├── reference/         # Detailed docs loaded on demand
│   └── api-docs.md
├── examples/
│   └── sample.md
└── scripts/
    └── helper.sh
```

## Skill Locations

| Location   | Path                               | Scope             |
| ---------- | ---------------------------------- | ----------------- |
| Enterprise | Managed settings                   | All org users     |
| Personal   | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project    | `.claude/skills/<name>/SKILL.md`   | Current project   |
| Plugin     | `<plugin>/skills/<name>/SKILL.md`  | Where enabled     |

Priority: enterprise > personal > project. Plugin skills use namespaced names.

Monorepo support: skills in nested `.claude/skills/` directories are auto-discovered when Claude reads files in those subdirectories. Skills from `--add-dir` directories are also loaded and support live change detection.

## Frontmatter Reference

```yaml
---
name: my-skill # Optional, defaults to dir name (a-z, 0-9, hyphens, max 64 chars)
description: What and when # Recommended — drives auto-invocation
argument-hint: '[issue-number]' # Hint shown in autocomplete
disable-model-invocation: true # Only user can invoke (manual /name)
user-invocable: false # Only Claude can invoke (background knowledge)
allowed-tools: Read, Grep, Glob # Restrict tool access
model: sonnet # Model to use when active
context: fork # Run in forked subagent context
agent: Explore # Agent type for context: fork
hooks: # Lifecycle hooks scoped to this skill
  PreToolUse:
    - matcher: 'Bash'
      hooks:
        - type: command
          command: './validate.sh'
---
```

## Invocation Control

| Frontmatter                      | User invokes | Claude invokes | Context loading                                  |
| -------------------------------- | ------------ | -------------- | ------------------------------------------------ |
| (default)                        | Yes          | Yes            | Description always, full on invoke               |
| `disable-model-invocation: true` | Yes          | No             | Description NOT in context; full loads on invoke |
| `user-invocable: false`          | No           | Yes            | Description always, full on invoke               |

## Good Skill Description

```yaml
description: >
  Reviews pull requests for code quality and security. Use when reviewing PRs,
  after code changes, or when user asks to "review", "check code", or "audit".
```

The description must:

- Explain WHAT the skill does
- Explain WHEN Claude should use it
- Include natural trigger keywords

## Bad Skill Description

```yaml
description: Code review tool
```

Too vague — Claude cannot determine when to use it.

## String Substitutions

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `$ARGUMENTS`           | All arguments passed when invoking |
| `$ARGUMENTS[N]`        | Specific argument by 0-based index |
| `$N`                   | Shorthand for `$ARGUMENTS[N]`      |
| `${CLAUDE_SESSION_ID}` | Current session ID                 |

## Dynamic Context Injection

Use `` !`command` `` to run shell commands before content reaches Claude:

```yaml
---
name: pr-summary
context: fork
agent: Explore
---
## PR Context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`
```

## Extended Thinking

Include "ultrathink" anywhere in skill content to enable extended thinking:

```yaml
---
name: architect
description: Deep architectural analysis
---
ultrathink

Analyze the codebase architecture thoroughly...
```

## Running in a Subagent

Use `context: fork` when the skill should run in isolation:

```yaml
---
name: deep-research
context: fork
agent: Explore
---
Research $ARGUMENTS thoroughly...
```

The `agent` field specifies the execution environment: `Explore`, `Plan`, `general-purpose`, or any custom agent name.

**Warning**: `context: fork` only makes sense for skills with explicit tasks. Guidelines without a task produce no meaningful output.

## Preloading Skills into Subagents

Subagents use the `skills:` field to inject full skill content at startup:

```yaml
# In .claude/agents/api-dev.md
---
name: api-developer
skills:
  - api-conventions
  - error-handling
---
```

This is the inverse of `context: fork` — the subagent controls the system prompt and loads skill content as reference material.

## $ARGUMENTS Fallback

If a skill is invoked with arguments but does not include `$ARGUMENTS` in its content, Claude Code appends `ARGUMENTS: <input>` to the end automatically.

## Legacy Commands

Files in `.claude/commands/` still work with the same frontmatter. If a skill and command share the same name, the skill takes precedence.

## Common Mistakes

- SKILL.md over 500 lines (split into SKILL.md + reference/)
- Missing description (Claude cannot auto-invoke)
- Description too vague (Claude invokes at wrong times)
- Using `context: fork` without an actionable task
- Inlining large reference docs instead of using supporting files
- Not referencing supporting files from SKILL.md

## Troubleshooting

- **Skill not triggering**: Check description keywords, verify with "What skills are available?"
- **Skill triggers too often**: Make description more specific or use `disable-model-invocation: true`
- **Too many skills**: Descriptions have a character budget (2% of context window, ~16k fallback). Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET`. Use `/context` to check.

Ref: https://code.claude.com/docs/en/skills
