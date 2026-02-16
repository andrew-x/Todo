---
name: claude-code-guide
description: >
  Comprehensive Claude Code setup optimization. Use when asked to improve,
  audit, review, or optimize Claude Code configuration — including CLAUDE.md,
  skills, subagents, hooks, permissions, MCP servers, or any .claude/ settings.
  Also use when creating new skills, agents, or hooks to ensure they follow
  best practices. Activate when user says "optimize", "improve setup",
  "audit config", "best practices", or "fix my claude code setup".
---

# Claude Code Setup Optimization

Comprehensive reference for auditing, improving, and maintaining a Claude Code configuration.
For detailed guidance on each topic, see the reference files in this skill's `reference/` directory.
For the latest official docs, see the `cc-docs/` directory.

## 1. Quick Audit Checklist

Run through these checks when auditing a setup:

1. CLAUDE.md exists and is under ~500 lines (warn at 200+, recommend moving content to skills)
2. CLAUDE.md contains: build/test commands, code style rules, project structure, workflow rules
3. CLAUDE.md does NOT contain: domain knowledge that belongs in skills, verbose examples, duplicated info
4. Skills directory exists and skills have proper SKILL.md with `name` + `description` frontmatter
5. No SKILL.md exceeds 500 lines (move detailed content to reference/ files)
6. Subagents in `.claude/agents/` have `name`, `description`, appropriate `tools` list, and `model`
7. Hooks in settings.json use correct event names and valid matchers
8. Permissions are intentional — use wildcard syntax and `/permissions` to manage rules
9. MCP servers are audited for context overhead — prefer CLI tools when available
10. No redundant or conflicting rules across CLAUDE.md and skills
11. Run the audit script: `.claude/skills/claude-code-guide/scripts/audit-config.sh`

## 2. CLAUDE.md Optimization Rules

See `reference/claude-md-guide.md` for complete guidance.

- Use absolute directives ("Always X", "Never Y") — not suggestions
- Lead with WHY when the reason is not obvious
- Use bullets, not paragraphs — each rule should be one line
- Be concrete: include actual commands, file paths, patterns
- Remove any rule Claude already follows without being told
- Keep under ~500 lines total; under 200 is ideal
- Use `@path/to/file` imports to point to detailed docs rather than inlining them
- Place the most important rules at the TOP of the file
- Group rules by category with clear `##` headers
- Use `/init` to bootstrap, then refine
- After every correction from the user, consider adding a rule to prevent recurrence
- Use `.claude/rules/*.md` for modular, topic-specific rules (supports `paths:` frontmatter)
- Use `CLAUDE.local.md` for personal preferences (auto-gitignored)

Ref: https://code.claude.com/docs/en/memory

## 3. Skills Optimization Rules

See `reference/skills-guide.md` for complete guidance.

- Every skill MUST have a SKILL.md with `description` in YAML frontmatter
- `name` is optional — defaults to directory name if omitted
- Description must answer: "What does this do?" AND "When should Claude use it?"
- Include trigger keywords in description that users would naturally say
- Keep SKILL.md under 500 lines; use `reference/` subdirectory for detailed docs
- Reference supporting files from SKILL.md so Claude knows what they contain
- Set `disable-model-invocation: true` for skills with side effects (deploy, commit)
- Set `user-invocable: false` for background knowledge skills
- Use `context: fork` with an explicit task to run skills in isolation
- Use `allowed-tools` to restrict tool access when a skill does not need full capabilities
- Use `$ARGUMENTS` for dynamic input; `$ARGUMENTS[N]` or `$N` for positional args
- Personal skills: `~/.claude/skills/`; project skills: `.claude/skills/`
- Skills load on-demand (only description in context until invoked)
- Include "ultrathink" in skill content to enable extended thinking when needed
- Subagents preload skills with the `skills:` field (full content injected at startup)
- Use `!`command`` syntax to inject dynamic context from shell commands

Ref: https://code.claude.com/docs/en/skills

## 4. Subagent Optimization Rules

