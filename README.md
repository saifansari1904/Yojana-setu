<div align="center">

# 🌉 Yojana Setu

### Intelligent Government Scheme Discovery for Entrepreneurs

**Discover · Understand · Prepare · Apply · Track**

Yojana Setu helps entrepreneurs find relevant government schemes, understand eligibility and match reasoning, prepare required documents, connect to official application channels, and track their application journey.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](#license)

</div>

---

## ✨ What is Yojana Setu?

Yojana Setu is a **startup/product-first** platform designed around the complete entrepreneur journey—not just scheme search.

```text
Profile
   ↓
Business Need
   ↓
Scheme Discovery
   ↓
Eligibility & Matching
   ↓
Explainable Results
   ↓
Support & Preparation
   ↓
Official Application Handoff
   ↓
Application Tracking
```

The product is designed to keep recommendations **deterministic, explainable and separate from presentation language**.

---

## 🚀 Core Features

| Area | What it provides |
|---|---|
| 👤 **Entrepreneur Profile** | Personal, business, financial, registration and document information |
| 🎯 **Scheme Matching** | Weighted, explainable matching with eligibility blockers |
| 🔍 **Eligibility Engine** | Statutory eligibility checks and gap identification |
| 💰 **Funding Fit** | Financial alignment between entrepreneur needs and schemes |
| 📄 **Document Readiness** | Document checklist and preparation readiness |
| 🧭 **Support Pathway** | Next actions and guided preparation journey |
| 📝 **Application Workspace** | Eligibility, financial, document and submission preparation |
| 🔗 **Official Handoff** | Routes users toward supported official application channels |
| 📌 **Application Tracker** | Tracks application-stage information already supported by the product |
| 📊 **Command Center** | Central entrepreneur dashboard and journey view |
| 🌐 **Multilingual UI** | English, Hindi, Tamil, Telugu, Kannada and Malayalam |
| ✨ **Premium UI** | Responsive design, motion, micro-interactions and accessibility support |

---

## 🧠 Matching Engine

Current matching weights:

| Factor | Weight |
|---|---:|
| Social Category | **30%** |
| Business Type | **25%** |
| Income | **20%** |
| Age | **15%** |
| State | **10%** |

Criteria are evaluated as:

`MATCHED` · `UNKNOWN` · `MISMATCHED`

Supported result classifications include:

`ELIGIBLE` · `NEAR MATCH` · `LOW MATCH` · `BLOCKED`

Mandatory eligibility blockers remain separate from presentation and language.

---

## 🏗️ Architecture

```text
React UI
   │
   ├── Profile / Assessment
   ├── Scheme Discovery
   ├── Results / Comparison
   ├── Application Workspace
   └── Command Center
          │
          ▼
     Domain Services
          │
   ┌──────┼────────┬──────────┐
   ▼      ▼        ▼          ▼
Matching Eligibility Business  Tracker
Engine     Engine   Logic      Logic
   │
   ▼
Explainable Results
          │
          ▼
      i18n / UI
```

The architecture keeps **business decisions separate from localized presentation** wherever the current refactor supports it.

---

## 🛠️ Tech Stack

- **React 19 + TypeScript**
- **Vite 6**
- **Tailwind CSS 4**
- **Motion** for UI animation
- **Lucide React** for icons
- Deterministic domain engines and typed data models

---

## ⚡ Getting Started

### Requirements

- Node.js
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the Vite development URL shown in the terminal.

### Production build

```bash
npm run build
```

### Type check

```bash
npm run lint
```

### Tests

```bash
npm test
```

> Test/build results are environment-dependent; run the commands locally before treating them as passing.

---

## 📁 Project Structure

```text
src/
├── animations/       # Motion and transition primitives
├── components/       # Product screens and UI components
├── data/             # Scheme and validation data
├── features/         # Feature-specific modules
├── i18n/              # Localized UI resources
├── lib/               # Domain/business logic
├── types/             # Shared TypeScript types
└── utils/             # Shared utilities and matching helpers
```

---

## 🔐 Product Principles

- **Explainability over black-box recommendations**
- **Official-source-first application guidance**
- **Language changes presentation, not business decisions**
- **No fabricated verification or government authority claims**
- **Existing matching and eligibility behavior must remain deterministic**
- **Profile data should act as the entrepreneur's central product context**

---

## 🎯 Product Direction

Yojana Setu is being developed as a **long-term entrepreneur support platform**, with SIH treated as a secondary opportunity rather than the product's primary objective.

The broader direction is:

**Understand → Match → Explain → Prepare → Apply → Track → Support**

---

## 📌 Current Status

The current codebase includes the major product foundations for:

- Entrepreneur profile and account experience
- Scheme discovery and matching
- Eligibility and business intelligence
- Support pathway and next-best-action flows
- Document/application preparation
- Application tracking and Command Center
- Multilingual presentation
- Motion and responsive UI system

Some production concerns—such as a complete live scheme-data pipeline, backend persistence/authentication, and the future AI assistant—remain separate development areas.

---

## 📄 License

This project is currently maintained as a private product/codebase. Do not redistribute or reuse the code without permission.

<div align="center">

### 🌉 Yojana Setu
**Connecting Entrepreneurs with Opportunities**

</div>
