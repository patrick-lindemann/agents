#!/usr/bin/env bash
# Install the skills, subagent roles and rules of this repository for each coding
# harness: Claude Code, Codex and Pi.
#
# Rules: rules/ is linked to ~/.claude/rules/agents. Claude Code loads it natively: a
# rule without `paths:` always, one with `paths:` when a matching file is read or edited.
# Pi reads the same folder through the pi-claude-rules extension, and Codex through
# harnesses/codex/rules-hook.mjs; both block the first edit of a matching file until its
# rules are delivered.
#
# Usage: install.sh [--harness claude,codex,pi]   default: every harness installed
#
# The skills always go into ~/.agents/skills, the Agent Skills location. A harness counts
# as installed when its command is on PATH or its config directory exists; the files of a
# harness that is not installed are skipped, and its directory is not created.
#
# Run once per machine. It installs post-merge and post-rewrite hooks in this checkout
# that run it again after every pull, rebase pulls included; after a local change to a skill or a role, run it by hand. Links point
# into this checkout; the generated subagent files are in dist/ (git-ignored). The
# skills/*/agents/openai.yaml of Codex are generated from the skills' frontmatter and
# committed, so that a fresh clone is right before the first install.
#
# Needs node, which the Codex hooks and the build script run on.
set -euo pipefail

repo="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/.." && pwd)"
dist="$repo/dist"
claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
codex_dir="${CODEX_HOME:-$HOME/.codex}"
pi_dir="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
# Pinned, so that an update cannot change how rules load unseen.
pi_rules_package="npm:@jordyvanvorselen/pi-claude-rules@0.1.4"

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

if ! command -v node >/dev/null; then
    echo "install.sh needs node: install it, then run $0 again" >&2
    exit 1
fi

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

# Copy every generated role of Codex into $1. Codex lists a linked agent file but cannot
# spawn it ("agent type is currently not available", 0.167.2), so the files are copies.
# A copy starts with a marker line, so that only copies made here are replaced or removed.
copy_codex_roles() {
    local dir="$1" role target marker="# Generated from ~/agents/roles by install.sh; edit there."
    mkdir -p "$dir"
    for target in "$dir"/*.toml; do
        [[ -L "$target" && "$(readlink "$target")" == "$repo"/* ]] && rm "$target"
        if [[ -f "$target" && ! -L "$target" && "$(head -1 "$target")" == "$marker" ]] \
            && [[ ! -e "$dist/codex/agents/$(basename "$target")" ]]; then
            rm "$target"
            echo "remove $target"
        fi
    done
    for role in "$dist/codex/agents"/*.toml; do
        target="$dir/$(basename "$role")"
        if [[ -e "$target" && "$(head -1 "$target")" != "$marker" ]]; then
            echo "skip $target: exists and was not made by install.sh" >&2
            continue
        fi
        if ! { echo "$marker"; cat "$role"; } | cmp -s - "$target"; then
            { echo "$marker"; cat "$role"; } >"$target"
            echo "copy $target"
        fi
    done
}

# Write the git hook $1 that runs this script again with the same harnesses; $2 is a shell
# line run first, which can exit to skip. A hook that this script did not write is left
# alone.
install_hook() {
    local hooks target marker="# Generated by scripts/install.sh; runs it after every pull."
    hooks="$(git -C "$repo" rev-parse --path-format=absolute --git-path hooks)"
    target="$hooks/$1"
    if [[ -e "$target" && "$(sed -n 2p "$target")" != "$marker" ]]; then
        echo "skip $target: exists and was not made by install.sh" >&2
        return
    fi
    local text
    text="$(printf '#!/usr/bin/env bash\n%s\n%sexec "%s/scripts/install.sh"%s\n' \
        "$marker" "${2:+$2
}" "$repo" "${harnesses:+ --harness ${harnesses// /,}}")"
    if [[ "$(cat "$target" 2>/dev/null)" != "$text" ]]; then
        mkdir -p "$hooks"
        printf '%s\n' "$text" >"$target"
        chmod +x "$target"
        echo "write $target"
    fi
}
# A pull that merges or fast-forwards runs post-merge, also with --rebase. A rebase pull
# that replays local commits runs only post-rewrite, which `commit --amend` runs too.
if [[ -d "$repo/.git" || -f "$repo/.git" ]]; then
    install_hook post-merge ""
    install_hook post-rewrite '[[ $1 == rebase ]] || exit 0'
fi

# A fixed path for the skills and rules, which refer to ~/agents/... wherever the
# checkout is.
if [[ "$repo" != "$HOME/agents" ]]; then
    link "$repo" "$HOME/agents"
fi

echo "harnesses:${selected:- none}"
# shellcheck disable=SC2086
[[ -n $selected ]] && node "$repo/scripts/build.mjs" roles "$dist" $selected
# Shows up in git status when a skill's frontmatter changed without a rebuild.
node "$repo/scripts/build.mjs" skills

# Claude Code and the Pi extension read the rules from ~/.claude/rules; the Codex hook
# reads ~/agents/rules.
if wants claude || wants pi; then
    mkdir -p "$claude_dir/rules"
    link "$repo/rules" "$claude_dir/rules/agents"
    prune "$claude_dir/rules"
fi

if wants claude; then
    link_skills "$claude_dir/skills"
    link_roles claude "$claude_dir/agents"
fi

# The Agent Skills location, which Codex and Pi read.
link_skills "$HOME/.agents/skills"

if wants codex; then
    copy_codex_roles "$codex_dir/agents"
    node "$repo/scripts/build.mjs" unblock "$codex_dir/AGENTS.md" agents-rules
    if node "$repo/harnesses/codex/add-hooks.mjs" "$codex_dir/hooks.json" | grep .; then
        echo "codex: run /hooks once to trust the new rules hooks"
    fi
fi

if wants pi; then
    link_roles pi "$pi_dir/agents"
    node "$repo/scripts/build.mjs" unblock "$pi_dir/AGENTS.md" agents-rules
    if ! grep -q "pi-claude-rules" "$pi_dir/settings.json" 2>/dev/null; then
        pi install "$pi_rules_package"
    fi
    # Also load rules for files that a bash command names, as the Codex hook does.
    link "$repo/harnesses/pi/claude-rules.json" "$pi_dir/claude-rules.json"
fi
