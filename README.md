# 🌿 Seren — Your Daily Study Companion
### Calm · Smart · Yours

A Chrome extension + web platform that knows your courses, revises with you, and remembers everything — built from scratch as a solo engineering project.

---

## What is Seren?

Seren is a study companion that lives in your browser. Not a to-do app. Not a chatbot widget. A real companion that sits alongside you every time you open a new tab to study — it knows your deadlines, helps you understand what you're reading, quizzes you on your material, and keeps you focused without the anxiety.

You select a paragraph on any webpage, a Seren toolbar appears, you click — and you get an instant explanation, summary, or quiz question. You open the popup, your deadlines are there. You need to focus, one click and the timer starts. You're overwhelmed, Seren tells you exactly one thing to do right now.

---

## Architecture

```
Chrome Extension (Manifest V3)
├── content.js        → Floating action bar on text selection + auth sync
├── background.js     → Message broker, chrome.storage, context menus
├── popup.html/js/css → Responsive UI: 360px popup + full tab mode (sidebar layout)

React Frontend (Vite + TypeScript)
├── Landing page      → Marketing site, EN/FR
├── /login /register  → Auth pages connected to backend
└── /dashboard        → User dashboard — deadlines, account, extension download

FastAPI Backend (Python)
├── /users            → Register, login, JWT, account management
├── /events           → Deadlines and academic events
├── /schedule         → .ics import and parsing
└── /ai               → Claude-powered chat with caring persona
```

The extension and the web platform are connected — log in on the site, open the popup, your name is already there.

---

## Features

### Chrome Extension
- **Floating toolbar** — select any text on any webpage, Seren appears above your selection with instant actions: Solve, Summarize, Quiz me, Save
- **Popup** — greeting, upcoming deadlines, quick actions, chat, focus timer, SOS mode
- **Full tab mode** — expand the popup into a full-screen two-column app (sidebar + main panel)
- **Context menu** — 6 right-click actions on selected text
- **Focus timer** — 25-minute Pomodoro with visual ring progress
- **SOS mode** — overwhelmed? Seren shows you exactly one task to do right now

### Web Platform
- **Landing page** — bilingual EN/FR marketing site
- **Auth** — register, login, JWT tokens, 30-day sessions
- **Dashboard** — welcome card, deadlines overview, schedule import, account settings
- **Account management** — change name, email, password, delete account

### AI (Claude-powered)
- Conversational chat with a caring, non-judgmental persona
- Context-aware responses based on your academic profile
- Overwhelm detection and gentle redirection
- Quiz generation, summarization, schedule extraction

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| Backend | Python + FastAPI + Uvicorn |
| Database | SQLite (dev) → PostgreSQL (prod) |
| ORM | SQLAlchemy |
| AI | Anthropic Claude Sonnet 4.6 + Haiku |
| Auth | JWT via python-jose |
| Extension | Chrome Manifest V3 |
| Typography | DM Serif Display + DM Sans |

---

## Project Structure

```
Seren/
├── frontend/
│   ├── src/
│   │   ├── components/       Navbar, Hero, Features, Pricing, Footer...
│   │   ├── pages/            Login, Register, Dashboard
│   │   ├── context/          LangContext (EN/FR)
│   │   └── App.tsx           Routing + RequireAuth guard
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── routes/           users.py, events.py, schedule.py, ai.py
│   │   ├── models/           user.py, event.py
│   │   ├── services/         ai.py (Claude integration)
│   │   └── database.py
│   ├── main.py
│   └── requirements.txt
│
└── extension/
    ├── manifest.json         MV3 — permissions: contextMenus, storage, activeTab, tabs
    ├── background.js         Message broker + context menus
    ├── content.js            Floating toolbar + auth sync bridge
    ├── popup.html/css/js     Adaptive UI — popup + full tab mode
    └── icons/
```

---

## Running locally

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Extension**
1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Pin Seren to your toolbar

---

## What I'm building toward

Seren is being built toward a demo-ready product with the following roadmap:

- **PDF upload** — drag your syllabus, Seren extracts all your deadlines automatically
- **Real deadlines** — live data from the backend in the popup and dashboard
- **Cloud deployment** — backend on Railway/Render, shareable with anyone
- **Email on signup** — welcome email via Resend
- **Calendar sync** — connect Google Calendar directly
- **Color palette update** — switching from forest green to a blue-slate SaaS palette post-demo

---

## Cost

Seren runs at approximately **$0.05–0.15/day** in API costs for active use.

| Service | Monthly estimate |
|---|---|
| Claude Sonnet 4.6 | ~$2–6 |
| Claude Haiku | ~$0.20 |
| Hosting (Render) | ~$0 (free tier) |

---

**Built by Ibrahim · University of Ottawa · April2026 - Present**