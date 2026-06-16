# Airline Financial Impact — Fabric App (built with Rayfin)

A lightweight, read-only analytical report that turns a CSV of airline financial
data into a story: headline KPIs, four focused charts, and slicers that filter
every visual at once. It runs as a **Microsoft Fabric App** and is built with the
**Rayfin** framework.

---

## Overview

- **What it is:** a single-page web report (React + Vite + TypeScript) that reads
  a CSV from `public/data` and renders an executive-style view of airline revenue,
  cost, net result, cost structure, and efficiency.
- **How it was built:** the frontend was scaffolded with Rayfin, then assembled
  step by step with an AI coding assistant. The planning steps and the exact
  prompts were written down in a text file and reviewed before each step.
- **Data source:** a CSV file placed in `public/data` (the folder created
  alongside the app). The report parses it in the browser with `papaparse`.
- **Charts:** built with `recharts`. Layout and narrative follow an analyst arc
  (what happened → who was affected → why → what it means).
- **Deployment target:** published to a Microsoft Fabric workspace as an **App**
  item using the Rayfin CLI.

---

## Background: what changed and why Rayfin

- **Rayfin** is an open-source SDK + CLI introduced by Microsoft at **Build 2026**.
  It lets developers (and coding agents) define an application backend in code —
  database, business logic, APIs, identity, access policies — and deploy it
  directly to Microsoft Fabric.
- It targets the gap between fast prototyping ("vibe coding") and
  enterprise-ready production: apps inherit Fabric's security, governance, and
  scale from day one, instead of bolting them on later.
- Apps run as a **managed service** in Fabric (hosting, networking, scaling are
  handled for you). Application data can land directly in **OneLake**, where it is
  immediately usable by the rest of the Fabric data and AI stack.
- Authentication after deployment uses **Microsoft Entra ID single sign-on (SSO)**
  exclusively — no third-party identity providers.

> This project uses only the **static hosting** part of Rayfin (the database and
> auth services are disabled), because the report is read-only and reads a bundled
> CSV. The full Rayfin stack can be enabled later if the app needs a real backend.

---

## Power BI report vs. Fabric App — what's the difference?

