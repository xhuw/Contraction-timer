# Contraction Timer

A pop-art styled contraction timer web app for tracking labour contractions — duration, frequency, and when to head to hospital.

**Live app:** https://contraction-timer.com

---

![Screenshot](docs/screenshot.png)

---

## Features

### Timer
- **START / STOP / RESET** buttons with pop-art ripple animations
- Large bold display using Bebas Neue / Anton fonts
- Live colour feedback during a contraction: green → orange (≥ 45s) → red (≥ 60s)
- **Rest counter** — after stopping, the same timer widget switches to a calm blue scheme and counts up time since the last contraction ended
- **Undo button** (↩ corner of timer card) — reverses the last START or STOP press; press multiple times to step back further; disabled when nothing to undo
- **Keyboard shortcut** — Spacebar to start/stop

### Data & persistence
- All state saved to `localStorage` on every action — survives page refresh, including mid-contraction
- Restoring a mid-contraction session resumes the timer from its original start time
- **RESET** prompts a confirmation modal before clearing data

### NHS hospital guidance
Three-tier indicator informed by [NHS maternity guidance](https://www.nhs.uk/pregnancy/labour-and-birth/signs-that-labour-has-begun/). The NHS-specified triggers the app surfaces directly are:

| Action | NHS trigger |
|---|---|
| Call your maternity unit | Regular contractions every 5 minutes or more often |
| Call urgently | Any contraction over 2 min · 6+ contractions in 10 min · waters break · any vaginal bleeding · baby moving less than usual · less than 37 weeks pregnant · or any worry |
| Call 999 | Baby is coming or strong urge to push |

The app's frequency bands (≤ 5 / 5–10 / > 10 min) and duration colour cues (≥ 45s / ≥ 60s) are the app's own pattern-detection heuristics — not NHS thresholds.

### Charts
- **Duration bar chart** — each contraction coloured green / orange / red by threshold
- **Frequency line chart** — interval between contractions in mm:ss, colour-coded by urgency
- Both charts update live after every contraction

### Contraction log
- Timestamped table: start time, duration, interval (mm:ss), status badge (OK / WATCH / ALERT)
- Newest entry at the top
- **Export CSV** button downloads the full log with headers
- Mobile-responsive: on small screens the `#` column is hidden, seconds are trimmed from the time, and padding tightens to fit without horizontal scrolling

### Design
- Pop art aesthetic: halftone dot background, bold offset box-shadows, neon palette (yellow, cyan, hot pink, lime green, red)
- Smooth animations throughout: title bounce, button ripples, stat bumps, row slide-in, modal pop
- Reset modal animates in with a bounce + slight rotate

## Usage

1. Press **START** when a contraction begins
2. Press **STOP** when it ends
3. Repeat — the app tracks rest time automatically and updates guidance as your pattern develops
4. Use **↩** to undo a misclick
5. Use **EXPORT CSV** to download your session log

## Reporting bugs

[Open an issue on GitHub](https://github.com/xhuw/Contraction-timer/issues/new)

## Support

If this app helped you, consider buying me a coffee:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/huwpercival)
