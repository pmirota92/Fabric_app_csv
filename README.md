# Airline Financial Impact — Fabric App (built with Rayfin)

An executive-level analytical web application that transforms raw airline financial data into an interactive, storytelling dashboard. Built as a native **Microsoft Fabric App** using the **Rayfin** framework, it delivers real-time KPI metrics, focused financial charts, and synchronized data slicing.

📊 **[👉 Click here to launch the live application 👈](https://fast-inlet-fc4bc428a2-westeurope.webapp.fabricapps.net/)** 

---

## 👔 Executive Summary & Business Value
*Target Audience: Business Owners, Financial Analysts, Project Managers*

This application bridges the gap between static reporting and custom software. It is designed to follow an analytical narrative arc that answers four critical business questions: **What happened? Who was affected? Why did it happen? What does it mean for the business?**

### Key Benefits
* **Complete UI Freedom:** Unlike standard BI dashboards, this app offers bespoke layouts, pixel-perfect branding, and custom interactivity unrestricted by standard charting blocks.
* **Enterprise Security by Default:** Operating natively within your organization's Microsoft Fabric tenant, the app inherits enterprise-grade governance, scaling, and compliance from day one.
* **Rapid Delivery:** Scaffolded and iterated using a modern, AI-assisted development workflow, reducing time-to-value from weeks to hours.

---

## ⚙️ Technical Architecture Overview
*Target Audience: Developers, Solutions Architects, Data Engineers*

The project is built on a modern, lightweight tech stack optimized for fast browser performance and seamless deployment within the Microsoft ecosystem.

* **Frontend Framework:** React + Vite + TypeScript.
* **Data Ingestion:** Client-side CSV parsing using `papaparse` directly from the `public/data` directory.
* **Visualizations:** Responsive and animated financial charts powered by `recharts`.
* **State Management:** Centralized, highly performant client-side filtering via React's `useMemo`.
* **Backend Services:** Fully managed static hosting provided by Microsoft Fabric. Backend database, storage, and authentication services are currently toggled off (`false` in `rayfin/rayfin.yml`) as this is a read-only architecture.
* **Identity & Access Management:** Exclusively secured via **Microsoft Entra ID Single Sign-On (SSO)** post-deployment.

---

## 🔄 Power BI Report vs. Fabric App (Rayfin)
Choosing the right tool depends on your data strategy and the required user experience:

| Feature / Aspect | Power BI Report | Fabric App (Rayfin) |
| :--- | :--- | :--- |
| **Primary Purpose** | Business Intelligence & standardized analytics | Custom data-driven web applications |
| **Development Approach** | No-code / low-code (Power BI Desktop) | Code-first (React/TypeScript + Rayfin CLI) |
| **UI Flexibility** | Drag-and-drop visuals, rigid layouts | Total design freedom; any web charting library |
| **Data Logic** | DAX, Semantic Models, Relationships | Custom application logic & web APIs |
| **Backend Capabilities** | Reporting layer only | Full backend (APIs, Database, Auth, OneLake integration) |
| **Best For** | Standardized corporate reporting & dashboards | Bespoke tools, operational apps, agentic/AI apps |
| **Target Skill Profile** | Data & Business Analysts | Full-stack Developers & AI Coding Agents |

---

## 🔒 Security & Data Protection in Enterprise Environments

* **Tenant Isolation:** The application runs strictly within your organization's Microsoft Fabric tenant and dedicated capacity. It is completely isolated from third-party SaaS environments.
* **Access Control:** Enforces native Microsoft Entra ID SSO, fully supporting corporate policies like Conditional Access, Role-Based Access Control (RBAC), and Microsoft Purview sensitivity labels.
* **⚠️ Critical Data Security Note:** This current version bundles the raw CSV file into the static frontend assets. This means **the source file is technically downloadable by any user authorized to access the app.**
  * *For Non-Sensitive Data:* This architecture is perfectly acceptable.
  * *For Confidential Financial Data:* Do **not** place sensitive CSVs in the `public/` directory. Instead, enable the Rayfin data service to host the data securely in OneLake, utilizing a secure backend API to serve only aggregated, pre-filtered results to the frontend.
* **Repository Hygiene:** Always keep `rayfin/.env` and production datasets out of source control by verifying they are included in your `.gitignore` file.

---

## 🚀 Environment Setup & Deployment Guide

### Prerequisites
1. **Fabric Admin Enablement:** A Fabric tenant administrator must enable **Fabric apps (preview)** under Tenant Settings in the Fabric Admin Portal.
2. **Permissions:** A Fabric Workspace hosted on a valid Fabric Capacity with **Contributor** permissions or higher.

### 1. Provision the App Item in Fabric Portal
1. Open the **Microsoft Fabric Portal**.
2. Navigate to your target workspace, click **New item**, search for **App**, and select it.
3. Name your application (e.g., `airline-impact`) and click **Create**.
4. Copy the automatically generated CLI command displayed on the screen.

### 2. Local Development Setup
Execute the following commands in your terminal to scaffold and run the project locally:

```bash
# Initialize project using the specific token from the Fabric portal
npm create @microsoft/rayfin@latest -- "airline-impact" --workspace <workspace_name>
cd airline-impact

# Install application dependencies
npm install papaparse recharts
npm install -D @types/papaparse

# Launch the local development server
npm run dev
```

### 3. Data Integration
* Drop your financial source dataset into `public/data/`.
* Configure and map your specific CSV column schemas inside `src/App.tsx`.
* Build and refine your KPIs, charts, and slicers.

### 4. Deploying to Microsoft Fabric
When you are ready to publish the application to production, run the deployment pipeline via the Rayfin CLI:

```bash
npx rayfin login                 # Interactive browser authentication
npx rayfin up switch --list      # Display available workspaces
npx rayfin up switch <workspace> # Set your target workspace
npx rayfin up --dry-run --verbose# Run a pre-flight deployment check
npx rayfin up                    # Execute production deployment
npx rayfin up status             # Fetch the live application production URL
```

> 💡 **Pro-Tip:** For subsequent frontend-only updates (CSS/UI changes), accelerate the deployment process by running:
> `npx rayfin up staticapp deploy`

---

## 📁 Project Structure

```text
airline-impact/
├── rayfin/
│   ├── rayfin.yml      # Service architecture & deployment configuration
│   └── .env            # Local environment variables (Never commit to Git)
├── public/
│   └── data/           # Storage folder for the source financial CSV
├── src/
│   ├── App.tsx         # Core Application: Data parsing, KPIs, and Visuals
│   └── App.css         # Application custom styles
├── .gitignore
└── README.md
```

---

## 🛠️ Quick Command Reference

| Action / Goal | Command |
| :--- | :--- |
| **Scaffold Project** | `npm create @microsoft/rayfin@latest -- airline-impact --workspace <ws>` |
| **Install Dependencies** | `npm install papaparse recharts && npm i -D @types/papaparse` |
| **Start Local Environment** | `npm run dev` |
| **Authenticate CLI** | `npx rayfin login` |
| **Switch Workspace Target** | `npx rayfin up switch <ws>` |
| **Pre-deployment Check** | `npx rayfin up --dry-run --verbose` |
| **Full Project Deploy** | `npx rayfin up` |
| **Fast UI-Only Deploy** | `npx rayfin up staticapp deploy` |
| **Check Live App Status** | `npx rayfin up status` |

---
*Powered by Microsoft Fabric & Rayfin Framework (Preview).*

*Built with Microsoft Fabric + Rayfin (preview). Charts: recharts. CSV parsing:
papaparse.*
