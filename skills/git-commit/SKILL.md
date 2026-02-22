---
name: git-commit
description: "Standard workflow for staging and committing changes in a git repo. Use when the user asks to commit, make a commit, or save changes to git."
allowed-tools:
  - Bash(git status*)
  - Bash(git diff*)
  - Bash(git log*)
  - Bash(git add*)
---

# Git Commit

Follow this workflow when asked to commit:

1. **Inspect Changes:** Run `git status` and `git diff` to see modified/untracked files and their contents.
2. **Security Audit:** Scan for "red flag" files that should not be tracked (e.g., `.env`, local secrets, API keys, or large build artifacts).
3. **User Alert:** If sensitive or unnecessary files are found:
    * List these specific files for the user.
    * Suggest adding them to `.gitignore` instead of staging them.
4. **Selective Staging:** Run `git add <files>` for only the safe/appropriate changes. Avoid `git add -A` if the audit in Step 2 flagged potential risks.
5. **Review Diffs:** Run `git diff --cached --stat` to show the names and diff stats of what is actually staged.
6. **Commit:**
    * Write a concise commit message summarizing the changes.
    * Run `git commit -m "<message>"`.
    * Show the resulting commit hash.
7. **Post-Commit Report:** Explicitly mention any files that were modified/untracked but **not** included in the commit (the "leftovers") so the user can verify they were intentionally excluded.

If there are no valid changes to stage (nothing to commit), report that and stop.