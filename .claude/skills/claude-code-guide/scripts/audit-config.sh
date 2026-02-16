#!/usr/bin/env bash
# Claude Code Configuration Audit Script
# Checks .claude/ directory and CLAUDE.md for common issues
# Works on macOS and Linux

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
WARN=0
FAIL=0

pass() { echo -e "  ${GREEN}[PASS]${NC} $1"; PASS=$((PASS + 1)); }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; WARN=$((WARN + 1)); }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; FAIL=$((FAIL + 1)); }
info() { echo -e "  ${BLUE}[INFO]${NC} $1"; }
header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

# Determine project root (git root or cwd)
if git rev-parse --show-toplevel &>/dev/null; then
    PROJECT_ROOT=$(git rev-parse --show-toplevel)
else
    PROJECT_ROOT=$(pwd)
fi

HAS_JQ=false
if command -v jq &>/dev/null; then
    HAS_JQ=true
fi

echo -e "${BLUE}Claude Code Configuration Audit${NC}"
echo "Project: $PROJECT_ROOT"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"

# --- 1. CLAUDE.md ---
header "CLAUDE.md"

CLAUDE_MD=""
if [ -f "$PROJECT_ROOT/CLAUDE.md" ]; then
    CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"
elif [ -f "$PROJECT_ROOT/.claude/CLAUDE.md" ]; then
    CLAUDE_MD="$PROJECT_ROOT/.claude/CLAUDE.md"
fi

if [ -n "$CLAUDE_MD" ]; then
    LINE_COUNT=$(wc -l < "$CLAUDE_MD" | tr -d ' ')
    if [ "$LINE_COUNT" -gt 500 ]; then
        fail "CLAUDE.md is $LINE_COUNT lines (max recommended: 500)"
    elif [ "$LINE_COUNT" -gt 200 ]; then
        warn "CLAUDE.md is $LINE_COUNT lines (consider moving content to skills)"
    else
        pass "CLAUDE.md exists ($LINE_COUNT lines)"
    fi

    # Check for essential sections
    if grep -qiE '(build|test|lint|dev|start)' "$CLAUDE_MD"; then
        pass "Contains build/test/dev commands"
    else
        warn "Missing build/test/dev commands"
    fi
else
    fail "No CLAUDE.md found (check $PROJECT_ROOT/CLAUDE.md or .claude/CLAUDE.md)"
fi

# Check for CLAUDE.local.md
if [ -f "$PROJECT_ROOT/CLAUDE.local.md" ]; then
    info "CLAUDE.local.md exists (personal project preferences)"
fi

