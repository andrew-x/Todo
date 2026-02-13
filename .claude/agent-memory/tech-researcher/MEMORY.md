# Tech Researcher Memory

## RTK Query Research (2026-02-12)

- Project uses `@reduxjs/toolkit@^2.11.2`, `react-redux@^9.2.0`
- Empty API slice pattern already set up at `src/store/api.ts` with `fakeBaseQuery()`
- Store configured at `src/store/store.ts` with `setupListeners`
- Typed hooks at `src/store/hooks.ts`
- See `rtk-query.md` for comprehensive patterns and reference

## Source Quality Notes

- Official RTK docs at redux-toolkit.js.org are well-maintained and current for 2.x
- Context7 `/reduxjs/redux-toolkit` has 840 snippets, High reputation, score 84.1
- GitHub issue #3692 is the canonical feedback thread for RTK Query pain points
- Blog post at hayven.dev/blog has solid lessons-learned on API slice architecture
- Oren Farhi's blog (orizens.com) has good Firestore + RTK Query integration examples
