#!/usr/bin/env bash
# Link the user-level rules, skills, agents and status line of this repository into
# ~/.claude/.
# Run once per machine and again after adding or removing a skill or an agent.
set -euo pipefail

repo="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/.." && pwd)"
claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

# Link $1 to $2, replacing only an existing symlink, never a real file.
link() {
    local source="$1" target="$2"
    if [[ -e "$target" && ! -L "$target" ]]; then
        echo "skip $target: exists and is not a symlink" >&2
        return
    fi
    ln -sfn "$source" "$target"
    echo "link $target -> $source"
}

# Remove links in $1 that point into this repository but no longer resolve.
prune() {
    local dir="$1" entry
    for entry in "$dir"/*; do
        if [[ -L "$entry" && "$(readlink "$entry")" == "$repo"/* && ! -e "$entry" ]]; then
            rm "$entry"
            echo "remove $entry"
        fi
    done
}

mkdir -p "$claude_dir/rules" "$claude_dir/skills" "$claude_dir/agents"

link "$repo/claude/statusline.sh" "$claude_dir/statusline.sh"

for rule in communication git shell; do
    link "$repo/rules/$rule.md" "$claude_dir/rules/$rule.md"
done
for skill in "$repo"/skills/*/; do
    skill="${skill%/}"
    link "$skill" "$claude_dir/skills/$(basename "$skill")"
done
for agent in "$repo"/.claude/agents/*.md; do
    link "$agent" "$claude_dir/agents/$(basename "$agent")"
done

prune "$claude_dir/rules"
prune "$claude_dir/skills"
prune "$claude_dir/agents"
