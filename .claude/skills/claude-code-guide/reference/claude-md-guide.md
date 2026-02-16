# CLAUDE.md Authoring Best Practices

Actionable guide for writing and maintaining effective CLAUDE.md files.

## What CLAUDE.md Is

CLAUDE.md is loaded into context at every session start. It provides persistent instructions,
project context, and rules that Claude follows throughout the session. It is your primary
mechanism for controlling Claude's behavior.

## File Locations (Priority Order)

| Location                                                             | Purpose              | Shared                |
| -------------------------------------------------------------------- | -------------------- | --------------------- |
| Managed policy (`/Library/Application Support/ClaudeCode/CLAUDE.md`) | Organization-wide    | All users             |
| Project (`./CLAUDE.md` or `./.claude/CLAUDE.md`)                     | Team shared          | Via source control    |
| Project rules (`./.claude/rules/*.md`)                               | Modular topic rules  | Via source control    |
| User (`~/.claude/CLAUDE.md`)                                         | Personal all-project | Just you              |
| Local (`./CLAUDE.local.md`)                                          | Personal per-project | Just you (gitignored) |

More specific instructions take precedence over broader ones.

## What to Include

- Build/test/lint commands with exact syntax
- Code style rules and naming conventions
- Project structure overview (key directories, patterns)
- Workflow rules (PR process, commit conventions)
- Technology-specific patterns (ORM conventions, auth patterns)
- Import conventions and file organization rules
- Custom compaction instructions (`# Compact instructions` section)

## What NOT to Include

- Domain knowledge that belongs in skills (load on demand, not always)
- Verbose examples or tutorials (use `@path/to/file` imports)
- Information Claude already knows without being told
- Rapidly changing information (version numbers, temporary URLs)
- Duplicate rules across sections

## Writing Rules

### Do This

```markdown
## Build Commands

- `yarn dev` — run dev server
- `yarn test` — run all tests
- `yarn lint` — check code style

## Code Style

- Always use absolute imports (`@/components/...`)
- Prefer named functions over arrow functions
- Use snake_case for database columns
```

### Not This

```markdown
## General Guidelines

It would be nice if you could try to use absolute imports when possible.
Also, we generally prefer named functions but arrow functions are ok too.
For the database, we usually use snake_case but sometimes camelCase.
```

## Key Principles

- **Be directive**: "Always X", "Never Y" — not "try to" or "when possible"
- **Be concrete**: Include actual commands, paths, and patterns
- **Be concise**: One rule per bullet, bullets not paragraphs
- **Be organized**: Group rules under clear `##` headers
- **Lead with WHY** when the reason is not obvious
- **Place important rules first** — beginning and end of file get more attention

## Using Imports

Use `@path/to/file` to reference external files without inlining them:

```markdown
See @README for project overview and @package.json for available commands.

- Git workflow: @docs/git-instructions.md
```

- Relative paths resolve relative to the file containing the import
- Max import depth: 5 hops
- First-time imports require user approval (one-time per project; declining is permanent)

## Modular Rules with .claude/rules/

For larger projects, use `.claude/rules/*.md` for topic-specific files:

```
.claude/rules/
├── code-style.md
├── testing.md
├── api-design.md
└── security.md
```

Rules can be path-scoped with YAML frontmatter:

```yaml
---
paths:
  - 'src/api/**/*.ts'
---
# API Rules
- All endpoints must include input validation
```

## Size Guidelines

- **Ideal**: Under 200 lines
- **Warning**: 200-500 lines (consider moving content to skills or rules/)
- **Error**: Over 500 lines (actively degrades performance)

## Auto Memory

Claude Code can automatically write notes to `~/.claude/projects/<project>/memory/MEMORY.md`:

- First 200 lines loaded at session start
- Managed via `/memory` command
- Opt in/out: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=0` (enable) or `=1` (disable)
- Auto memory is for Claude's own reference — CLAUDE.md is for user-authored rules

## Maintenance Checklist

- [ ] Line count is under 200 (or under 500 with justification)
- [ ] No rules Claude already follows without being told
- [ ] No duplicate rules across sections
- [ ] All rules are actionable and testable
- [ ] Build/test/lint commands are present and current
- [ ] Domain knowledge is in skills, not inlined
- [ ] Imports are used for referenced documentation

Ref: https://code.claude.com/docs/en/memory
