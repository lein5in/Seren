#  Seren (Sturent)
> *A calm and intelligent companion for anxious students.*

Seren is a Progressive Web App (PWA) designed to help students manage their deadlines, schedules, and mental load — without the surprises that trigger anxiety. Before planning anything, Seren *listens*. It asks questions, adapts to you, and walks alongside you with calm at every step.

---

##  Why Seren?

Most productivity tools are cold, rigid, and built for people who don't struggle with anxiety. Seren is different:

- It **asks** before imposing
- It **adapts** to your life, not the other way around
- It **prevents** rather than surprises
- It works during the school year, internships, and vacations

---

##  Features

### Phase 1 — Core MVP
- [ ] Caring conversational onboarding (questions about your availability, priorities, and anxiety level)
- [ ] University schedule import via `.ics` file (uOzone)
- [ ] Calendar view with deadlines organized by priority
- [ ] Automatic reminders 3 days in advance
- [ ] Calm and reassuring tone throughout all interactions

### Phase 2 — Intelligence
- [ ] Browser extension to automatically read Brightspace content
- [ ] **Overwhelm Mode** — one task at a time when you're feeling overwhelmed
- [ ] Daily emotional check-ins
- [ ] Workload adjustment based on how you feel that day

### Phase 3 — Patterns & Memory
- [ ] Habit analysis (when you're most productive, where you tend to procrastinate)
- [ ] Smart suggestions based on your history
- [ ] Works outside of the school year — internships, vacations, personal projects

### Phase 4 — Expansion (Freemium)
- [ ] Budget planner integrated with your calendar
- [ ] Google Calendar / Notion integration
- [ ] Premium features shaped by real user feedback

---

##  Technical Architecture

| Component | Planned Technology |
|---|---|
| Frontend / PWA | React + Tailwind CSS |
| Backend | Python (FastAPI) or Node.js |
| Database | PostgreSQL or Firebase |
| Conversational AI | Claude API (Anthropic) |
| Browser Extension | JavaScript (Chrome/Firefox) |
| Authentication | JWT / OAuth |

---

##  Roadmap

```
Phase 1 — Core MVP       → Weeks 1 to 4
Phase 2 — Intelligence   → Weeks 5 to 7
Phase 3 — Patterns       → Weeks 8 to 10
Phase 4 — Expansion      → Weeks 11 to 14
```

---

##  Ethics & Integrity

Seren does not bypass any university authentication system. Data access happens only through:
- **`.ics` export** voluntarily provided by the user from uOzone
- **Browser extension** that reads Brightspace pages *already open* by the user

No data is collected without explicit consent.

---


```

---

##  Contact

Project developed by [@lein5in](https://github.com/lein5in)  
Ideas, feedback, collaborations — always welcome.

---

*Seren — because managing student life shouldn't be an additional source of stress.* 