#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$REPO_DIR/skills"
CLAUDE_SKILLS="$HOME/.claude/skills"
CODEX_SKILLS="$HOME/.codex/skills"

if [ $# -ne 1 ]; then
  echo "Usage: $0 <path-to-skill-dir>"
  echo ""
  echo "Examples:"
  echo "  $0 ~/.claude/skills/new-skill"
  echo "  $0 ~/.codex/skills/new-skill"
  exit 1
fi

SRC="$(cd "$1" && pwd)"
NAME="$(basename "$SRC")"
DEST="$SKILLS_DIR/$NAME"

if [ ! -f "$SRC/SKILL.md" ]; then
  echo "Error: $SRC/SKILL.md not found"
  exit 1
fi

if [ -e "$DEST" ]; then
  echo "Error: $DEST already exists"
  exit 1
fi

mv "$SRC" "$DEST"
echo "Moved: $SRC -> $DEST"

mkdir -p "$CLAUDE_SKILLS" "$CODEX_SKILLS"

for dest_dir in "$CLAUDE_SKILLS" "$CODEX_SKILLS"; do
  link="$dest_dir/$NAME"
  if [ -L "$link" ]; then
    echo "skip: $link (symlink already exists)"
  elif [ -e "$link" ]; then
    echo "WARN: $link exists and is not a symlink — skipping"
  else
    ln -s "$DEST" "$link"
    echo "link: $link -> $DEST"
  fi
done

echo ""
echo "Next steps:"
echo "  cd $REPO_DIR"
echo "  git add skills/$NAME"
echo "  git commit -m \"feat: add $NAME skill\""
