# Seren
> *Your daily study companion — knows your courses, revises with you, remembers everything.*

Seren is a Chrome extension that lives where you study. Select any text on any page, right-click, and Seren is already there — ready to explain, quiz you, or build your schedule. Powered by Claude on the cloud, zero load on your machine.

---

## Features

- **Smart study chat** — Ask Seren anything about your courses, notes, or deadlines
- **Context-aware actions** — Select text on any page → right-click → "Solve with Seren", "Summarize", "Quiz me on this"
- **Schedule import** — Select your timetable on uOzone or any university portal → Seren structures it instantly
- **Early reminders** — Get reminded 3 days before every deadline, calmly
- **Overwhelm mode** — Feeling overwhelmed? One task at a time, nothing else
- **Academic memory** — Upload your PDFs and notes, Seren remembers them across every session
- **Focus sessions** — Launch a session, stay anchored, log what you accomplished

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension | Chrome (Manifest V3) · JavaScript |
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | Python + FastAPI · fully cloud-hosted |
| Database | SQLite (dev) → PostgreSQL (prod) |
| AI | Claude API — Sonnet 4.6 (standard) · Opus (complex) |
| Auth | JWT |

---

## Preview

<!-- Add screenshots here -->

---

## Ethics & Privacy

Seren never bypasses university authentication. All data access is voluntary:
- `.ics` export manually provided by the user
- Extension reads only content explicitly selected by the user

No data collected without explicit consent.

---

## Contact

Built by [@lein5in](https://github.com/lein5in) · University of Ottawa  
Feedback and collaborations always welcome.

---

*Calm · Smart · Yours*