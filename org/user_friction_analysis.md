# User Friction Analysis: Current System State (2026-03-31)

**Owner:** User Research Lead  
**Date:** 2026-03-31  
**Status:** Research complete, task blocked by platform execution lock (OMN-793)

---

## Executive Summary

Two P0-equivalent bugs prevent any user from successfully using the product today:

- **OMN-712** (blank page): Users cannot access the app at all
- **OMN-738** (403 for new users): New users cannot see tasks after registration

These violations directly map to the top abandonment patterns identified in competitive research:

1. "First-use abandonment" — blank page
2. "Learning curve friction" — 403 after signup

**April 13 Phase 1 MVP release is at risk.**

---

## Friction Map: Bugs → User Abandonment

| Bug                         | Status      | User Impact                          | Competitive Pain Point  | Abandonment Likelihood  |
| --------------------------- | ----------- | ------------------------------------ | ----------------------- | ----------------------- |
| OMN-712 blank page          | blocked     | Cannot access app at all             | First-use abandonment   | **Catastrophic (100%)** |
| OMN-738 403 new users       | in_progress | Cannot see tasks after signup        | Learning curve friction | **Very High (90%)**     |
| OMN-736 task creation 500   | done        | Could not create tasks               | Quick-capture failure   | Fixed                   |
| OMN-739 NOT NULL constraint | done        | Could not update tasks without title | —                       | Fixed                   |

---

## Time to First Successful Task

| Metric             | Competitive Benchmark    | Current State                         | Status              |
| ------------------ | ------------------------ | ------------------------------------- | ------------------- |
| First task visible | Linear: <30s             | Effectively infinite (blank page)     | **FAIL**            |
| First task created | Linear: <30s             | Could fail (OMN-738 blocks task list) | **FAIL**            |
| First notification | All competitors: instant | Not built yet                         | **N/A for Phase 1** |

**Conclusion:** A new user today cannot complete a single task. The MVP does not deliver minimum viable value.

---

## Silent Failure Analysis

| Flow              | Error Type      | User Knows Something Failed?            | Amplification Risk                     |
| ----------------- | --------------- | --------------------------------------- | -------------------------------------- |
| Blank page        | Complete silent | No — assumes product is dead            | **Critical** — no error boundary in UI |
| 403 new users     | Semi-silent     | Partial — sees 403 but doesn't know why | High — confusion                       |
| Task creation 500 | Explicit        | Yes — sees error message                | Low — user knows what happened         |

**Gap:** No error boundary in UI. Users see blank page instead of helpful error. This amplifies technical failures into trust failures.

---

## Phase 1 Feature Gap vs. User Research Priorities

| Competitive Pain Point | Research Recommendation | Phase 1 Issue                  | Current Status | Priority     |
| ---------------------- | ----------------------- | ------------------------------ | -------------- | ------------ |
| Quick capture <3s      | P0                      | OMN-364 Natural Language Input | TODO           | **Critical** |
| Notification overload  | P1                      | OMN-382 Notification System    | TODO           | High         |
| Learning curve         | P0                      | OMN-367 Context Detection      | TODO           | High         |
| Context preservation   | P2                      | Not planned                    | Not started    | Medium       |

**Critical finding:** OMN-364 (Natural Language Input) maps directly to the #1 abandonment point from competitive research. If not built, the product's core differentiator is missing on launch day.

---

## User Trust Impact Assessment

| Scenario                      | Trust Impact | Recovery Difficulty              | PM Priority |
| ----------------------------- | ------------ | -------------------------------- | ----------- |
| Blank page on first visit     | Catastrophic | Hard — first impression lost     | **P0**      |
| 403 after signup              | Very High    | Medium — fixable with good UX    | **P0**      |
| No Phase 1 features on launch | High         | Easy — features can be added     | P1          |
| Missing quick capture         | Catastrophic | Medium — core value prop missing | **P0**      |

---

## Recommendations for Product Manager

1. **Fix OMN-712 first** — zero users can evaluate the product. This is a total trust failure.
2. **Fix OMN-738 urgently** — new user experience is broken at the critical moment (post-signup).
3. **OMN-364 (Natural Language Input) must ship** — maps to #1 abandonment point. Without it, users cannot verify the core value proposition in under 3 seconds.
4. **Add error boundaries to UI** — convert silent failures into helpful messages. A "Something went wrong" message is better than a blank page.
5. **Connect feedback API to UI** — `/api/feedback` exists but is not wired to any user-facing form. Users encountering bugs have no way to report them.

---

## Research Infrastructure Status

| Component               | Status                       | Notes                                           |
| ----------------------- | ---------------------------- | ----------------------------------------------- |
| Feedback collection API | ✅ Working                   | `/api/feedback` POST/GET                        |
| UI feedback form        | ❌ Missing                   | Users cannot submit feedback                    |
| Behavioral analytics    | ❌ Not implemented           | No user journey data                            |
| Real user feedback data | ❌ None                      | Research based entirely on competitive analysis |
| Error monitoring        | ❌ No visible Sentry/logging | Silent failures undetected                      |

---

## Escalation

Phase 1 MVP success criteria (per OMN-542) states "No P0/P1 bugs." This criterion is **already violated**:

- OMN-712 = P0 (users cannot access app)
- OMN-738 = P1 (new user onboarding broken)

**Recommendation:** Formal scope review with PM before April 13 deadline. Consider whether to:

1. Delay release until OMN-712 and OMN-738 are fixed AND OMN-364 ships
2. Release with known P0 bugs and poor first-use experience
3. Reduce scope to only what works (core task CRUD, no Phase 1 features)

---

## Related Documents

- [User Research Report](/OMN/user_research_report.md)
- [Competitive Analysis](/OMN/competitive_analysis_report.md)
- [Phase 1 MVP Status](/OMN/issues/OMN-542)
