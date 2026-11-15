# Interval Pace Planner

A single-file running pace calculator, workout picker, and interval timer.
The app lives entirely in `index.html`: inline vanilla JavaScript and CSS,
no frameworks, runtime dependencies, images, or build step.

## Run

Open `index.html` directly in a browser, or serve the repository locally:

```sh
python3 -m http.server 3000
```

Visit `http://localhost:3000`. Python is only a preview server; the app does not
need a backend or database. Hosting requires only the static `index.html`.

## Behavior

Enter a positive 3-mile time as minutes and two-digit seconds (for example,
`24:00`). The app remembers this input in local storage when available; it
does not save workout progress or history.

- Interval pace: the entered time divided by three, in seconds per mile.
- Threshold pace: interval pace plus 27 seconds per mile.
- Easy pace: interval pace plus 90–150 seconds per mile.
- 400m target: interval pace × 400 / 1609.344, rounded to the nearest second
  with a one-second minimum. A mile is not exactly four 400m laps.

For `24:00`, the targets are `8:00/mi`, `8:27/mi`, `9:30–10:30/mi`, and
`1:59` per 400m. The three sessions total `32:00` (30/30s), `46:22` (400m
repeats), and `42:00` (threshold). All include ten-minute warmup and cooldown
segments.

Start, pause, resume, and reset control the selected session. Returning to
Sessions or the main page cancels and resets it.

### Browser limits

Audio cues use Web Audio after a Start interaction. Unsupported or blocked
audio shows a warning while the timer continues visually. Keep the screen open
and awake: background tabs and locked phones may suspend timers and audio.
When the page becomes visible again, a running timer catches up to the current
segment; missed countdown beeps are not replayed. Reliable lock-screen audio
is not guaranteed. Reloading discards the current workout.

## Regression checks

With Node.js 22 or newer, run:

```sh
node --test tests/app.test.mjs
```

No package installation is needed. The tests execute the app's actual inline
script with a minimal DOM stub and controlled clock. They cover input
validation and storage, pace calculations, workout structure and duration,
pause/resume/reset, navigation cancellation, background catch-up, completion,
and unsupported-audio fallback. They do not establish real-browser rendering
or audible output.

For browser checks, try the `24:00` flow at desktop and narrow mobile widths,
start and pause a session, reset it, and leave using each back button. Return
to the tab and verify a cancelled session stays reset. Check audible cues on
the actual phones and browsers you plan to support.