See `reference/subagents-guide.md` for complete guidance.

- Define in `.claude/agents/` (project) or `~/.claude/agents/` (personal) as markdown files
- Required frontmatter: `name`, `description`
- Available frontmatter fields: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `memory`
- The markdown body IS the system prompt (no separate `prompt` field in file-based agents; CLI `--agents` uses `prompt` key)
- Restrict tools to minimum needed (e.g., `Read, Glob, Grep` for read-only reviewers)
- Use `model: haiku` for simple/cheap tasks, `model: sonnet` for balanced, `model: opus` for complex
- Subagents CANNOT spawn other subagents (no nesting)
- Use `memory: user` to give subagents persistent knowledge across sessions
- Use the `skills:` field to preload specific skills into subagent context
- Subagents can define their own hooks in frontmatter (PreToolUse, PostToolUse, Stop)
- Use `permissionMode: plan` for read-only agents, `dontAsk` for pre-approved-only agents
- Disable specific subagents via `permissions.deny: ["Task(agent-name)"]`
- Built-in agents: Explore (haiku, read-only), Plan (inherits, read-only), general-purpose (inherits, all tools)
- Subagents loaded at session start — restart session or use `/agents` after manual file creation

Ref: https://code.claude.com/docs/en/sub-agents

## 5. Hooks Optimization Rules

See `reference/hooks-guide.md` for complete guidance.

- Hooks go in settings.json (user: `~/.claude/settings.json`, project: `.claude/settings.json`)
- Available events: PreToolUse, PostToolUse, PostToolUseFailure, Notification, UserPromptSubmit, SessionStart, SessionEnd, Stop, SubagentStart, SubagentStop, PreCompact, PermissionRequest, TeammateIdle, TaskCompleted
- Three hook types: `command` (shell scripts), `prompt` (LLM evaluation), `agent` (multi-turn verification)
- Matchers are regex, case-sensitive, matching tool_name for tool events
- UserPromptSubmit, Stop, TeammateIdle, TaskCompleted do NOT support matchers
- Use hooks (not CLAUDE.md) for actions that MUST happen every time with zero exceptions
- Hook scripts receive JSON on stdin — use jq or a script language to parse
- Exit code 0 = allow (parse JSON from stdout), exit code 2 = block (stderr as error)
- JSON output enables: `permissionDecision` (allow/deny/ask), `additionalContext`, `updatedInput`
- Skills and subagents can define scoped hooks in their frontmatter
- Use `$CLAUDE_PROJECT_DIR` for project-relative paths in hook commands
- Use `async: true` for long-running hooks that should not block Claude
- Test hooks: `echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./hook.sh`

Ref: https://code.claude.com/docs/en/hooks

## 6. Permissions Optimization Rules

See `reference/permissions-guide.md` for complete guidance.

- Use `/permissions` to view and manage allow/ask/deny rules
- Rules evaluate in order: deny -> ask -> allow (first match wins)
- Use wildcard syntax: `Bash(npm run *)`, `Edit(/docs/**)`, `Read(~/.zshrc)`
- Use `//path` for absolute filesystem paths (NOT `/path` which is relative to settings file)
- Never use `--dangerously-skip-permissions` outside of isolated containers/VMs
- Deny dangerous tools for subagents that do not need them
- Permission modes: `default`, `acceptEdits`, `plan`, `dontAsk`, `bypassPermissions`, `delegate`
- For teams: use managed-settings.json for organization-wide policies
- Bash rules support glob patterns with `*` at any position
- `Edit` and `Read` rules follow gitignore specification
- Combine permissions with sandboxing (`/sandbox`) for defense-in-depth

Ref: https://code.claude.com/docs/en/permissions

## 7. MCP Server Rules

See `reference/mcp-guide.md` for complete guidance.

