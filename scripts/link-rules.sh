#!/usr/bin/env bash
# Link core.md, python.md and the given modules into <project>/.claude/rules/, and remove
# links to modules no longer given or no longer existing. The links stay out of the
# project's git through its .git/info/exclude, since they point into this machine's
# checkout. For the harnesses that load no .claude/rules/ (Codex, Pi), write the same
# list, with when to read each module, into a marked block of <project>/AGENTS.md.
#
# Usage: link-rules.sh <project> [module ...]   e.g. link-rules.sh . tests arrays pytorch
#        link-rules.sh --list                    list the modules
set -euo pipefail

repo="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/.." && pwd)"
always=(core python)
user_level=(communication git shell)

modules() {
    local file name
    for file in "$repo"/rules/*.md; do
        name="$(basename "$file" .md)"
        [[ " ${always[*]} ${user_level[*]} " == *" $name "* ]] || echo "$name"
    done
}

if [[ "${1:-}" == "--list" ]]; then
    modules
    exit
fi
if [[ $# -lt 1 ]]; then
    echo "usage: $0 <project> [module ...] | --list" >&2
    exit 2
fi

project="$(cd "$1" && pwd)"
shift
available="$(modules)"
for module in "$@"; do
    if ! grep -qx "$module" <<<"$available"; then
        echo "unknown module: $module (available: $(echo $available))" >&2
        exit 2
    fi
done
selected=("${always[@]}" "$@")

rules_dir="$project/.claude/rules"
mkdir -p "$rules_dir"

for entry in "$rules_dir"/*.md; do
    [[ -L "$entry" && "$(readlink "$entry")" == "$repo"/* ]] || continue
    if [[ ! -e "$entry" || " ${selected[*]} " != *" $(basename "$entry" .md) "* ]]; then
        rm "$entry"
        echo "remove $entry"
    fi
done

for module in "${selected[@]}"; do
    target="$rules_dir/$module.md"
    if [[ -e "$target" && ! -L "$target" ]]; then
        echo "skip $target: exists and is not a symlink" >&2
        continue
    fi
    ln -sfn "$repo/rules/$module.md" "$target"
    echo "link $target"
done

if git -C "$project" rev-parse --git-dir >/dev/null 2>&1; then
    exclude="$(git -C "$project" rev-parse --path-format=absolute --git-path info/exclude)"
    mkdir -p "$(dirname "$exclude")"
    touch "$exclude"
    for module in "${selected[@]}"; do
        line="/.claude/rules/$module.md"
        grep -qxF "$line" "$exclude" || echo "$line" >>"$exclude"
    done
fi

python3 -I "$repo/scripts/build.py" project-rules "${selected[@]}" \
    | python3 -I "$repo/scripts/build.py" block "$project/AGENTS.md" shared-rules
