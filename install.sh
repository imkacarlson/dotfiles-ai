#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$REPO_DIR/skills"
CLAUDE_SKILLS="$HOME/.claude/skills"
CODEX_SKILLS="$HOME/.codex/skills"

mkdir -p "$CLAUDE_SKILLS" "$CODEX_SKILLS"

link_skill() {
  local name="$1"
  local target="$SKILLS_DIR/$name"

  for dest_dir in "$CLAUDE_SKILLS" "$CODEX_SKILLS"; do
    local dest="$dest_dir/$name"

    if [ -L "$dest" ]; then
      echo "  skip: $dest (symlink already exists)"
    elif [ -e "$dest" ]; then
      echo "  WARN: $dest exists and is not a symlink — skipping"
    else
      ln -s "$target" "$dest"
      echo "  link: $dest -> $target"
    fi
  done
}

echo "Installing skills from $SKILLS_DIR"
for skill_dir in "$SKILLS_DIR"/*/; do
  name="$(basename "$skill_dir")"
  link_skill "$name"
done

echo "Done."