- MCP extends Claude with external service access (GitHub, databases, Playwright, etc.)
- Configure in `.mcp.json` at project root or via settings
- Each MCP server adds tool definitions to context permanently — audit what is needed
- When MCP tool descriptions exceed 10% of context window, tool search auto-activates
- Set `ENABLE_TOOL_SEARCH=auto:<N>` to trigger earlier (e.g., `auto:5` for 5%)
- Prefer CLI tools when available (`gh`, `aws`, `gcloud`, `sentry-cli`) — no context overhead
- Disable unused servers via `/mcp`
- Run `/context` to see what is consuming context space
- MCP tools appear in hooks as `mcp__<server>__<tool>` — matchable with regex
- MCP tools are NOT available in background subagents

Ref: https://code.claude.com/docs/en/mcp

## 8. Anti-Bloat Meta-Rules

See `reference/anti-patterns.md` for common pitfalls and the 5 official failure modes from best-practices.

- Before adding any rule to CLAUDE.md, check if Claude already follows it
- Before adding a rule, check for existing rules that cover the same case — merge, do not duplicate
- When a rule becomes unnecessary (Claude consistently follows it), remove it
- Every rule must be actionable and testable — no vague aspirational statements
- Prefer 1 concrete rule over 3 vague ones
- After optimization, verify total CLAUDE.md line count and report it
- After optimization, count total skills and report active vs available
- Periodically consolidate: merge similar rules, remove superseded ones, tighten wording
- Move specialized domain knowledge from CLAUDE.md to skills (on-demand loading saves context)
- Rules at the beginning and end of documents get more attention than rules in the middle

## 9. Self-Modification Protocol

When this skill is used to modify configuration:

1. **AUDIT FIRST**: Read all .claude/ config files, CLAUDE.md, settings.json, list existing skills/agents
2. **IDENTIFY**: List specific issues found, categorized by severity (critical/warning/suggestion)
3. **PROPOSE**: Present all proposed changes to the user with rationale for each
4. **WAIT FOR APPROVAL**: Never modify configuration without explicit user approval
5. **APPLY**: Make changes one category at a time
6. **VERIFY**: After changes, re-run audit to confirm improvements and report before/after metrics — verification is the single highest-leverage practice
7. **DOCUMENT**: If significant changes were made, update CLAUDE.md with a brief note about what changed
8. **ITERATE**: If Claude gets it wrong twice on the same issue, `/clear` and start fresh with a better prompt — polluted context rarely recovers

## 10. Context Window Awareness

- Context window is your most precious resource — performance degrades as it fills
- Use `/clear` between unrelated tasks; `/rename` first to save session for later `/resume`
- Use `/compact` when context is large but you need continuity; add custom instructions
- Track token usage with `/cost` or configure status line to display it
- Prefer skills with progressive disclosure over inlining everything in CLAUDE.md
- Subagents preserve main context by running analysis in isolation
- Install code intelligence plugins for typed languages — reduces unnecessary file reads
- Use specific prompts — vague requests trigger broad scanning
- Use plan mode (Shift+Tab) for complex tasks to prevent expensive re-work
- Use Escape to stop early; `/rewind` or double-Escape to restore to a checkpoint
- Extended thinking budget defaults to 31,999 tokens — lower with `MAX_THINKING_TOKENS=N` for simpler tasks
- Model aliases: `sonnet` (daily tasks), `opus` (complex reasoning), `haiku` (simple/cheap), `opusplan` (opus for planning, sonnet for execution)
- Fast mode (`/fast`): 2.5x faster Opus output at higher cost; toggle mid-session
- Effort level: adjust Opus 4.6 reasoning depth via `/model` slider or `CLAUDE_CODE_EFFORT_LEVEL=low|medium|high`
- Extended context: append `[1m]` to model alias for 1M token context window (e.g., `sonnet[1m]`)
- Task list: Claude auto-tracks multi-step work; toggle with `Ctrl+T`; persists across compactions
- "Let Claude interview you" pattern: for complex features, have Claude ask clarifying questions before implementation
- After 2+ corrections on the same issue → `/clear` and rewrite the prompt; polluted context rarely recovers

Ref: https://code.claude.com/docs/en/costs
