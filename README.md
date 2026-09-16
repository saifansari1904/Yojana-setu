# Yojana Setu

> **An intelligent, explainable scheme-discovery and application-preparation platform for entrepreneurs.**

Yojana Setu helps entrepreneurs discover relevant government support schemes, understand eligibility and match reasoning, assess financial/document readiness, prepare for official submission, and track their own application journey — all through a transparent, bilingual, government-source-first experience.

The project is designed as a **startup/product platform first**, with Smart India Hackathon (SIH) use as a secondary opportunity.

---

## Table of Contents

- [Overview](#overview)
- [Why Yojana Setu](#why-yojana-setu)
- [Core Product Flow](#core-product-flow)
- [Key Features](#key-features)
- [Matching Engine](#matching-engine)
- [Business Intelligence](#business-intelligence)
- [Support Pathway](#support-pathway)
- [Application Preparation Workspace](#application-preparation-workspace)
- [Entrepreneur Command Center](#entrepreneur-command-center)
- [Trust, Provenance & Data Freshness](#trust-provenance--data-freshness)
- [South India Coverage](#south-india-coverage)
- [Bilingual Experience](#bilingual-experience)
- [Motion & UI System](#motion--ui-system)
- [Privacy & Security Principles](#privacy--security-principles)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [Testing](#testing)
- [Production Build](#production-build)
- [Data & Source Integrity](#data--source-integrity)
- [Important Product Boundaries](#important-product-boundaries)
- [Current Scope](#current-scope)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Yojana Setu is built around a simple product idea:

> **Finding a government scheme is only the beginning. An entrepreneur also needs to understand why it matches, what information is missing, what documents are needed, how financially relevant it is, how to prepare, where to apply officially, and what to do next.**

Instead of presenting a flat list of schemes, Yojana Setu combines:

**Profile → Business Need → Matching → Explainability → Support Pathway → Preparation → Official Portal Handoff → Application Tracking**

The platform is intentionally designed so that recommendations remain **deterministic and explainable**, while the surrounding product experience provides actionable guidance.

---

## Why Yojana Setu

Entrepreneurs can face several practical problems when navigating government support:

- Large numbers of schemes and fragmented information
- Eligibility conditions that are difficult to interpret
- State-specific requirements
- Unclear financial fit
- Missing or incomplete documents
- Difficulty understanding what to do after finding a scheme
- Uncertainty around official application channels
- Lack of a single place to track preparation and application progress

Yojana Setu addresses these problems through a unified product experience rather than a simple scheme-search interface.

---

# Core Product Flow

```text
                ENTREPRENEUR PROFILE
                        │
                        ▼
                BUSINESS NEEDS
                        │
                        ▼
              SCHEME DISCOVERY
                        │
                        ▼
              ELIGIBILITY AUDIT
                        │
                        ▼
              MATCHING ENGINE
                        │
                        ▼
            EXPLAINABLE RESULTS
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
       SUPPORT PATHWAY        SCHEME DETAILS
             │                     │
             └──────────┬──────────┘
                        ▼
              APPLICATION WORKSPACE
                        │
                        ▼
              READINESS PREPARATION
                        │
                        ▼
              OFFICIAL PORTAL HANDOFF
                        │
                        ▼
             CITIZEN CONFIRMS SUBMISSION
                        │
                        ▼
              APPLICATION TRACKER
                        │
                        ▼
             ENTREPRENEUR COMMAND CENTER
```

---

# Key Features

## 1. Personalized Entrepreneur Profile

The assessment captures the information required by the product's matching and business-intelligence layers, including areas such as:

- Age
- Social category
- State and geography
- Business type
- Business stage
- Income
- Investment requirements
- Business information
- Registration-related information
- Other eligibility and business-context signals

The profile is validated before matching.

Incomplete information is treated explicitly rather than silently converted into a negative eligibility result.

---

## 2. Deterministic Scheme Matching

Yojana Setu uses an authoritative weighted matching engine.

### Current factor weights

| Factor | Weight |
|---|---:|
| Social Category | 30% |
| Business Type | 25% |
| Income | 20% |
| Age | 15% |
| State | 10% |
| **Total** | **100%** |

The matching layer is deliberately separated from statutory eligibility logic.

### Three-state criterion evaluation

Criteria can be evaluated as:

- `MATCHED`
- `UNKNOWN`
- `MISMATCHED`

This prevents missing profile information from being treated as a confirmed disqualification.

### Mandatory blockers

Confirmed statutory blockers are surfaced separately so that:

- incomplete information is not confused with disqualification
- genuine eligibility blockers are clearly communicated
- recommendations remain explainable

---

# 3. Explainable Recommendations

Yojana Setu does not only provide a percentage.

For a matched scheme, the product can explain:

- Which factors contributed positively
- Which factors need attention
- Which information is missing
- Whether a statutory blocker exists
- Why the scheme appears in the recommendation list
- What action the entrepreneur can take next

The explanation layer is designed to remain consistent with the underlying matching calculation.

---

# 4. Financial Fit

The product includes financial intelligence for scheme discovery and preparation.

It can work with signals such as:

- Investment requirement
- Funding requirement
- Loan limits
- Subsidy percentages
- Financial alignment
- Funding gaps
- Promoter-margin-related readiness

Financial calculations are kept separate from the core matching score.

---

# 5. Business Intelligence

Yojana Setu understands the entrepreneur's broader business context rather than treating every user as a generic applicant.

### Business stages

The project includes a structured business-stage taxonomy covering:

- Idea & Planning
- Pre-Launch & Setup
- New Business
- Early Operation
- Growth & Scaling
- Expansion & Diversification
- Turnaround & Relief

The product can use business-stage and business-need signals to organize relevant support.

---

# 6. Business Need Intelligence

Support can be organized around practical business needs, including areas such as:

- Funding
- Registration
- Skill Development
- Infrastructure
- Market Access

The system maps business context to relevant support areas without creating a second scheme taxonomy.

---

# 7. Support Pathway

The Support Pathway moves beyond:

> "Here is a scheme."

toward:

> "Here is the broader support journey around your current business need."

It includes:

- Stage-based priorities
- Need-to-support-area mapping
- Support stacks
- Pathway actions
- Preparation checklists
- Application readiness
- Next-best-action logic
- Provenance information

The pathway is deterministic and uses existing product signals.

---

# 8. Application Preparation Workspace

Yojana Setu includes a dedicated preparation workspace for moving from discovery toward official application.

### Four readiness pillars

```text
1. Statutory Eligibility
2. Document Dossier
3. Financial Alignment
4. Official Submission Process
```

The workspace can surface:

- Eligibility audit
- Required documents
- Document preparation progress
- Financial alignment
- Application channel
- Official portal information
- Nodal office information where available
- Helpline information where available
- Submission preparation guidance

---

# 9. Application Channels

The product models different official application pathways, including:

- Online portal
- Official bank / nodal channel
- District Industry Centre

The application workspace adapts guidance to the available application channel.

---

# 10. Official Portal Handoff

Yojana Setu is an **advisory and preparation platform**, not a government application processor.

The product can provide a handoff to an official application channel when the dataset contains an appropriate official URL.

A critical distinction is maintained:

```text
Opening an official portal
        ≠
Submitting an application
```

The application is only recorded as submitted when the citizen explicitly confirms it.

---

# 11. Citizen Submission Confirmation

The application workspace includes a confirmation flow where the entrepreneur can record:

- Submission date
- Application reference number, if available
- Portal used
- Optional notes
- Confirmation acknowledgement

The platform does not falsely claim that a government application was submitted merely because the portal was opened.

---

# 12. Application Tracker

The tracker supports a citizen-managed application journey.

Current application states include:

- Interested
- Docs Ready
- Applied
- Approved
- Rejected

The tracker can also maintain:

- Notes
- Application date
- Follow-up reminders
- Journey events
- Preparation progress
- Pathway snapshots

Follow-up dates are user-created reminders and are not automatically represented as government deadlines.

---

# 13. Entrepreneur Command Center

The latest version includes an integrated **Command Center**.

Its purpose is to answer:

> **"What should this entrepreneur focus on right now?"**

The Command Center composes existing product systems instead of replacing them.

It brings together:

- Profile completeness
- Next best action
- Top opportunities
- Opportunity priority
- Business journey
- Support stack
- Applications
- Documents
- Follow-ups
- Trust and freshness

### Example product logic

```text
High match
+
No confirmed blocker
+
Strong readiness
+
Official channel available
        ↓
High action priority
```

Whereas:

```text
High match
+
Unknown eligibility information
        ↓
Information Needed
```

This action-priority layer is separate from the authoritative matching score.

---

# 14. Opportunity Lifecycle

The Command Center supports a presentation-level opportunity lifecycle:

```text
DISCOVERED
    ↓
SAVED
    ↓
REVIEWED
    ↓
PREPARING
    ↓
READY TO APPLY
    ↓
APPLIED
    ↓
TRACKING
    ↓
COMPLETED
```

This lifecycle is mapped to the project's application/tracker state rather than replacing the underlying tracker model.

---

# 15. Trust, Provenance & Data Freshness

Trust is a core product principle.

Scheme information includes structured metadata such as:

- Source
- Source type
- Verification status
- Official URL
- Application URL
- Last audited / verified date
- Freshness status
- Nodal-source information where available

### Portal domain classification

The Command Center models portal trust using explicit classifications such as:

```text
VERIFIED_OFFICIAL
KNOWN_NODAL
UNVERIFIED_EXTERNAL
INVALID
```

The product should not assume that a generic domain suffix automatically proves government authority.

### Freshness

Scheme information can be classified based on its verification metadata, for example:

- Recently verified
- Verification ageing
- Verification stale
- Verification unknown
- Marked inactive

Freshness is about the dataset's verification information; it is not automatically a claim about the legal validity period of a scheme.

---

# South India Coverage

The current dataset includes dedicated South India scheme modules for:

- Karnataka
- Kerala
- Tamil Nadu
- Telangana
- Andhra Pradesh

The South India dataset is integrated into the main scheme repository and matching flow.

The architecture is intended to allow additional regional datasets to be added without rewriting the matching and UI layers.

---

# Bilingual Experience

Yojana Setu is designed for:

- **English**
- **Hindi**

The project contains centralized language resources and localized scheme/business content.

The application supports language-aware:

- Navigation
- Assessment
- Results
- Scheme information
- Eligibility explanations
- Business intelligence
- Support pathways
- Application preparation
- Command Center
- Empty states
- Trust messaging

The architecture is designed so additional languages can be introduced later.

---

# Motion & UI System

Yojana Setu uses a premium but restrained interaction system intended to feel closer to modern fintech/product software while retaining a trustworthy government-technology identity.

### Existing motion primitives include

- `AnimatedCounter`
- `AnimatedList`
- `AnimatedPage`
- `AmbientBackground`
- `BurstParticles`
- `GapDiffBar`
- `MatchingTransition`
- `RevealOnScroll`
- `ScrollProgressBar`
- `SetuLoader`
- `Skeleton`
- `SplashScreen`
- `SuccessCheckmark`

### Interaction components

- `ArrowFillButton`
- `BookmarkButton`
- `VerificationBadge`

### Motion principles

Animations are used for:

- Page transitions
- Match-score presentation
- Matching evaluation sequence
- Hover states
- Saved-state feedback
- Progress transitions
- Success feedback
- Content reveal

The application uses a global reduced-motion configuration so users who prefer reduced motion can receive a simpler experience.

---

# Accessibility

The interface is designed with accessibility in mind.

Current implementation principles include:

- Semantic buttons and links
- Keyboard navigation
- Visible focus states
- Accessible dialogs/modals
- ARIA labels where appropriate
- `aria-current` for journey state
- Minimum 44px touch targets for interactive controls
- Responsive layouts
- Reduced-motion support
- Status information that is not conveyed through color alone

---

# Privacy & Security Principles

Yojana Setu follows a privacy-conscious product architecture.

The current client-side persistence is intended for application state and preferences rather than sensitive document storage.

The project avoids persisting sensitive credentials such as:

- Passwords
- OTPs
- Authentication tokens
- Government portal credentials

The application is not intended to act as a government identity or authentication system.

### External links

Official/external links should use safe external-navigation attributes such as:

```html
target="_blank"
rel="noopener noreferrer"
```

### Secrets

API keys and other secrets must not be committed to the repository.

Use environment variables and keep `.env.local` out of Git.

---

# Architecture

Yojana Setu is structured around separation of concerns.

```text
                    ┌───────────────────────┐
                    │       React UI        │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │     Feature Layer     │
                    │ Dashboard / Business  │
                    │ Application / Results │
                    └───────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
       Matching Layer     Business Layer      Tracker Layer
             │                  │                  │
             ▼                  ▼                  ▼
       Eligibility        Support Pathway     Applications
       Explainability     Next Best Action    Follow-ups
       Financial Fit      Readiness           Journey
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                     Scheme Data / Repository
                                │
                                ▼
                     Verification Metadata
```

---

# Architectural Principles

## Single Source of Truth

Core business concepts are centralized through reusable types, constants, taxonomies, and repositories.

## Matching ≠ Eligibility

Eligibility answers:

> "Can the entrepreneur satisfy the statutory requirements?"

Matching answers:

> "How relevant is this scheme to the entrepreneur's profile?"

## Matching ≠ Action Priority

The matching score measures relevance.

Action priority determines what may be most useful to work on next based on additional readiness and journey signals.

## UI ≠ Data Layer

Components consume business/repository abstractions instead of directly coupling themselves to raw scheme arrays.

## Guidance ≠ Government Submission

Yojana Setu prepares and guides the citizen but does not pretend to submit applications on behalf of the citizen.

---

# Project Structure

```text
.
├── assets/
├── src/
│   ├── animations/
│   │   ├── AmbientBackground.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── AnimatedList.tsx
│   │   ├── AnimatedPage.tsx
│   │   ├── MatchingTransition.tsx
│   │   ├── RevealOnScroll.tsx
│   │   ├── SuccessCheckmark.tsx
│   │   └── ...
│   │
│   ├── components/
│   │   ├── application/
│   │   ├── business/
│   │   ├── common/
│   │   ├── ApplicationTrackerScreen.tsx
│   │   ├── ResultsListScreen.tsx
│   │   ├── SchemeDetailScreen.tsx
│   │   └── ...
│   │
│   ├── data/
│   │   ├── states/
│   │   │   ├── andhraPradeshSchemes.ts
│   │   │   ├── karnatakaSchemes.ts
│   │   │   ├── keralaSchemes.ts
│   │   │   ├── tamilNaduSchemes.ts
│   │   │   └── telanganaSchemes.ts
│   │   ├── schemes.ts
│   │   ├── schemeTaxonomy.ts
│   │   └── ...
│   │
│   ├── features/
│   │   └── commandCenter/
│   │       ├── CommandCenterScreen.tsx
│   │       ├── components/
│   │       ├── lib/
│   │       ├── adapter.ts
│   │       ├── types.ts
│   │       └── ...
│   │
│   ├── i18n/
│   │   ├── en.ts
│   │   ├── hi.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── application/
│   │   ├── business/
│   │   ├── data/
│   │   ├── matching/
│   │   └── tracker/
│   │
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── bun.lock
└── README.md
```

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| UI Icons | Lucide React |
| Motion | Motion |
| Runtime utilities | TSX |
| Backend/runtime dependency | Express |
| Environment configuration | dotenv |
| Testing | TypeScript/TSX test scripts |
| Package lock | Bun lockfile |

The project uses a Vite + React architecture and includes Tailwind CSS through the Vite integration.

---

# Getting Started

## Prerequisites

Recommended:

- Node.js
- npm
- Git

Check:

```bash
node --version
npm --version
git --version
```

---

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd yojana-setu
```

Replace `<YOUR_REPOSITORY_URL>` with your GitHub repository URL.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

using `.env.example` as the reference.

```bash
cp .env.example .env.local
```

On Windows, you can create `.env.local` manually and copy the variables from `.env.example`.

---

## 4. Start the development server

```bash
npm run dev
```

The Vite development server is configured for port `3000`.

Open:

```text
http://localhost:3000
```

---

# Environment Variables

The repository contains an `.env.example` file.

Current documented variables are:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="YOUR_APP_URL"
```

### GEMINI_API_KEY

The project metadata identifies server-side Gemini API capability, and the example environment file provides a placeholder for the Gemini key.

Do **not** commit a real API key to GitHub.

### APP_URL

The example configuration describes `APP_URL` as the URL where the application is hosted.

If a deployment environment requires it, configure it with the actual deployed application URL.

> Only configure variables that are actually required by the deployment/runtime you are using.

---

# Available Commands

## Development

```bash
npm run dev
```

Starts the Vite development server.

## Type checking

```bash
npm run lint
```

The project's `lint` script currently runs:

```bash
tsc --noEmit
```

## Tests

```bash
npm test
```

Runs the project's configured test suites sequentially.

## Production build

```bash
npm run build
```

Creates the production Vite build.

## Preview production build

```bash
npm run preview
```

## Clean

```bash
npm run clean
```

Removes generated build/server artifacts according to the project's current script.

---

# Testing

The repository's test command currently covers the project's major deterministic domains, including:

- Matching engine
- Scheme validation
- South India scheme dataset
- Phase 2 scheme intelligence
- Phase 2.5 trust
- Phase 3.1 matching integrity
- Phase 4.1 business intelligence
- Phase 4.2 support pathway
- Phase 4.3 application journey
- Phase 4.4 dashboard
- Command Center merge/integration

Run:

```bash
npm test
```

Tests should be run after changes to:

- Matching rules
- Scheme data
- Eligibility logic
- Trust/provenance
- Business intelligence
- Support pathway
- Application journey
- Command Center logic

---

# Production Build

Before deployment:

```bash
npm install
npm run lint
npm test
npm run build
```

A successful production release should have:

```text
TypeScript → PASS
Tests      → PASS
Build      → PASS
```

Do not treat a build or test as passing unless it was actually executed successfully in the current environment.

---

# Data & Source Integrity

Yojana Setu is designed around a **government-source-first** approach.

Scheme records can contain:

- Scheme identity
- Ministry/department
- State applicability
- Target audience
- Business types
- Eligibility information
- Financial limits
- Subsidy information
- Required documents
- Application instructions
- Official URLs
- Verification metadata
- Freshness metadata
- Application channel
- Provenance

The repository includes state-specific datasets for the current South India coverage.

### Important

The presence of a URL in the application does not by itself mean that every associated claim has been independently verified.

The product should preserve provenance and communicate uncertainty where verification is incomplete.

---

# Important Product Boundaries

## Yojana Setu is not a government portal

It does not impersonate a ministry, department, bank, DIC, or other government authority.

## Yojana Setu is not an application processor

It prepares citizens for official submission and provides a handoff to official channels.

## Yojana Setu does not claim submission automatically

A portal visit is not treated as an application submission.

## Yojana Setu does not fabricate deadlines

Citizen-created follow-ups are not represented as official government deadlines.

## Unknown is not automatically ineligible

Missing information should remain `UNKNOWN` until the relevant requirement can be evaluated.

## Trust claims require evidence

A scheme should not be labelled "official", "verified", or "government-approved" merely because of an arbitrary domain or UI assumption.

---

# Current Regional Scope

The current South India dataset contains dedicated scheme modules for:

```text
Karnataka
Kerala
Tamil Nadu
Telangana
Andhra Pradesh
```

The architecture is designed so additional state datasets can be integrated through the repository/data layer.

---

# Current Product Scope

The current codebase brings together:

### Discovery

- Entrepreneur assessment
- Scheme repository
- State-specific schemes
- Personalized matching
- Saved schemes

### Intelligence

- Eligibility audit
- Weighted matching
- Explainability
- Financial fit
- Business-stage intelligence
- Business-need intelligence
- Support pathways

### Preparation

- Application readiness
- Document dossier
- Financial alignment
- Submission-process guidance
- Official portal handoff
- Citizen submission confirmation

### Tracking

- Application tracker
- Application status
- Notes
- Follow-ups
- Journey events
- Document progress

### Command Center

- Next best action
- Top opportunities
- Opportunity priority
- Business journey
- Support stack
- Application overview
- Document overview
- Follow-up overview
- Trust overview
- Empty/partial-profile/no-match states

### Experience

- English/Hindi
- Responsive UI
- Dark/light theme support
- Premium motion system
- Reduced-motion support
- Accessibility-focused interactions

---

# Roadmap

The product direction is to evolve Yojana Setu from a scheme discovery tool into a broader **entrepreneur support operating layer**.

Planned areas include:

```text
Phase 6
Intelligent Entrepreneur Command Center
        ↓
Phase 7
AI Business Copilot
        ↓
Phase 8
Notifications & Follow-up Intelligence
        ↓
Phase 9
Government / External Data Integrations
        ↓
Phase 10
Regional & Bharat-scale expansion
```

The roadmap is intentionally product-led. SIH requirements remain a secondary constraint rather than the primary product objective.

---

# Contributing

Contributions should preserve the core product principles.

Before submitting changes:

1. Understand the existing architecture.
2. Reuse existing engines and types.
3. Avoid duplicate business logic.
4. Do not change authoritative matching weights without an explicit product decision.
5. Preserve bilingual support.
6. Preserve accessibility.
7. Preserve reduced-motion behavior.
8. Add tests for deterministic business logic.
9. Do not add unverified government claims.
10. Never commit API keys or other secrets.

For significant architectural changes, document:

- Why the change is required
- Which existing system it extends
- What data it consumes
- What tests were added
- Whether matching behavior changed

---

# License

The source archive includes an Apache-2.0 SPDX license marker in the Command Center feature code.

Before publishing the repository publicly, **add a root-level `LICENSE` file containing the project's intended license terms** and ensure that the license choice reflects the ownership and distribution policy for the complete Yojana Setu project.

---

# Project Philosophy

Yojana Setu is built around five principles:

```text
                 TRUST
                   ▲
                   │
       EXPLAINABILITY ── ACTIONABILITY
                   │
                   ▼
             ENTREPRENEUR
                   │
          ┌────────┴────────┐
          ▼                 ▼
     DISCOVERY          PREPARATION
```

### Discover better.

### Understand clearly.

### Prepare confidently.

### Apply through the official channel.

### Keep control of your journey.

---

## Yojana Setu

**From scheme discovery to entrepreneurial action.**
