# Contraction Timer

A pop-art styled contraction timer web app for tracking labour contractions — duration, frequency, and when to head to hospital.

**Live app:** https://xhuw.github.io/Contraction-timer/

---

![Screenshot](docs/screenshot.png)

---

## Features

- **Live duration timer** — colour shifts orange at 45s, red at 60s
- **Rest counter** — counts up between contractions in a calm blue scheme
- **NHS hospital guidance** — three-tier indicator (stay home / call midwife / go now) based on [NHS advice](https://www.nhs.uk/pregnancy/labour-and-birth/signs-that-labour-has-begun/)
- **Charts** — bar chart for contraction durations, line chart for frequency, both colour-coded by severity
- **Contraction log** — timestamped table with status badges
- **Persists across refresh** — state saved to `localStorage`, including mid-contraction; RESET clears everything
- **Keyboard shortcut** — Spacebar to start/stop

## Usage

Hit **START** when a contraction begins, **STOP** when it ends. Repeat. The app tracks the rest automatically and updates guidance as your pattern develops.

## Guidance thresholds

| State | Condition | Action |
|---|---|---|
| Monitoring | Irregular or > 10 min apart | Stay home, rest |
| Call midwife | 5–10 min apart or ≥ 45s long | Call your maternity unit |
| Go to hospital | ≤ 5 min apart AND ≥ 45s, 3+ contractions | Go now |

Always call immediately for: waters breaking · heavy bleeding · reduced baby movements · or if you are worried.
