# Implementing a Task for Demo Widget

For each task in your plan:

1. Implement the change.
2. Add or update tests covering it.
3. Run `pnpm typecheck` — it must pass before moving on. Run `pnpm test` too if this repo
   has a test script configured (see `AGENTS.md`'s core commands — not every generated
   module has one yet).
4. If the task changes an HTTP endpoint or a user-visible flow, run `pnpm e2e`
   (see `docs/agent/e2e.md`) before marking the task done.
5. Commit with a message describing what changed and why.

Re-read `AGENTS.md`'s "Hard constraints" section before implementing anything that adds a
new route, changes `main.ts`'s global prefix, or touches CI/deploy workflows — those are
platform-level guarantees, not module-level choices.