| Aspect | Power BI report | Fabric App (Rayfin) |
| --- | --- | --- |
| Primary purpose | Business intelligence / analytics | Custom application (UI + optional backend) |
| How you build it | No-code/low-code in Power BI Desktop or service | Code-first (React/TypeScript + Rayfin CLI) |
| Visuals | Drag-and-drop visuals, DAX, semantic model | Any web charting library; full UI freedom |
| Data model | Semantic model, relationships, measures, RLS | Your own code; optional Rayfin database/OneLake |
| Interactivity | Slicers, drill-through, bookmarks (built in) | Whatever you code (filters, forms, workflows) |
| Backend / logic | Limited (it's a reporting layer) | Full backend: APIs, database, auth, business logic |
| Best for | Dashboards and standardized reporting | Data-driven apps, custom tools, agentic apps |
| Skill profile | Analysts | Developers (and AI agents) |

**Short version:** Power BI is the fastest path to a governed *report*. A Fabric
App is the path to a custom *application* when you need bespoke UI, custom logic,
or a real backend — at the cost of writing code. This project is a deliberate
middle ground: an app-shaped report where the custom UI was worth it.

---

## Architecture

- **Frontend:** React + Vite + TypeScript (`src/`).
- **Data loading:** `fetch()` reads the CSV from `public/data`, parsed by
  `papaparse`.
- **Visualization:** `recharts` (KPIs, time series, bar, stacked area, scatter).
- **State:** global slicer state filters all visuals via `useMemo`.
- **Backend:** none enabled. `services.auth`, `services.data`, and
  `services.storage` are set to `false` in `rayfin/rayfin.yml`; only
  `staticHosting` is enabled.
- **Hosting:** deployed as a Fabric **App** item; Fabric manages hosting and SSO.

---

## Environment setup

### 1. Enable Fabric Apps in the tenant (admin only)

A Fabric tenant administrator must turn on the workload before anyone can create
App items:

1. Sign in to the **Fabric admin portal**.
2. Go to **Tenant settings**.
3. Under **Fabric apps (preview)**, toggle to **Enabled**.
4. Choose the scope: entire organization or specific security groups.
5. Select **Apply**. Changes can take a few minutes to propagate.

You also need a **Fabric workspace** with **Contributor**, **Member**, or
**Admin** permissions, on a **Fabric capacity**.

### 2. Create the Fabric App item in the portal

1. Open **Microsoft Fabric** and sign in.
2. Select an existing **workspace** (or create one: *Workspaces → New workspace →*
   name + Fabric capacity).
3. In the workspace, select **New item**.
4. Search for **App** and select it.
5. Enter a name (for example, `airline-impact`) and select **Create**.
6. The portal shows a **CLI command** to download the app locally — copy it.

### 3. Develop locally with the Rayfin CLI

```bash
# Scaffold locally using the command shown in the Fabric portal
npm create @microsoft/rayfin@latest -- "airline-impact" --workspace <workspacename>
cd airline-impact

# Install report dependencies
npm install papaparse recharts
npm install -D @types/papaparse

# Run locally
npm run dev
```

### 4. Add data and build the report

- Place the CSV in `public/data/` (the folder created with the app).
- Map the CSV columns in the data-loading code in `src/App.tsx`.
- Build KPIs, charts, and slicers (in this project, done step by step with an AI
  assistant; the prompts were saved in a text file and reviewed before running).

### 5. Deploy to Fabric

```bash
npx rayfin login                 # sign in (interactive, in the browser)
npx rayfin up switch --list      # see available workspaces
npx rayfin up switch <workspace> # select the target workspace
npx rayfin up --dry-run --verbose# preview what will be deployed
npx rayfin up                    # deploy
npx rayfin up status             # get the app URL + portal link
```

For frontend-only changes afterward: `npx rayfin up staticapp deploy`.

---

## Project structure

```
airline-impact/
├── rayfin/
│   ├── rayfin.yml      # services + deployment config (backend disabled here)
│   └── .env            # local env values (do not commit)
├── public/
│   └── data/           # the CSV data source
├── src/
│   ├── App.tsx         # data loading, KPIs, charts, slicers
│   └── App.css         # styling
├── .gitignore
└── README.md
```

---

## Pros and cons

### Pros

- **Speed to value:** prototype to deployed app in hours, especially with AI
  assistance.
- **Enterprise foundation by default:** Fabric provides hosting, scaling, Entra ID
  SSO, and governance without extra setup.
- **Full UI control:** any layout, any chart, any interaction — not limited to a
  fixed set of report visuals.
- **Code-first and version-controlled:** the whole app lives in Git; changes are
  reviewable and repeatable.
- **AI/agent-friendly:** the workflow is designed for coding agents to scaffold
  and iterate.
- **Path to a real backend:** the same project can later enable a database, APIs,
  and auth, with data landing in OneLake.

### Cons

- **Preview product:** Rayfin and Fabric Apps are in preview; expect changes and
  possible breaking updates before general availability.
- **Requires admin enablement and capacity:** a tenant admin must turn it on, and
  it consumes Fabric capacity (cost).
- **More effort than Power BI for pure analytics:** no drag-and-drop, no semantic
  model, no built-in DAX or row-level security — you build these yourself.
- **Smaller ecosystem:** fewer ready-made connectors, templates, and community
  resources than the mature Power BI ecosystem.
- **Auth is Entra-only after deploy:** no external identity providers.
- **Developer skills needed:** it is a code project, not a no-code report.

---

## How fast can this be delivered?

- **A simple read-only report like this:** typically a few hours end to end when
  the data is reasonably clean and the scope is tight, especially with an AI
  assistant generating the loader, charts, and slicers.
- **Main time drivers:** data cleanliness and column consistency, number of
  visuals, and styling polish — not the framework setup.
- **One-time costs:** the tenant admin enablement and first sign-in/workspace
  setup. After that, redeploys take minutes.

---

## Data protection in large organizations

- **Stays in your tenant:** a Fabric App runs inside your own Fabric tenant and
  capacity; it is not a third-party SaaS. Backend data can live in OneLake under
  your governance.
- **Identity and access:** access uses Microsoft Entra ID SSO, so you can apply
  conditional access, RBAC, and workspace-level permissions. Data can be governed
  with sensitivity labels and Microsoft Purview.
- **Important caveat for this project:** this report **bundles the CSV into the
  static frontend**. That means the raw file is downloadable by anyone who can
  open the app. This is fine for non-sensitive or already-public data, but **not
  appropriate for confidential financial data**.
  - For sensitive data, do **not** ship the CSV in `public/`. Instead, enable the
    Rayfin **data service** (a backend database/API) and serve only the
    aggregated results the report needs, with access enforced server-side.
- **Source control hygiene:** keep `rayfin/.env` and any real data files out of
  Git (see `.gitignore`); use a **private** repository for organizational work.
- **Preview compliance:** because the workload is in preview, validate it against
  your organization's compliance requirements before using it with regulated or
  confidential data.

---

## Quick command reference

| Goal | Command |
| --- | --- |
| Scaffold | `npm create @microsoft/rayfin@latest -- airline-impact --workspace <ws>` |
| Install libs | `npm install papaparse recharts && npm i -D @types/papaparse` |
| Run locally | `npm run dev` |
| Sign in | `npx rayfin login` |
| Select workspace | `npx rayfin up switch <ws>` |
| Preview deploy | `npx rayfin up --dry-run --verbose` |
| Deploy | `npx rayfin up` |
| Frontend-only redeploy | `npx rayfin up staticapp deploy` |
| Status / URL | `npx rayfin up status` |

---

*Built with Microsoft Fabric + Rayfin (preview). Charts: recharts. CSV parsing:
papaparse.*
