A single-input running workout planner: enter your current 3-mile time and get
structured interval sessions with the right target paces, plus a built-in timer
that runs the workout.

**Live demo:** 
https://interval-pace-coach.replit.app/
*(Hosted on Replit, where this was originally built and deployed.)*

## Why

Apple Watch and most running apps will happily run an interval timer, but none of
them tell you what pace you should actually be running. You're left doing the math
yourself — converting a race time into VO2max, threshold, and easy paces, then
hand-building each workout. This does that conversion in one step.

## How it works

All paces derive from your 3-mile time, converted to seconds per mile:

| Pace | Formula |
|------|---------|
| Interval (VO2max) | 3-mile pace |
| Threshold | 3-mile pace + ~27 s/mile |
| Easy | 3-mile pace + 90–150 s/mile |
| 400m target | interval pace ÷ 4 |

Three session types are generated, each with a 10-minute easy warm-up and cool-down:

- **30/30s** — 12 × (30s at interval pace / 30s easy jog)
- **400m repeats** — 8 × 400m at interval pace, 90s rest
- **Threshold** — 2 × 10 min at threshold pace, 2 min easy between

Easy pace is shown as a range rather than a single number, since the real test is
whether you can hold a conversation.

## Stack

React, TypeScript, Vite. No backend — all calculation happens client-side.

## Running locally

```bash
npm install
npm run dev
```

## Notes

Built in an afternoon at Playground, a hands-on build event at Cornell Tech
(November 2026), using Replit's AI-assisted development tooling. The pace
formulas and session structures are mine; the implementation was AI-assisted.
