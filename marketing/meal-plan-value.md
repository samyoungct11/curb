# Why the Meal Plan Feature Is Curb's Best Selling Point

## The one-liner

> **The average meal plan costs $5,656 a year, and no budgeting app on earth tracks it. Curb does.**

## The problem nobody else touches

A college student's meal plan is usually their **single largest prepaid asset** — bigger than their checking account balance for most of the semester. And it is financially invisible:

- **It's expensive.** The average lowest-cost plan hit **$5,656/year** for 2025–26 (up ~26% in recent years), with plans ranging **$3,000–$11,000**.
- **It's use-it-or-lose-it.** Most schools don't refund unused dining dollars or swipes; balances expire at semester or academic-year end. A student who strands 90–100 swipes at ~$15.59/meal walks away from **$1,400–$1,560** — every semester.
- **It's mispriced in students' heads.** Students treat swipes as free and dining dollars as fake money, then panic-spend in the last two weeks (campus papers literally cover the end-of-semester swipe scramble as a recurring story).
- **Banks and budget apps can't see it.** Plaid connects to banks. Meal plans live in campus card systems — a world no consumer fintech has entered.

That last point is the moat: **Mint never did this. Copilot and Monarch target 30-somethings. YNAB makes you do it by hand.** For Curb's exact audience, the most important balance in their financial life is the one no competitor can display.

## Why Curb can actually do it

The campus card market is effectively a **duopoly**: Transact and CBORD — which have **merged and are rebranding as "Illumia" in March 2026** — power the large majority of US campuses (eAccounts, GET), with Atrium and TouchNet covering most of the rest. That consolidation is great news for us:

1. **One partnership ≈ most campuses.** Grubhub and BYPPO already integrate with Transact + CBORD for campus payments — the third-party path exists and is proven.
2. **Students already have portal logins.** Real-time balances are exposed today through eAccounts/GET student portals — the data exists and students have credentials to it.
3. **Until then, manual works fine.** A meal plan has one balance that changes a few times a day, not a bank feed. A student updating their balance once a week gives Curb 95% of the insight value with zero integration cost.

## The phased build (ship value now, deepen later)

| Phase | What | Integration cost |
|---|---|---|
| **v1 (shipped)** | Student enters plan once (school, dining dollars, swipes, term dates). Curb computes burn rate, projected run-out date, daily allowance, and swipe value. Weekly balance update takes 10 seconds. | Zero |
| **v2** | "Sync from portal" — student pastes their eAccounts/GET balance or forwards the balance email; Curb parses it. | Days |
| **v3** | Official Illumia/Atrium partnership for live balances (the Grubhub path). Pitch: "we drive on-campus dining engagement." | Partnership BD |

## What the feature actually tells a student

- **Burn rate:** "At your pace, dining dollars run out **Aug 2** — two weeks before the semester ends."
- **Daily allowance:** "Keep it under **$4.10/day** and you coast to the finish."
- **Swipe math:** "You've got 23 swipes worth ≈ **$9.40 each**. Swipes expire — dollars don't. Burn the swipes first."
- **Coach integration:** the AI coach sees the meal plan next to bank spending, so "can I afford Chipotle?" gets the *right* answer: "you have $214 in dining dollars dying in August — eat on campus and save the cash."

## Why it sells

1. **Demo magic.** In a 15-second TikTok, "your bank app can't see your dining dollars — this can" is instantly understood by every student watching.
2. **Campus-viral by construction.** The feature is literally about *their school's* meal plan. Ambassadors can pitch it with the school's own plan prices. UGC hooks write themselves ("how I stopped wasting $1,400 in swipes").
3. **Retention spine.** Bank balances change daily; meal plans create a *semester-long narrative arc* (will I make it to May?) with natural weekly check-ins.
4. **Investor story.** It's a wedge into campus payments — the duopoly consolidating into Illumia means one BD deal unlocks structured access at scale, and Curb arrives with the student-facing product already loved.

## Sources

- [Money — College Students Are Paying More for Campus Meal Plans](https://money.com/college-meal-plan-costs-rising/)
- [ELFI — The Cost of School Meal Plans in 2025](https://www.elfi.com/student-loans/college-meal-plan-study/)
- [The Observer — Students scramble to use meal swipes before the semester ends](https://www.ndsmcobserver.com/article/2025/12/tnjyxizf1raq)
- [BYPPO — Campus Meal Plan Integration with Transact + CBORD (Illumia)](https://www.byppo.com/post/redefining-campus-dining-through-campus-meal-plan-integration)
- [Grubhub Onsite — Campus Cards partnerships (Transact, CBORD, Atrium, TouchNet)](https://onsite.grubhub.com/solutions/partnerships/campus-cards/)
- [CBORD — Illumia Commerce platform](https://www.cbord.com/industries/higher-education/solutions/commerce)
