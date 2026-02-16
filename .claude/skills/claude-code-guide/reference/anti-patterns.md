# Known Anti-Patterns and Failure Modes

Common mistakes and how to fix them when configuring Claude Code.

## CLAUDE.md Anti-Patterns

### Bloated CLAUDE.md

**Problem**: CLAUDE.md over 500 lines with domain knowledge, tutorials, and verbose examples.
**Impact**: Consumes context at every session start. Rules in the middle get less attention.
**Fix**: Move specialized content to skills (on-demand loading). Use `@imports` for referenced docs. Keep under 200 lines ideally.

### Vague Instructions

**Problem**: "Try to use good practices" or "Consider performance when possible."
**Impact**: Claude ignores vague guidance — it is not actionable.
**Fix**: Use absolute directives. "Always validate user input at API boundaries." "Never use `any` type."

### Redundant Rules

**Problem**: Multiple rules saying the same thing in different sections.
**Impact**: Wastes context budget and can create contradictions.
**Fix**: Consolidate. One clear rule beats three overlapping ones.

### Rules Claude Already Follows

**Problem**: Adding rules for behavior Claude exhibits by default (e.g., "use TypeScript types").
**Impact**: Wastes instruction budget on things that do not need reinforcement.
**Fix**: Test by removing the rule. If behavior persists, delete it.

### Outdated Commands

**Problem**: Build/test commands in CLAUDE.md that no longer work.
**Impact**: Claude runs wrong commands, wastes turns debugging them.
**Fix**: Review commands periodically. Run them yourself to verify.

## Skills Anti-Patterns

### Giant SKILL.md

**Problem**: SKILL.md over 500 lines with all reference material inlined.
**Impact**: Full content loads when invoked — large files waste context.
**Fix**: Keep SKILL.md focused. Move detailed docs to `reference/` files.

### Missing or Vague Description

**Problem**: No description, or "Useful tool for various tasks."
**Impact**: Claude cannot determine when to auto-invoke the skill.
**Fix**: Description must answer WHAT and WHEN with natural trigger keywords.

### Orphaned Supporting Files

**Problem**: Reference files exist but are not mentioned in SKILL.md.
**Impact**: Claude does not know they exist or when to load them.
**Fix**: Reference every supporting file from SKILL.md with a brief description of contents.

### context: fork Without a Task

**Problem**: Using `context: fork` on a skill that only contains guidelines/conventions.
**Impact**: Subagent receives guidelines but no actionable prompt — returns nothing useful.
**Fix**: Only use `context: fork` when SKILL.md contains an explicit task to execute.

## Subagent Anti-Patterns

### Over-Broad Tool Access

**Problem**: Not specifying `tools` field (inherits everything).
**Impact**: Subagent can modify files, run commands — potential damage, wasted context on tool definitions.
**Fix**: Always specify minimum tools needed. Read-only reviewers: `tools: Read, Grep, Glob`.

### Subagent for Trivial Tasks

**Problem**: Using a subagent for a task that takes one or two tool calls.
**Impact**: Significant context overhead per invocation.
**Fix**: Use subagents for tasks that produce verbose output or need isolation. Simple tasks run in main context.

### No Model Specified

**Problem**: Omitting `model` field (inherits parent — may be expensive Opus).
**Impact**: Simple search tasks running on Opus when Haiku would suffice.
**Fix**: Set `model: haiku` for simple tasks, `model: sonnet` for standard work.

### Expecting Skill Inheritance

**Problem**: Assuming subagents have access to parent's skills.
**Impact**: Subagent lacks needed context — produces wrong results.
**Fix**: Explicitly list needed skills in the `skills:` frontmatter field.

## Hooks Anti-Patterns

### Infinite Stop Hook Loop

**Problem**: Stop hook blocks Claude from stopping without checking `stop_hook_active`.
**Impact**: Claude runs forever, consuming tokens until context fills.
**Fix**: Always check `stop_hook_active` in Stop hooks. Limit iterations.

### JSON on Exit Code 2

