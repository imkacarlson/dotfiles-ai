---
name: fix-and-verify
description: >
  End-to-end workflow: investigate a GitHub issue, implement the fix, verify on desktop and
  mobile with the user, write Playwright regression tests, and open a PR. Use when the user
  provides an issue number or URL to work on.
argument-hint: "[issue-number-or-url]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - EnterPlanMode
  - AskUserQuestion
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
3. Use the **git-commit** skill to stage and commit the changes

---

## Phase 2: Desktop verification

1. Check if the dev server is running. If not, ask the user to start it in another terminal before continuing.
2. Launch Playwright codegen targeting the relevant URL, saving output to a temp file:
   ```
   npx playwright codegen --output /tmp/fix-verify-recorded.spec.ts <url>
   ```
   This opens a real browser + the Playwright Inspector recorder side-by-side.
3. Tell the user: **"A browser and the Playwright recorder have opened. Perform the flow you want to verify. When you're done, close the browser window."**
4. Wait for the user to confirm they're done and that the flow works.
5. If the user reports a problem:
   - Understand the description
   - Iterate on the fix
   - Re-launch codegen and ask again
6. When the user confirms it works:
   - Read the recorded test from `/tmp/fix-verify-recorded.spec.ts`
   - Clean up the recorded code:
     - Wrap in a proper `test.describe` block with a meaningful name referencing the issue
     - Add/adjust assertions if the recording is light on them
   - Place the final test in `e2e/` with a descriptive filename
   - Run the new test: `npm run test:e2e -- --project="Desktop Chrome" <test-file>`
   - If the test fails → debug, fix, re-run
   - Remove the temp file: `rm /tmp/fix-verify-recorded.spec.ts`

---

## Phase 3: Mobile verification

1. Launch Playwright codegen with mobile viewport:
   ```
   npx playwright codegen --device="Pixel 7" --output /tmp/fix-verify-recorded-mobile.spec.ts <url>
   ```
   This opens a mobile-viewport browser + the Playwright Inspector recorder side-by-side.
2. Tell the user: **"A mobile-viewport browser and recorder have opened. Perform the mobile flow. Close the browser when done."**
3. Wait for the user to confirm they're done and that the flow works.
4. If the user reports a problem:
   - Iterate on the fix
   - Re-run the desktop test after each change to guard against regressions
   - Re-launch codegen mobile and ask again
5. When the user confirms mobile works:
   - Read the recorded mobile test from `/tmp/fix-verify-recorded-mobile.spec.ts`
   - Merge mobile-specific assertions into the existing test file (or add a separate mobile test block)
   - Run both desktop and mobile tests: `npm run test:e2e`
   - If either fails → loop back to the relevant phase
   - Remove the temp file: `rm /tmp/fix-verify-recorded-mobile.spec.ts`
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
