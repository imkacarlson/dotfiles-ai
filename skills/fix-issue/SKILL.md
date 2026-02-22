---
name: fix-issue
description: >
  Takes a GitHub issue (number or URL), checks if it's already closed, and if open,
  investigates the codebase and presents a fix plan including creating a branch and
  opening a PR that closes the issue.
argument-hint: "[issue-number-or-url]"
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Task
  - EnterPlanMode
  - mcp__github__issue_read
  - mcp__github__create_pull_request
---

# Fix Issue Skill

You are resolving a GitHub issue. Follow these steps carefully.

## Step 1: Parse the argument

The user's input is: `$ARGUMENTS`

- If **empty or missing**: ask the user for an issue number or URL, then stop.
- If it's a **full GitHub URL** like `https://github.com/OWNER/REPO/issues/NUMBER`: extract `OWNER/REPO` and the issue `NUMBER` from the URL.
- If it's a **bare number** like `42`: detect the repo by running `gh repo view --json nameWithOwner -q .nameWithOwner` in the current working directory. Use the result as `OWNER/REPO` and the argument as `NUMBER`.

## Step 2: Check issue status

Use the `mcp__github__issue_read` tool with method `get` to fetch the issue details.

If the issue state is **CLOSED**:
- Report to the user: "Issue #NUMBER is already closed." Include the title and a link.
- **Stop here.** Do not proceed further.

If the issue is **OPEN**, continue.

## Step 3: Gather issue context

- Read the issue body and any comments using `mcp__github__issue_read` (methods: `get`, `get_comments`, `get_labels`).
- Note the issue title, description, labels, and any discussion from comments.

## Step 4: Investigate the codebase

Based on the issue details:
- Use **Grep** and **Glob** to search for files, functions, components, or patterns mentioned in or related to the issue.
- Use **Read** to examine the relevant source files.
- Trace code paths to understand the root cause (for bugs) or where new code should go (for features).
- Build a thorough understanding before proposing changes.

## Step 5: Check if already implemented

After investigating the codebase, evaluate whether the issue's described bug fix or feature already exists:

- For **bugs**: Does the code already contain a fix for the described behavior? Is there a guard, validation, or corrected logic that addresses the root cause?
- For **features**: Does the functionality described in the issue already exist in the codebase, even if named differently or located somewhere unexpected?

If the issue appears to be **already implemented**:
- Report to the user: summarize what you found, citing the specific files/functions/lines that address the issue.
- Suggest the user close the issue (with a link), or offer to comment on the issue with your findings.
- **Stop here.** Do not proceed to planning or making changes.

If not already implemented, continue to the next step.

## Step 6: Determine the branch name

Check the issue labels:
- If labeled `bug` or similar: use `fix/issue-NUMBER-short-desc`
- Otherwise: use `feature/issue-NUMBER-short-desc`

Where `short-desc` is a 2-4 word kebab-case summary derived from the issue title.

Also determine the default branch by running: `git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`

## Step 7: Present a plain-language summary

Before entering plan mode, output a conversational summary to the user:
- What the issue is about (title + brief description in your own words)
- What you found in the codebase (relevant files, root cause for bugs, insertion points for features)
- Your proposed high-level approach

## Step 8: Enter plan mode

Use the `EnterPlanMode` tool. Then write a structured plan covering:

1. **Branch**: `<branch-name>` (from `<default-branch>`)
2. **Changes**: List each file to create/modify with specific descriptions of what changes
3. **Testing**: Steps to verify the fix/feature works
4. **PR Details**:
   - Title: Use conventional commit format (e.g., `fix: resolve crash when...` or `feat: add support for...`)
   - Body: Description of changes with `Closes #NUMBER` to auto-close the issue

## Step 9: Execute after approval

Once the user approves the plan:

1. Create and checkout the branch: `git checkout -b <branch-name>`
2. Make all code changes using Edit/Write tools
3. Stage and commit changes with a descriptive message ending with:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
4. Push the branch: `git push -u origin <branch-name>`
5. Open a PR using `mcp__github__create_pull_request` with the planned title and body (including `Closes #NUMBER`)
6. Report the PR URL to the user
