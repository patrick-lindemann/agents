#!/usr/bin/env bash
# Install the skills, subagent roles and user-level rules of this repository for each
# coding harness: Claude Code, Codex and Pi.
#
# Usage: install.sh [--harness claude,codex,pi]   default: every harness installed
#
# The skills always go into ~/.agents/skills, the Agent Skills location. A harness counts
# as installed when its command is on PATH or its config directory exists; the files of a
# harness that is not installed are skipped, and its directory is not created.
#
# Run once per machine, and again after adding or removing a skill or a role, or after
# changing a user-level rule or a role. Links point into this checkout; the generated
# subagent files are in dist/ (git-ignored).
set -euo pipefail

repo="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/.." && pwd)"
dist="$repo/dist"
claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
codex_dir="${CODEX_HOME:-$HOME/.codex}"
pi_dir="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"

harnesses=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --harness) harnesses="${2//,/ }"; shift 2 ;;
        *) echo "usage: $0 [--harness claude,codex,pi]" >&2; exit 2 ;;
    esac
done
# The config directory of harness $1; fails for an unknown harness.
config_dir() {
    case "$1" in
        claude) echo "$claude_dir" ;;
        codex) echo "$codex_dir" ;;
        pi) echo "$pi_dir" ;;
        *) return 1 ;;
    esac
}
selected=""
for harness in ${harnesses:-claude codex pi}; do
    if ! dir="$(config_dir "$harness")"; then
        echo "unknown harness: $harness (known: claude, codex, pi)" >&2
        exit 2
    fi
    if command -v "$harness" >/dev/null || [[ -d $dir ]]; then
        selected+=" $harness"
    else
        echo "skip $harness: not installed (no \`$harness\` on PATH, no $dir)" >&2
    fi
done
wants() { [[ " $selected " == *" $1 "* ]]; }

# Link $1 to $2, replacing only an existing symlink, never a real file.
link() {
    local source="$1" target="$2"
    if [[ -e "$target" && ! -L "$target" ]]; then
        echo "skip $target: exists and is not a symlink" >&2
        return
    fi
    [[ "$(readlink "$target" 2>/dev/null)" == "$source" ]] && return
    ln -sfn "$source" "$target"
    echo "link $target -> $source"
}

# Remove links in $1 that point into this repository but no longer resolve.
prune() {
    local dir="$1" entry
    for entry in "$dir"/* "$dir"/.[!.]*; do
        if [[ -L "$entry" && "$(readlink "$entry")" == "$repo"/* && ! -e "$entry" ]]; then
            rm "$entry"
            echo "remove $entry"
        fi
    done
}

# Link every skill into $1.
link_skills() {
    local dir="$1" skill
    mkdir -p "$dir"
    for skill in "$repo"/skills/*/; do
        skill="${skill%/}"
        link "$skill" "$dir/$(basename "$skill")"
    done
    prune "$dir"
}

# Link every generated role of harness $1 into $2.
link_roles() {
    local harness="$1" dir="$2" role
    mkdir -p "$dir"
    for role in "$dist/$harness/agents"/*; do
        link "$role" "$dir/$(basename "$role")"
    done
    prune "$dir"
}

# A fixed path for the skills and rules, which refer to ~/agents/... wherever the
# checkout is.
if [[ "$repo" != "$HOME/agents" ]]; then
    link "$repo" "$HOME/agents"
fi

echo "harnesses:${selected:- none}"
# shellcheck disable=SC2086
[[ -n $selected ]] && python3 -I "$repo/scripts/build.py" roles "$dist" $selected

if wants claude; then
    mkdir -p "$claude_dir/rules"
    for rule in communication git shell; do
        link "$repo/rules/$rule.md" "$claude_dir/rules/$rule.md"
    done
    prune "$claude_dir/rules"
    link_skills "$claude_dir/skills"
    link_roles claude "$claude_dir/agents"
fi

# The Agent Skills location, which Codex and Pi read.
link_skills "$HOME/.agents/skills"

if wants codex; then
    link_roles codex "$codex_dir/agents"
    python3 -I "$repo/scripts/build.py" user-rules \
        | python3 -I "$repo/scripts/build.py" block "$codex_dir/AGENTS.md" agents-rules
fi

if wants pi; then
    link_roles pi "$pi_dir/agents"
    python3 -I "$repo/scripts/build.py" user-rules \
        | python3 -I "$repo/scripts/build.py" block "$pi_dir/AGENTS.md" agents-rules
fi
