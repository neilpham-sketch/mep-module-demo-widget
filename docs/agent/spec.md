# Writing a Spec for Demo Widget

Before writing any code, write down what you're building. Keep it short — this is a
single module, not a platform. Save it to `docs/specs/<feature-slug>.md`.

A spec needs four things:

1. **Feature name** — one line.
2. **Why** — one paragraph. What problem does this solve, for whom?
3. **Acceptance criteria** — a checklist of concrete, testable behaviors:
   ```
   - [ ] Given <input/state>, when <action>, then <observable result>
   ```
4. **Out of scope** — explicitly list what this feature does NOT do, so nobody
   accidentally expands it mid-implementation.

Do not add an "approaches considered" or "architecture" section unless the feature
genuinely needs one (e.g. it changes how this module talks to another service, or adds a
new deployment shape) — for a single module's feature, that's almost never the case.

Once the spec is written, move to `docs/agent/plan.md`.
