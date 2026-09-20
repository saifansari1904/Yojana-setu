<div align="center">

![Yojana Setu — सही योजना • सही सहायता • सही रास्ता](docs/banner.svg)

### Find every government scheme you're eligible for — in your language.

**Discover · Match · Explain · Prepare · Apply · Track**

Yojana Setu matches entrepreneurs with relevant Indian government schemes through an explainable eligibility engine, then guides them all the way from discovery to application tracking.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-469_passing-16A34A)](#-testing)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](#-license)

</div>

---

## ✨ Why Yojana Setu?

Thousands of government schemes exist. Most entrepreneurs never find the ones made for them — buried portals, English-only pages, unclear eligibility.

Yojana Setu flips that: tell it about your business once, and it surfaces every scheme you match with, explains *why* in plain language, and walks you through applying.

```text
Profile → Business Need → Scheme Discovery → Eligibility Match
   → Plain-language Explanation → Document Prep → Official Application → Tracking
```

---

## 🚀 Features

### 🎯 Explainable Scheme Matching
Weighted, deterministic matching across social category, business type, income, age, and state — with every score broken down into `MATCHED` / `UNKNOWN` / `MISMATCHED` criteria. No black boxes: each result shows exactly why it matched, and what's blocking the ones that didn't.

### 🧭 Guided Application Journey
- **Next-best-action engine** — the single most useful thing to do right now
- **Document checklist** — per-scheme readiness tracking
- **Application workspace** — eligibility, financial, and submission prep in one place
- **Official handoff** — routes to real government portals, never a fake "apply here"

### 📌 Application Tracker & Command Center
Track every application's stage, get follow-up reminders, and see your whole journey — matches, documents, and applications — on one dashboard.

### 💬 WhatsApp Sharing
One tap shares a scheme's key details — name, benefit, your match %, and the official link — prefilled in your own language. Built for how scheme information actually spreads.

### 🌐 Truly Multilingual
Full UI in **English, Hindi, Tamil, Telugu, Kannada, and Malayalam**. Language changes presentation — never the matching decisions.

### ✨ Premium Motion Design
Directional page transitions, shared-element morphs between results and detail, an animated match gauge with count-up, staggered entrances, scroll reveals, skeleton loaders — all with `prefers-reduced-motion` respected throughout.

### 🌙 Thoughtful Details
Dark mode, responsive mobile-first layout, accessibility-minded components, and a strict no-fabrication rule: deadlines and official claims are never invented.

---

## 🖼️ Screenshots

> Add screenshots here — `docs/screenshots/` is a good home for them.

| Eligibility | Results | Scheme Detail |
|---|---|---|
| *your screenshot* | *your screenshot* | *your screenshot* |

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animation | Motion (`motion/react`) |
| Icons | Lucide React |
| i18n | Custom typed locale system (6 languages) |
| Logic | Deterministic domain engines, typed data models |

---

## ⚡ Getting Started

### Requirements
- Node.js 18+
- npm

### Install & run

```bash
npm install
npm run dev
```

Open the URL Vite prints in the terminal (default `http://localhost:3000`).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Full test suite (469 tests) |
| `npm run preview` | Preview the production build |

---

## 🧪 Testing

```bash
npm test
```

The suite covers the matching engine, eligibility logic, scheme data validation, trust scoring, business intelligence, the application journey, and profile storage — **469 tests, all passing**.

---

## 📁 Project Structure

```text
src/
├── animations/     # Motion primitives: pages, reveals, skeletons, transitions
├── components/     # Screens (eligibility, results, detail, tracker…) + UI
├── data/           # Scheme datasets + validation
├── features/       # Feature modules (e.g. command center)
├── i18n/           # Typed translations — en, hi, ta, te, kn, ml
├── lib/            # Domain logic: matching, eligibility, tracker, profile
├── theme/          # Dark/light theme
├── types/          # Shared TypeScript types
└── utils/          # Shared helpers
```

---

## 🔐 Product Principles

- **Explainability over black-box recommendations** — every score shows its working
- **Official-source-first** — guidance points at real government channels
- **Language is presentation, not logic** — translations never change decisions
- **Never fabricate** — no invented deadlines, no fake authority claims
- **Deterministic matching** — same profile, same results, every time

---

## 🗺️ Roadmap

- [ ] Deadline reminders for saved schemes
- [ ] Family profiles — eligibility for the whole household
- [ ] Nearby CSC / government office locator
- [ ] Voice-based eligibility input
- [ ] Backend persistence & authentication
- [ ] Live scheme-data pipeline

---

## 📄 License

Private product codebase. Do not redistribute or reuse without permission.

<div align="center">

### 🌉 Yojana Setu
**Connecting Entrepreneurs with Opportunities**

</div>