# Check for .claude/rules/
if [ -d "$PROJECT_ROOT/.claude/rules" ]; then
    RULE_COUNT=$(find "$PROJECT_ROOT/.claude/rules" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    info "Found $RULE_COUNT rule files in .claude/rules/"
fi

# Check user-level CLAUDE.md
if [ -f "$HOME/.claude/CLAUDE.md" ]; then
    USER_LINES=$(wc -l < "$HOME/.claude/CLAUDE.md" | tr -d ' ')
    info "User CLAUDE.md exists ($USER_LINES lines)"
fi

# --- 2. Skills ---
header "Skills"

check_skills() {
    local dir="$1"
    local scope="$2"

    if [ ! -d "$dir" ]; then
        info "No $scope skills directory ($dir)"
        return
    fi

    local skill_count=0
    for skill_dir in "$dir"/*/; do
        [ -d "$skill_dir" ] || continue
        skill_name=$(basename "$skill_dir")
        skill_md="$skill_dir/SKILL.md"

        if [ ! -f "$skill_md" ]; then
            fail "$scope skill '$skill_name' missing SKILL.md"
            continue
        fi

        skill_count=$((skill_count + 1))

        # Check line count
        local lines
        lines=$(wc -l < "$skill_md" | tr -d ' ')
        if [ "$lines" -gt 500 ]; then
            fail "$scope skill '$skill_name' SKILL.md is $lines lines (max: 500)"
        fi

        # Check for description in frontmatter
        if head -20 "$skill_md" | grep -q "^---" && head -20 "$skill_md" | grep -qi "description"; then
            # Extract description — handle both inline and multi-line YAML (> or |)
            local desc
            desc=$(sed -n '/^---$/,/^---$/p' "$skill_md" | grep -i "^description:" | head -1 | sed 's/^description:[[:space:]]*//i')
            # If description uses > or | folding, grab the next indented line instead
            if [ "$desc" = ">" ] || [ "$desc" = "|" ] || [ -z "$desc" ]; then
                desc=$(sed -n '/^---$/,/^---$/p' "$skill_md" | grep -A1 -i "^description:" | tail -1 | sed 's/^[[:space:]]*//')
            fi
            if [ -n "$desc" ] && [ ${#desc} -gt 10 ]; then
                pass "$scope skill '$skill_name' ($lines lines) — has description"
            else
                warn "$scope skill '$skill_name' — description too short"
            fi
        else
            warn "$scope skill '$skill_name' — missing description in frontmatter"
        fi
    done

    if [ "$skill_count" -eq 0 ]; then
        info "No $scope skills found"
    fi
}

check_skills "$PROJECT_ROOT/.claude/skills" "Project"
check_skills "$HOME/.claude/skills" "User"

# --- 3. Subagents ---
header "Subagents"

check_agents() {
    local dir="$1"
    local scope="$2"

    if [ ! -d "$dir" ]; then
        info "No $scope agents directory ($dir)"
        return
    fi

    for agent_file in "$dir"/*.md; do
        [ -f "$agent_file" ] || continue
        agent_name=$(basename "$agent_file" .md)

        # Check for description in frontmatter
        if head -20 "$agent_file" | grep -q "^---" && head -20 "$agent_file" | grep -qi "description"; then
            # Check for model field
            if head -20 "$agent_file" | grep -qi "^model:"; then
                pass "$scope agent '$agent_name' — has description and model"
            else
                warn "$scope agent '$agent_name' — has description but no model specified"
            fi
        else
            fail "$scope agent '$agent_name' — missing description in frontmatter"
        fi

        # Check for tools field
        if ! head -20 "$agent_file" | grep -qi "^tools:"; then
            warn "$scope agent '$agent_name' — no tools specified (inherits all)"
        fi
    done
}

check_agents "$PROJECT_ROOT/.claude/agents" "Project"
check_agents "$HOME/.claude/agents" "User"

# --- 4. Settings & Hooks ---
header "Settings & Hooks"

check_settings() {
    local file="$1"
    local scope="$2"

    if [ ! -f "$file" ]; then
        info "No $scope settings file ($file)"
        return
    fi

    info "$scope settings file exists"

    if [ "$HAS_JQ" = true ]; then
        # Check for hooks
        local hook_events
        hook_events=$(jq -r '.hooks // {} | keys[]' "$file" 2>/dev/null || true)
        if [ -n "$hook_events" ]; then
            local hook_count=0
            while IFS= read -r event; do
                local count
                count=$(jq -r ".hooks.\"$event\" | length" "$file" 2>/dev/null || echo "0")
                info "  Hook event '$event': $count matcher group(s)"
                hook_count=$((hook_count + count))
            done <<< "$hook_events"
            pass "$scope settings has $hook_count hook matcher group(s)"
        else
            info "No hooks configured in $scope settings"
        fi

        # Check for permission rules
        local allow_count deny_count
        allow_count=$(jq -r '.permissions.allow // [] | length' "$file" 2>/dev/null || echo "0")
        deny_count=$(jq -r '.permissions.deny // [] | length' "$file" 2>/dev/null || echo "0")
        if [ "$allow_count" -gt 0 ] || [ "$deny_count" -gt 0 ]; then
            info "Permission rules: $allow_count allow, $deny_count deny"
        fi

        # Check for dangerous settings
        if jq -e '.permissions.allow[] | select(. == "Bash")' "$file" &>/dev/null; then
            warn "$scope settings allows ALL Bash commands (consider specific patterns)"
        fi
    else
        # Fallback without jq
        if grep -q '"hooks"' "$file"; then
            info "Hooks configured (install jq for detailed analysis)"
        fi
        if grep -q '"permissions"' "$file"; then
            info "Permission rules configured"
        fi
    fi
}

check_settings "$HOME/.claude/settings.json" "User"
check_settings "$PROJECT_ROOT/.claude/settings.json" "Project"
check_settings "$PROJECT_ROOT/.claude/settings.local.json" "Project-local"

# --- 5. MCP Servers ---
header "MCP Servers"

MCP_FILE="$PROJECT_ROOT/.mcp.json"
if [ -f "$MCP_FILE" ]; then
    if [ "$HAS_JQ" = true ]; then
        local_servers=$(jq -r '.mcpServers // {} | keys[]' "$MCP_FILE" 2>/dev/null || true)
        if [ -n "$local_servers" ]; then
            server_count=0
            while IFS= read -r server; do
                info "MCP server: $server"
                server_count=$((server_count + 1))
            done <<< "$local_servers"

            if [ "$server_count" -gt 5 ]; then
                warn "$server_count MCP servers configured — audit context overhead with /context"
            elif [ "$server_count" -gt 0 ]; then
                pass "$server_count MCP server(s) configured"
            fi
        else
            info "No MCP servers in .mcp.json"
        fi
    else
        info ".mcp.json exists (install jq for detailed analysis)"
    fi
else
    info "No .mcp.json found"
fi

# --- Summary ---
header "Summary"

TOTAL=$((PASS + WARN + FAIL))
echo -e "  ${GREEN}Pass: $PASS${NC}  ${YELLOW}Warn: $WARN${NC}  ${RED}Fail: $FAIL${NC}  Total: $TOTAL"

if [ "$FAIL" -gt 0 ]; then
    echo -e "\n  ${RED}Action required: $FAIL issue(s) need attention.${NC}"
    exit 1
elif [ "$WARN" -gt 0 ]; then
    echo -e "\n  ${YELLOW}$WARN warning(s) — consider addressing for optimal setup.${NC}"
    exit 0
else
    echo -e "\n  ${GREEN}All checks passed!${NC}"
    exit 0
fi
