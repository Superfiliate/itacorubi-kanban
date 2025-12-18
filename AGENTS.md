# AI Agent Instructions

**MANDATORY: Before starting ANY task, you MUST read the `/docs` folder.**

## Required Steps

1. **ALWAYS** read `/docs/README.md` first, then the README inside any folder you touch (e.g., `/docs/adrs/README.md`, `/docs/features/README.md`) before editing files there.
2. **ALWAYS** check `/docs/adrs/` for technical decisions and patterns. ADRs are technical/architectural—how we build, not what the product does.
3. **ALWAYS** check `/docs/features/` for product/UX requirements. Features are product-facing behaviors and design directions—what the product should do/look like.

## Non-Negotiable

- Do NOT proceed without consulting docs
- Do NOT ignore documented patterns
- Do NOT deviate from documented conventions
- Do NOT make assumptions when docs exist

## Refactoring Checklist

When changing a component/function interface (adding required props, changing signatures):

1. **Search for all usages** before committing changes (use grep/search tools)
2. **Update all call sites** - don't assume you found them all from reading one file
3. **Run tests** after changes to catch missed usages
4. **Check feature docs** for "Usage Locations" sections that list where components are used

When cleaning up imports:

1. **Verify each import is unused** before removing - some may be used by other functions in the same file
2. **Run linter/compiler** after cleanup to catch accidental removals

## Keep Docs Updated

**Documentation updates are part of your work, not an afterthought. Read the relevant README before adding or changing files in that area.**

When planning any task, include documentation updates as explicit steps in your plan:

- **New patterns or conventions?** → Plan to add to `/docs/adrs/`
- **New features or user flows?** → Plan to add/update `/docs/features/`

If you use Plan mode, your plan MUST include documentation tasks when the work introduces:

- New user-facing features
- New technical patterns or conventions
- Changes to existing documented behavior

Only document when truly relevant. Do NOT make minor tweaks or rephrase things that are already clear.

---

**The `/docs` folder is your source of truth. Keep it that way.**