**Problem**: Printing JSON to stdout and exiting with code 2.
**Impact**: JSON is completely ignored on exit 2 — only stderr is used.
**Fix**: Use exit 0 with JSON for structured control. Use exit 2 only for simple blocking with stderr message.

### Unescaped Regex Matchers

**Problem**: Using `.` in matchers without escaping (matches any character).
**Impact**: Hook triggers on unintended tools.
**Fix**: Escape special regex characters: `Notebook\.Edit` not `Notebook.Edit`.

### Unquoted Path Variables

**Problem**: `$CLAUDE_PROJECT_DIR/.claude/hooks/script.sh` without quotes.
**Impact**: Breaks on paths with spaces.
**Fix**: Always quote: `"$CLAUDE_PROJECT_DIR"/.claude/hooks/script.sh`.

## Permission Anti-Patterns

### Allow All Bash

**Problem**: `"allow": ["Bash"]` without any specifier.
**Impact**: Every Bash command auto-approved — no safety net.
**Fix**: Use specific patterns: `Bash(npm run *)`, `Bash(git status)`.

### bypassPermissions in Development

**Problem**: Using `bypassPermissions` on your development machine.
**Impact**: No safety checks — destructive commands execute without prompt.
**Fix**: Only use in isolated containers/VMs. Use `dontAsk` with specific allow rules instead.

### Path Confusion

**Problem**: Using `/path/to/file` thinking it is absolute.
**Impact**: Resolves relative to settings file, not filesystem root.
**Fix**: Use `//path/to/file` for absolute paths.

## MCP Anti-Patterns

### Too Many Servers

**Problem**: 5+ MCP servers enabled "just in case."
**Impact**: Tool definitions consume context permanently, degrading performance.
**Fix**: Disable unused servers. Prefer CLI tools. Audit with `/context`.

### MCP Instead of CLI

**Problem**: Using GitHub MCP when `gh` CLI is available.
**Impact**: Unnecessary context overhead from tool definitions.
**Fix**: Use `gh`, `aws`, `gcloud`, `sentry-cli` etc. directly via Bash.

## General Anti-Patterns (5 Official Failure Modes)

### 1. The Kitchen Sink Session

**Problem**: Start one task, ask unrelated questions, jump back to original.
**Impact**: Context fills with irrelevant info, degrading performance on everything.
**Fix**: `/clear` between unrelated tasks. `/rename` first to save for `/resume`.

### 2. Correcting Over and Over

**Problem**: Claude gets it wrong, you correct, still wrong, correct again.
**Impact**: Failed approaches pollute context; Claude works against its own history.
**Fix**: After 2 corrections on the same issue, `/clear` and write a better initial prompt.

### 3. The Over-Specified CLAUDE.md

**Problem**: CLAUDE.md is so long that rules get buried and ignored.
**Impact**: Claude skips rules in the middle; contradictions emerge.
**Fix**: Ruthlessly prune. If Claude does it correctly without the rule, delete it. Convert critical rules to hooks.

### 4. The Trust-Then-Verify Gap

**Problem**: Accepting Claude's output without verification.
**Impact**: Plausible-looking code that fails on edge cases ships to production.
**Fix**: Include tests, screenshots, or expected outputs so Claude can self-verify. This is the single highest-leverage practice.

### 5. The Infinite Exploration

**Problem**: Asking Claude to "investigate" without scoping the search.
**Impact**: Reads hundreds of files, fills context with irrelevant information.
**Fix**: Scope narrowly ("check src/auth for the login bug") or delegate to subagents.

### Ignoring Context Usage

**Problem**: Never checking context consumption.
**Impact**: Performance degrades silently as context fills.
**Fix**: Use `/cost`, `/context`, and configure status line for continuous monitoring.

### Duplicated Configuration

**Problem**: Same rules in CLAUDE.md, skills, and settings.json.
**Impact**: Conflicting or redundant instructions waste attention budget.
**Fix**: Single source of truth. CLAUDE.md for global rules, skills for domain knowledge, settings for permissions/hooks.
