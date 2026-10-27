# CipherScribe - Secure Note Taking Frontend

Modern, zero-knowledge aesthetic web client for the Secure Note-Taking Application technical assessment.

## Stack
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Obsidian Vault dark cybersecurity design system)
- **Icons:** Lucide React
- **API Client:** Fetch-based REST client with automated JWT envelope unwrapping

## Features
- **Zero-Knowledge Authentication:** JWT-based user login and registration with custom interests tags.
- **Role-Based Views:**
  - **Standard User:** CRUD operations on personal notes, pagination, tag filtering, client-side encryption simulation.
  - **Administrator:** Full platform audit, user provisioning, and MongoDB Aggregation insights.
- **MongoDB Aggregation Visualizers:**
  - **Scenario 1:** Group users by interests (`$unwind`, `$group`, `$sort`).
  - **Scenario 2:** User posts aggregation via single `$lookup` join.
- **Responsive Layout:** Desktop and mobile optimized with slide-over note editor drawers and modals.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file (or use default Vite proxy to `http://localhost:3000/api/v1`):
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory ready for deployment to **Vercel** or **Netlify**.
