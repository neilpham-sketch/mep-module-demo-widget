# Turning a Spec into a Plan for Demo Widget

Read the spec at `docs/specs/<feature-slug>.md` first. Then write a short, ordered
checklist of tasks — not a multi-page implementation plan. Each task needs:

- What file(s) it touches.
- What "done" looks like — one line, e.g. "GET /v1/<endpoint> returns a 200 with the
  guarded response shape."

Keep tasks small enough that each one is a single, reviewable commit. Order them so each
task can be tested on its own before the next one starts.

Once the plan is written, move to `docs/agent/implement.md`.
