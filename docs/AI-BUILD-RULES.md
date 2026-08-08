# Jrello — AI Build Rules

These rules govern **all** AI-assisted work on Jrello. They exist to keep the codebase
intentional, coherent, and free of the generic "AI slop" that erodes a product over time.
They are **binding**: if a rule conflicts with convenience, the rule wins. If a rule
genuinely blocks good work, raise it, decide it, record the decision in `DECISIONS.md`,
then proceed — do not silently violate it.

> Companion docs: `DESIGN-SYSTEM.md` (the look), `UX.md` (the behavior),
> `ARCHITECTURE.md` (the system), `ROADMAP.md` (the sequence). Read the relevant one
> before touching its area.

---

## 1. Scope & focus

- **One target per task.** Do not bundle "while I'm here" changes. A task is one feature,
  one bug, or one refactor — not a sweep.
- **Never modify unrelated areas.** If you spot something worth fixing elsewhere, note it
  and handle it in its own task.
- **Do not rewrite working code unnecessarily.** Prefer the smallest change that is
  correct. Refactors must be justified by a concrete benefit, not aesthetics.
- **Prefer incremental changes.** A series of small, reviewable landings beats one large
  landing. Each step should leave the tree building and tests green.

## 2. Before you change anything

- **Inspect the existing implementation first.** Read the code you're about to touch and
  the code that calls it. Match the surrounding style, naming, density, and idioms.
- **Read the relevant docs** (`DESIGN-SYSTEM.md` / `UX.md` / `ARCHITECTURE.md` /
  `DATABASE.md` / `API.md` / `REALTIME.md`) for the area. The docs are constraints, not
  suggestions.
- **Preserve the existing design system.** Use defined tokens (color, spacing, radius,
  motion, type). Do not introduce arbitrary values (`rounded-[17px]`, random hex) or new
  patterns without justification.
- **Do not introduce new UI patterns without justification.** If a new component is
  needed, decide where it fits in `DESIGN-SYSTEM.md` first, then build it.
- **Treat screenshots/references as design constraints**, not vibes. If a target visual
  exists, match it precisely; deviations are bugs.

## 3. Architecture discipline

- **Do not silently change architecture.** Routes stay thin (`parse → auth → domain →
  return`). Business logic lives in `src/lib/api/`. If a change would move a boundary,
  explain it and update `ARCHITECTURE.md`.
- **The data layer owns truth.** Don't read/write the DB from route components or client
  code. Go through the domain module.
- **Never trust client-provided IDs/roles.** Always re-derive the actor from the session.
- **Validation is shared.** zod schemas live in `src/lib/validation/` and are imported on
  both sides. Don't hand-roll validation in a route.
- **Explain important architectural decisions.** Add an ADR to `DECISIONS.md` for anything
  non-obvious. A decision that isn't recorded didn't happen.

## 4. Verification (mandatory after every change)

- **Run the relevant checks before declaring done:**
  - `pnpm typecheck` — must pass.
  - `pnpm lint` — must pass.
  - `pnpm test` — run tests touching the changed area; add tests for new behavior.
  - `pnpm db:migrate` if you changed the schema; verify the migration applies cleanly.
- **Inspect the result.** Open the UI / read the output. Don't claim it works from reading
  the diff alone.
- **Compare against the documented design direction.** If the result looks generic,
  pillowy, or "SaaS-y," it's not done — fix it before moving on.
- **Report failures honestly.** If tests fail, say so with the output. If a step was
  skipped, say that. "Done and verified" means exactly that.

## 5. Anti-slop UI rules (non-negotiable)

These mirror `DESIGN-SYSTEM.md`'s hard constraints. Repeated here because they are the
most common failure mode of AI-built UIs.

- ❌ No purple/blue SaaS gradients. No gradient buttons, gradient text, or gradient hero
  backgrounds. Flat surfaces.
- ❌ No glassmorphism (`backdrop-blur` over blurry content). Surfaces are solid, or
  translucent only for a stated functional reason (sticky toolbar).
- ❌ No giant marketing-style dashboard cards with one stat + an illustration. Cards are
  small, dense, and data-bearing.
- ❌ No Inter-everywhere look. Inter is paired with **JetBrains Mono** for all identifiers,
  code, and metadata. The pairing is the signature.
- ❌ No decorative SVG blobs, mesh/aurora backgrounds, or "abstract" illustrations.
- ❌ No excessive rounded corners. Use the radius scale (`4/6/8px`). Cards are not pillowy.
- ❌ No meaningless animation — no fade-in-up, count-up, staggered entrances, carousels.
- ❌ No emoji as icons. Use Lucide with consistent stroke.
- ❌ No "Trusted by" strips, fake testimonials, or in-app CTA banners. This is a tool.
- ❌ No lorem ipsum or fake-but-real-looking placeholder data. Empty states say they're
  empty and teach the next action.

## 6. Specific "do not" list

- **Never use "make it more premium" / "make it modern" / "make it sleek" as a design
  specification.** These are content-free. State exactly what changes (color token, spacing
  value, component variant) and why.
- **Never blindly generate large amounts of unrelated code.** No scaffolding entire
  feature sets in one pass. Build the documented next step.
- **Never invent APIs, libraries, or "magic" helpers** that aren't in the deps or docs. If
  a capability is missing, add the dependency explicitly and document it.
- **Never commit secrets or `.env`.** `.env.example` documents vars; real values stay
  local.
- **Never disable lint/typecheck rules to make something pass.** Fix the code or raise the
  rule change in `DECISIONS.md`.

## 7. Documentation同步

- If an implementation changes a documented architectural decision, **update the doc in
  the same change**. `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `REALTIME.md` must never
  drift from the code.
- The Prisma schema is canonical for the data model; `DATABASE.md` follows it.
- New event/API endpoints must be added to `REALTIME.md` / `API.md` when added to code.

## 8. Process loop (for every task)

1. Read the relevant `/docs`.
2. Plan the smallest implementation step.
3. Implement only that step.
4. Run type-check / lint / tests / migrate.
5. Inspect the result (UI or output).
6. Compare against the documented design direction.
7. Fix problems.
8. Update docs if an architectural decision changed.
9. Only then move to the next feature.

## 9. Definition of done

A task is done when **all** are true:

- Implemented and matches the docs.
- `pnpm typecheck`, `pnpm lint`, and relevant `pnpm test` pass.
- UI inspected against `DESIGN-SYSTEM.md` / `UX.md` (where applicable).
- Docs updated if architecture/behavior changed.
- No unrelated changes dragged in.
- The change is described honestly, including anything skipped or known-broken.
