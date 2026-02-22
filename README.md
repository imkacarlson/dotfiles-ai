# dotfiles-ai

Shared AI agent skills for Claude Code and Codex, version-controlled in one place.

Both tools implement the [Agent Skills spec](https://agentskills.io). A single `SKILL.md` works in both — each tool reads `name` and `description` from frontmatter and ignores fields it doesn't recognize.

## Skills

| Skill | Description |
|---|---|
| `fix-issue` | Takes a GitHub issue, investigates the codebase, and opens a PR that closes it |
| `git-commit` | Standard workflow for staging and committing changes |
| `git-create-issue` | Turn rough ideas into structured GitHub issues with duplicate detection |

## Setup

```bash
git clone https://github.com/imkacarlson/dotfiles-ai ~/projects/dotfiles-ai
cd ~/projects/dotfiles-ai
bash install.sh
```

`install.sh` creates symlinks in both `~/.claude/skills/` and `~/.codex/skills/` pointing to this repo, so edits here are immediately visible to both tools.

## Adding a new skill

After Claude Code or Codex creates a skill in its own directory:

```bash
cd ~/projects/dotfiles-ai
bash add-skill.sh ~/.claude/skills/new-skill
# or
bash add-skill.sh ~/.codex/skills/new-skill
```

This moves the skill into the repo and creates symlinks in both tool directories. Then commit:

```bash
git add skills/new-skill
git commit -m "feat: add new-skill"
git push
```
