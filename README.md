# GEOPulse

**AI Visibility Monitoring for the Generative Search Era**

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![Tauri 2](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-2021-000000?logo=rust&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)

A local-first desktop app for marketers and SEO/GEO practitioners who want to know whether ChatGPT, Perplexity and Google's Gemini mention their brand — and how. You bring your own API keys; prompts, scan results and settings stay in a SQLite database on your machine.

GEOPulse is a desktop application that tracks how your brand appears in AI-generated answers from **ChatGPT**, **Perplexity**, and **Google AIO (Gemini)**. It monitors visibility scores, sentiment, citations, and competitive positioning across geographic regions — giving you actionable insights to improve your brand's presence in the new landscape of generative search.

Built with **Tauri 2** (Rust backend) and **React 19** (TypeScript frontend).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Scoring Model](#scoring-model)
- [Supported Markets](#supported-markets)
- [Development](#development)
- [Building for Production](#building-for-production)
- [License](#license)

---

## Features

### Brand Intelligence
- **Brand Entity Validation** — LLM-powered validation that generates AI descriptions, key attributes, and auto-detects competitors
- **Brand Autofill** — Automatically populate brand profiles from a website URL

### Customer Personas
- **AI-Generated Personas** — Create realistic user personas with demographics, search behavior, and intent profiles
- **Persona-Linked Prompts** — Generate search prompts tailored to each persona's perspective

### Prompt Generation
- **6 Intent Categories** — Informational, Navigational, Commercial, Transactional, Comparison, and Recommendation
- **LLM-Powered Generation** — Automatically generate diverse, realistic prompts based on brand context
- **Distribution Stats** — View prompt coverage across intent categories

### Multi-Engine Scanning
- **ChatGPT** (GPT-4o-mini via OpenAI API)
- **Perplexity** (Sonar model with native citation extraction)
- **Google AIO** (Gemini 2.0 Flash with grounding metadata)
- **Concurrent Execution** — Run prompts across all engines simultaneously with bounded concurrency
- **Progress Tracking** — Real-time scan progress with pause/resume/cancel support

### Geographic Simulation
- **13 Markets** — US, UK, DE, FR, ES, IT, NL, BR, JP, AU, CA, IN, PH
- **Localized Prompts** — Market-specific language and cultural context
- **Proxy Support** — HTTP/SOCKS5 proxies with per-market overrides for geo-accurate results

### Visibility Scoring
- **0-5 Point Scale** — Composite score based on mention position, sentiment, and citations
- **Per-Engine Breakdown** — Compare how each AI engine represents your brand
- **Trend Tracking** — Historical score time-series across scans

### Citation Analysis
- **Source Classification** — Owned, Competitor, Third-Party, and Authority sources
- **Domain Mapping** — Track which domains are cited alongside your brand
- **Citation Coverage** — Identify where your owned sources are missing

### Competitive Intelligence
- **Share of Voice** — Compare mention rates across competitors
- **Gap Analysis** — Find prompts where competitors appear but your brand doesn't
- **Competitor Tracking** — Monitor competitor visibility alongside your own

### Action Items
- **Auto-Generated Recommendations** — Content gaps, citation fixes, entity optimization, competitor responses, sentiment repair
- **Priority Scoring** — Critical/High/Medium/Low based on impact potential
- **Actionable Descriptions** — Human-readable recommendations with context

### Monitoring & Alerts
- **Scheduled Scans** — Background scanning with configurable intervals
- **Visibility Drop Alerts** — Triggered when score drops >= 0.5 or mention rate drops >= 10%
- **Severity Levels** — Warning and critical alert classifications
- **Scan Comparison** — Side-by-side diff between any two scan runs

### Data Export
- **CSV Export** — Export scan results for external analysis

---

## Architecture

```
+-----------------------------+
|        React 19 Frontend    |
|  (Vite + TypeScript + Zustand) |
+-------------+---------------+
              | Tauri IPC (52 commands)
+-------------v---------------+
|        Rust Backend          |
|  (Tauri 2 + Tokio async)    |
+--+--------+--------+--------+
   |        |        |
   v        v        v
OpenAI   Perplexity  Google
  API       API     Gemini API
   |        |        |
   +--------+--------+
            |
   +--------v--------+
   |  Scan Pipeline   |
   |  Parse > Score   |
   |  Cite > Actions  |
   +--------+---------+
            |
   +--------v--------+
   |   SQLite (local) |
   |   11 tables      |
   +------------------+
```

The app uses **Tauri's IPC bridge** to communicate between the React frontend and Rust backend. All AI API calls, data processing, and database operations happen in Rust. The frontend manages UI state with Zustand stores that invoke Tauri commands.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 5.8 | Type safety |
| Vite 6 | Build tool & dev server |
| Zustand 5 | State management (10 stores) |
| Tailwind CSS 4 | Styling (emerald theme) |
| Radix UI | Accessible component primitives |
| Recharts | Data visualization |
| React Router 7 | Client-side routing |
| React Markdown | Markdown rendering |
| Sonner | Toast notifications |
| Zod | Schema validation |

### Backend
| Technology | Purpose |
|---|---|
| Rust (2021 edition) | Backend language |
| Tauri 2 | Desktop framework & IPC |
| rusqlite | SQLite database (bundled) |
| reqwest | HTTP client (JSON + SOCKS proxy) |
| Tokio | Async runtime |
| serde / serde_json | Serialization |
| chrono | Date/time handling |
| uuid | ID generation |

---

## Prerequisites

- **Node.js** >= 18
- **Rust** toolchain (install via [rustup](https://rustup.rs/))
- **npm** (comes with Node.js)
- API keys for at least one engine:
  - [OpenAI API key](https://platform.openai.com/api-keys) (for ChatGPT)
  - [Perplexity API key](https://docs.perplexity.ai/) (for Perplexity)
  - [Google API key](https://ai.google.dev/) (for Google AIO / Gemini)

### Platform-specific dependencies

**Windows:** Microsoft C++ Build Tools (required by the Rust MSVC toolchain) and WebView2 (preinstalled on Windows 10/11).

**Linux:** Install the following system packages:
```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

**macOS:** Install Xcode Command Line Tools:
```bash
xcode-select --install
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/newmachinesph/geopulse.git
cd geopulse

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri:dev
```

The first run will compile the Rust backend, which may take a few minutes. Subsequent runs will be faster due to incremental compilation.

---

## Configuration

### API Keys

Launch the app and go to **Settings** to enter your API keys.

Keys (and proxy credentials) are saved **unencrypted** in the local SQLite database at `<local data dir>/geopulse/data.db` (e.g. `%LOCALAPPDATA%\geopulse\data.db` on Windows). Treat that file as a secret.

> The backend loads a `.env` file on startup (`dotenvy`), but API keys are currently read only from the Settings stored in the database, not from environment variables.

### Proxy Configuration

For geographic simulation with real IP-based localization:

1. Go to **Settings > Proxy**
2. Enable proxy and enter your proxy server details
3. Choose protocol: HTTP or SOCKS5
4. Optionally set per-market proxy overrides (e.g., a UK proxy for the UK market)

### Scan Defaults

Configure in **Settings > Scan Defaults**:
- **Default Engines** — Which AI engines to query (ChatGPT, Perplexity, Google AIO)
- **Default Markets** — Which geographic markets to scan
- **Max Concurrent Scans** — Bounded concurrency (default: 3)
- **Timeout** — Per-request timeout in seconds (default: 30)
- **Auto Schedule** — Enable/disable background scanning
- **Schedule Interval** — Hours between automated scans (default: 24)

---

## Usage

### 1. Create a Project
Click **New Project** and complete the setup wizard:
1. **Configure** — Enter your brand name, website URL, industry, and target market
2. **Validate** — Run AI-powered brand entity validation to confirm your brand's digital identity
3. **Generate Prompts** — Create AI-powered search prompts based on your brand context

### 2. Generate Personas (Optional)
Navigate to the project's **Personas** tab and click **Generate Personas** to create realistic customer profiles that influence prompt generation.

### 3. Run a Scan
Go to the **Scans** tab and click **New Scan**:
- Select engines (ChatGPT, Perplexity, Google AIO)
- Select target markets
- Enable/disable geographic simulation
- Start the scan and monitor real-time progress

### 4. Review Results
After a scan completes:
- **Scan Detail** — View results per engine with visibility scores, sentiment, and citations
- **Dashboard** — See aggregated metrics, trends, and engine comparisons
- **Insights** — Explore gap analysis, competitor comparisons, and source coverage
- **Actions** — Review auto-generated recommendations prioritized by impact

### 5. Monitor Over Time
- Enable **Scheduled Scans** to run periodic monitoring
- Check **Alerts** for visibility drops
- Use **Scan Comparison** to diff results between any two scan runs
- Track **Trends** on the insights page

---

## Project Structure

```
geopulse/
├── src/                        # React frontend
│   ├── App.tsx                 # Root component with routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Tailwind theme configuration
│   ├── components/             # UI components
│   │   ├── actions/            # Action item components
│   │   ├── charts/             # Data visualization
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── insights/           # Analytics components
│   │   ├── layout/             # Sidebar, header, error boundary
│   │   ├── onboarding/         # First-run wizard
│   │   ├── projects/           # Project management
│   │   ├── prompts/            # Prompt management
│   │   ├── results/            # Scan results display
│   │   ├── scans/              # Scan execution UI
│   │   └── ui/                 # Radix UI primitives
│   ├── pages/                  # Route pages
│   │   ├── dashboard.tsx
│   │   ├── settings.tsx
│   │   ├── actions.tsx
│   │   ├── insights.tsx
│   │   ├── alerts.tsx
│   │   ├── projects/           # Project list, detail, setup
│   │   ├── prompts/            # Prompt list, detail
│   │   └── scans/              # Scan list, detail
│   └── lib/                    # Core libraries
│       ├── types.ts            # TypeScript interfaces
│       ├── constants.ts        # Engines, markets, intents, scoring
│       ├── utils.ts            # Helper functions
│       ├── export.ts           # CSV export
│       ├── store/              # Zustand stores
│       └── tauri/              # Tauri command wrappers
│
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── main.rs             # Entry point
│   │   ├── lib.rs              # App initialization
│   │   ├── api/                # AI engine clients
│   │   │   ├── openai.rs       # ChatGPT client
│   │   │   ├── perplexity.rs   # Perplexity client
│   │   │   └── google.rs       # Gemini client
│   │   ├── commands/           # Tauri IPC commands (52 total)
│   │   ├── db/                 # Database layer
│   │   │   ├── schema.rs       # Table definitions (11 tables)
│   │   │   ├── connection.rs   # Shared SQLite connection (mutex-guarded)
│   │   │   ├── migrations.rs   # Schema migrations
│   │   │   └── queries/        # Query modules per entity
│   │   ├── models/             # Rust data models
│   │   └── pipeline/           # Scan execution engine
│   │       ├── mod.rs          # Orchestrator
│   │       ├── parser.rs       # Response parsing
│   │       ├── scorer.rs       # Visibility scoring
│   │       ├── actions.rs      # Action generation
│   │       ├── llm.rs          # LLM helper functions
│   │       └── scheduler.rs    # Background scheduler
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
│
├── index.html
├── package.json
├── components.json             # shadcn/ui config
├── tsconfig.json
├── vite.config.ts
└── postcss.config.mjs          # Tailwind 4 via @tailwindcss/postcss
```

---

## Database Schema

GEOPulse uses a local **SQLite** database with 11 tables:

| Table | Description |
|---|---|
| `projects` | Project definitions (name, site URL, industry, market) |
| `brand_profiles` | Brand entity profiles with aliases, competitors, validation data |
| `personas` | Customer personas with demographics and search behavior |
| `prompts` | Search prompts with intent category, tags, and run statistics |
| `scans` | Scan run metadata (config, status, progress) |
| `raw_responses` | Raw API responses from each engine |
| `parsed_results` | Parsed analysis: mentions, position, sentiment, visibility score |
| `citations` | Extracted citations with source type classification |
| `action_items` | Auto-generated recommendations with priority and status |
| `alerts` | Monitoring alerts for visibility drops |
| `settings` | Global app settings (API keys, proxy, scan defaults) |

### Key Relationships
- Projects -> Brand Profiles (1:1)
- Projects -> Personas (1:N)
- Projects -> Prompts (1:N)
- Projects -> Scans (1:N)
- Scans -> Raw Responses (1:N)
- Raw Responses -> Parsed Results (1:1)
- Parsed Results -> Citations (1:N)

---

## Scoring Model

Visibility is scored on a **0-5 point scale**:

| Factor | Points | Condition |
|---|---|---|
| Top-3 Mention | +3 | Brand appears in the first 3 entities mentioned |
| Any Mention | +1 | Brand is mentioned anywhere in the response |
| Positive Sentiment | +1 | Response sentiment toward the brand is positive |
| Authoritative Citation | +1 | An authoritative source cites or links to the brand |

**Maximum score: 5**

Sentiment is determined via keyword analysis (24 positive indicators, 19 negative indicators). Citations are classified as **Owned**, **Competitor**, **Authority**, or **Third-Party**.

---

## Supported Markets

| Code | Market | Language |
|---|---|---|
| `us` | United States | English |
| `uk` | United Kingdom | English |
| `ca` | Canada | English |
| `au` | Australia | English |
| `in` | India | English |
| `de` | Germany | German |
| `fr` | France | French |
| `es` | Spain | Spanish |
| `it` | Italy | Italian |
| `nl` | Netherlands | Dutch |
| `br` | Brazil | Portuguese |
| `jp` | Japan | Japanese |
| `ph` | Philippines | English |

Each market applies localized system prompts and language context to produce region-accurate AI responses.

---

## Development

### Dev server

```bash
npm run tauri:dev
```

This starts:
- Vite dev server on `http://localhost:1420` (hot module replacement on port 1421)
- Tauri app window pointing to the dev server
- Rust backend with automatic recompilation on changes

### Frontend only

```bash
npm run dev
```

Starts just the Vite dev server (useful for UI work without the Rust backend).

### Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server only |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview the production frontend build |
| `npm run tauri:dev` | Full development mode (frontend + backend) |
| `npm run tauri:build` | Production build with installers |
| `npm run build:installer` | Alias for `tauri build` |
| `npm run tauri -- <args>` | Run any other Tauri CLI command |

### Tests

There is no JavaScript test or lint script. The Rust backend has unit tests in `src-tauri/src/pipeline/parser.rs` and `src-tauri/src/pipeline/scorer.rs`:

```bash
cd src-tauri
cargo test
```

---

## Building for Production

```bash
npm run tauri:build
```

`src-tauri/tauri.conf.json` sets `bundle.targets` to `["msi", "nsis"]`, so the build produces Windows MSI and NSIS installers in `src-tauri/target/release/bundle/`. To package for macOS (`dmg`, `app`) or Linux (`appimage`, `deb`), add those targets and build on that platform.

The build process:
1. Compiles TypeScript and bundles the React frontend via Vite
2. Compiles the Rust backend in release mode
3. Packages everything into a native desktop application
4. Generates the installers

---

## License

[MIT](LICENSE) © 2026 GEOPulse. The MIT license covers the code; the GEOPulse name and app icons identify the project.
