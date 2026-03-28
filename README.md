# BillSaver - Medical Documentation Intelligence Platform

> AI-powered medical documentation analysis with HIPAA-aligned encryption, optional metadata-only sync, and client-first PHI handling. Backend persistence is disabled by default until a database is configured; client-only mode remains fully functional.

![BillSaver](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Version](https://img.shields.io/badge/version-1.8.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)
![Security](https://img.shields.io/badge/Security-HIPAA%20Aligned-green?style=flat-square&logo=security)

---

## 🚀 Quick Start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Default mode keeps all PHI in the browser. Enable “Secure Metadata Sync (no PHI)” in the dashboard to send non-PHI metadata only. Backend persistence/feedback APIs require DB config and are currently disabled.

---

## ✨ Features

### 🎯 Core Capabilities
- E/M Level Assessment, HCC Gap Detection, Revenue Impact Analysis
- Billing Code Intelligence (CPT/ICD extraction and validation)
- Revenue Validation & Transparency
- Progress tracking, batch processing, investor/demo modes

### 🔍 Smart Detection
- Chief Complaint, HPI elements, ROS, Physical Exam, MEAT, Time, Diagnosis specificity
- Hybrid validation (rules + deterministic NLP + light tfjs model)

### 🎨 User Experience
- Glassmorphic UI, drag-and-drop upload, real-time progress, responsive

---

## 🛡️ Security Highlights
- Credentials: PBKDF2 (sha512, 500,000 iterations) + PEPPER; legacy bcrypt only for existing hashes.
- PHI at rest (backend, if enabled): AES-256-GCM envelope encryption for uploads/results; salts/IVs stored; isEncrypted always true.
- Sessions: JWT access/refresh with hashed refresh tokens.
- RBAC: Healthcare role validation + permission checks on document/analysis/feedback routes.
- Audit: Encrypted, tamper-evident audit log (audit.log.enc).
- PHI minimization: Default client-only; server stores only encrypted blobs; metadata-only sync rejects PHI.
- Backend note: Persistence/feedback APIs are dormant until Postgres env is configured; client-only mode is live.

Env vars (backend, when enabled): PBKDF2_PEPPER, FILE_KEY_SECRET, AUDIT_LOG_KEY, JWT_SECRET, JWT_REFRESH_SECRET, UPLOAD_DIR, MAX_FILE_SIZE, PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE.

---

## 🏗️ Architecture
- Frontend: Next.js (App Router), React, Tailwind, framer-motion.
- Client pipeline: Upload → parsePDF/OCR → billing-code-analyzer → workflow-engine/validators → billing-rules → revenue calculator → Results. PHI stays local.
- Backend (disabled until DB): Express + TypeORM + PostgreSQL; encrypted doc/result storage; metadata-only sync; feedback endpoints; encrypted audit.
- Infra (planned): AWS ECS/ALB/Postgres/WAF/CloudFront via Terraform.

---

## 🤖 Adaptive Learning
- Feedback buttons send non-PHI corrections to /api/feedback (when backend enabled).
- Lightweight tfjs model supports incremental training; local storage of weights.
- `npm run ml:retrain-local` replays non-PHI feedback features locally.

---

## 📦 Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Migrations (when DB enabled): `(cd backend && npm run migrate:run)`
- ML retrain (non-PHI): `npm run ml:retrain-local`

---

## 🧪 Testing
Use vitest/jest suites; backend tests require DB config.

---

## 📄 Status
v1.8.0 — Security & Claims Alignment (PBKDF2+pepper, encrypted uploads/results code, RBAC enforced, encrypted audit log, metadata-only sync, feedback loop). Backend persistence/feedback inactive until DB is configured.
