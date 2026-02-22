---
name: git-issue
description: Create GitHub issues from rambling feature ideas when the user invokes `$git-issue`. Use this skill to detect likely duplicate open issues in the current repo, summarize the idea, propose a title, and wait for explicit approval before creating the issue.
---

# Git Issue

## Overview
Turn a rough idea into a well-structured GitHub issue with duplicate checks and explicit user approval before creation.

## Workflow

1. **Resolve target repo from the current workspace**
   - Print the current working directory to see which repo you're in
   - If missing or ambiguous, ask the user for `owner/repo`.

2. **Check for duplicates (open issues only)**
   - Use GitHub MCP `list_issues` with `state: open` for the resolved repo.
   - Extract keywords from the user’s idea.
   - Compare keywords to issue titles and identify likely matches.
   - For likely title matches, fetch the issue body and do a quick semantic comparison.
   - If a likely duplicate exists:
     - Report issue number + title (and a short reason).
     - **Stop.** Do not create a new issue.

3. **Ground implementation notes in the actual codebase (required)**
   - Do a focused repo scan before drafting the issue body.
   - Identify likely affected files/components/hooks/styles using fast search (`rg`).
   - Open only the relevant files and confirm how the current behavior works.
   - Capture concrete touchpoints (file paths, component names, CSS classes, or function names) that are likely implementation points.
   - Put these concrete touchpoints directly into **Implementation Notes**.
   - If the codebase cannot be inspected (missing repo/access), say that explicitly and mark notes as assumptions.

4. **Summarize the idea and propose a title**
   - Provide a clear, coherent summary of the idea.
   - Propose a concise issue title.

5. **Wait for explicit approval**
   - Ask the user to respond with **“go”** to proceed.
   - Do not create the issue until the user explicitly approves.

6. **Create the issue**
   - Use GitHub MCP `create_issue`.
   - Use the standard template below.

## Issue Template (default)

- **Summary**
- **Goals**
- **Non-Goals**
- **Implementation Notes**
- **Acceptance Criteria**
- **Priority** (default: Medium)

## Notes
- Be conservative in duplicate detection: if it looks like a match, stop and ask.
- Keep the issue clear and actionable for another developer.
- Avoid overlong background; prioritize the “what” and “why.”
- Prefer codebase-specific implementation notes over generic suggestions.
- Include concrete file references when possible.
