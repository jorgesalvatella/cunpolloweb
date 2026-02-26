---
description: Resume work from where we left off — reads project state, recent changes, and pending items
---

You are resuming work on the CUNPOLLO project. Before doing anything, gather full context of where things stand.

## Steps

1. Read the project memory file at `/home/beto/.claude/projects/-home-beto-projects-cunpolloweb/memory/MEMORY.md` to understand the project, stack, and current state.

2. Read `docs/changelog.md` to see the most recent changes (focus on the latest entries at the top).

3. Read `docs/features.md` to see what's implemented, what's pending, and what's blocked.

4. Run `git status` and `git log --oneline -5` to see if there are uncommitted changes or recent commits.

5. Present a concise summary to the user:
   - **Estado actual**: What was last worked on
   - **Cambios sin commit**: Any uncommitted changes (if any)
   - **Pendientes**: What's next / blocked items from features.md
   - **Pregunta**: Ask the user what they want to work on next

Keep the summary short and actionable. Do NOT start making changes — just report the state and ask what to do next.
