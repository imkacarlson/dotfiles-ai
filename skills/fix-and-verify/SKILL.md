---
name: fix-and-verify
description: >
  End-to-end workflow: investigate a GitHub issue, implement the fix, verify on desktop and
  mobile with the user, write Playwright regression tests, and open a PR. Use when the user
  provides an issue number or URL to work on.
argument-hint: "[issue-number-or-url]"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Task
  - EnterPlanMode
  - AskUserQuestion
  - mcp__playwright__*
  - mcp__github__*
---

# Fix-and-Verify Skill

You are resolving a GitHub issue **and** verifying the fix with the user on both desktop and
mobile before writing regression tests and opening a PR.

---

## Phase 1: Fix the issue

### Step 1: Parse the argument

The user's input is: `$ARGUMENTS`

- If **empty or missing**: ask the user for an issue number or URL, then stop.
- If it's a **full GitHub URL** like `https://github.com/OWNER/REPO/issues/NUMBER`: extract `OWNER/REPO` and the issue `NUMBER`.
- If it's a **bare number** like `42`: detect the repo with `gh repo view --json nameWithOwner -q .nameWithOwner`.

### Step 2: Check issue status

Use `mcp__github__issue_read` (method `get`) to fetch the issue.

- If **CLOSED**: report "Issue #NUMBER is already closed." with title and link. **Stop.**
- If **OPEN**: continue.

### Step 3: Gather context

Read the issue body and comments (`mcp__github__issue_read` methods: `get`, `get_comments`, `get_labels`).
Note the title, description, labels, and any discussion.

### Step 4: Investigate the codebase

Use **Grep**, **Glob**, and **Read** to trace the relevant code paths. Understand root cause
(for bugs) or insertion point (for features) before proposing any changes.

### Step 5: Check if already implemented

- For **bugs**: does the code already contain a fix?
- For **features**: does the functionality already exist somewhere?

If already implemented: summarize findings, cite files/lines, suggest closing the issue. **Stop.**

### Step 6: Determine branch name

- Bug label → `fix/issue-NUMBER-short-desc`
- Otherwise → `feature/issue-NUMBER-short-desc`

Get the default branch: `git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`

### Step 7: Present a plain-language summary

Before entering plan mode, tell the user:
- What the issue is about
- What you found in the codebase
- Your proposed approach

### Step 8: Enter plan mode

Use **EnterPlanMode** and write a structured plan:
1. **Branch** name
2. **Changes** — files to create/modify with specifics
3. **Testing** — verification steps
4. **PR Details** — title (conventional commit format) and body (`Closes #NUMBER`)

### Step 9: Implement the fix

After approval:
1. `git checkout -b <branch-name>`
2. Make all changes with Edit/Write tools
3. Commit with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

---

## Phase 2: Desktop verification

1. Ensure the dev server is running: `npm run dev &` (if not already running).
2. Open a desktop browser via Playwright MCP tools.
3. Navigate to the relevant page/flow.
4. Tell the user: **"Desktop is ready. Try the flow and tell me if it works."**
5. If the user reports a problem:
   - Understand the description
   - Iterate on the fix
   - Re-open desktop and ask again
6. When the user confirms it works:
   - Write a Playwright test in `e2e/` covering the desktop behavior
   - Run the new test: `npm run test:e2e -- --project="Desktop Chrome" <test-file>`
   - If the test fails → debug and fix before continuing

---

## Phase 3: Mobile verification

1. Open a mobile-viewport browser via Playwright MCP (Pixel 7 / touch-enabled).
2. Navigate to the same flow.
3. Tell the user: **"Mobile is ready. Try the flow."**
4. If the user reports a problem:
   - Iterate on the fix
   - Re-run the desktop test after each change to guard against regressions
   - Re-open mobile and ask again
5. When the user confirms mobile works:
   - Extend the test file (or write a separate `test.skip(!isMobile, ...)` block) for mobile assertions
   - Run both desktop and mobile tests: `npm run test:e2e`
   - If either fails → loop back to the relevant phase
6. Once **both** desktop and mobile tests pass: proceed to Phase 4.

---

## Phase 4: PR

1. Run the full test suite: `npm run test:e2e`
2. If all green:
   - Stage and commit any remaining changes
   - `git push -u origin <branch-name>`
   - Open a PR via `mcp__github__create_pull_request` with:
     - Title in conventional commit format
     - Body including `Closes #NUMBER` and a brief summary of what was tested
3. Report the PR URL to the user.
