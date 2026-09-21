🏭 Computerized Maintenance Management System (CMMS)
Industrial Maintenance, Asset Lifecycle & Workshop Management Platform
1. Project Description
CMMS (Computerized Maintenance Management System) is an enterprise-grade industrial maintenance operations platform designed for manufacturing plants, production facilities, and industrial factories. It digitizes the entire lifecycle of breakdown and preventive maintenance requests, enforcing a strict chain-of-command workflow between departments:
Strict Multi-Role Lifecycle Workflow:
Requester / Operator: Submits maintenance tickets with fault classification, priority, downtime urgency, and photo attachments.
Maintenance Manager: Triage and technical assignment, dispatching tasks to specialized technicians or escalating to external workshops.
Technician Execution: Work execution logs, diagnostic reports, breakdown categories, labor hours, and spare parts inventory usage.
Manager Post-Repair Inspection & Sign-off: The maintenance manager inspects the completed repair, verifies safety and technical standards, and applies an official sign-off.
Requester Final Acceptance & Closure: Only the original machine operator/requester has the authority to test the machine, evaluate the service quality, and close the request.
External Workshop Delegation Workflow: Full procurement authorization flow with approvals from both the Maintenance Manager and the General Manager, complete with quotation tracking and external invoice reconciliation.
Interactive Factory Digital Twin: Real-time production floor layout visualizer displaying machine status (Working, Under Maintenance, Critical Breakdown, Idle) with instant click-to-view diagnostics.
Spare Parts & Inventory Cost Engine: Real-time parts deduction, minimum reorder thresholds, and automated synchronization with machine lifetime maintenance cost records.
Official Bilingual PDF Printouts: Generates compliant maintenance reports, spare part requisition receipts, and equipment historical inspection logs.
2. Tech Stack & Architecture
Component	Technology	Description
Frontend Framework	React 18 + TypeScript	Strongly typed, reactive user interface built for high-density industrial control panels.
Styling & UI	Tailwind CSS + Lucide Icons	Industrial design system with responsive layouts, accessible contrast, and RTL (Arabic/English) support.
Motion & Animations	Framer Motion (motion/react)	Fluid page transitions, modal drawers, and status badge interactions.
Data Analytics & Charts	Recharts + D3.js	MTTR / MTBF calculations, monthly breakdown trends, technician productivity curves, and Pareto breakdown charts.
PDF Engine	HTML-to-Print / Vector CSS	High-fidelity industrial work order printouts and equipment maintenance passports.
Backend & Runtime	Node.js + Express (Fullstack)	RESTful API endpoints for asset data, technician routing, and workflow state transitions.
Database & Persistence	Relational Schema / State Engine	Normalized schemas for Assets, Work Orders, Parts Inventory, Workflow Audits, and Notifications.
3. Installation & Database Seeding Steps
Follow these steps to clone, configure, install dependencies, and run the project locally:
Step 1: Prerequisites
Make sure you have installed:
Node.js (v18.0.0 or higher recommended)
npm (v9+ or yarn / pnpm)
Git
Step 2: Clone the Repository
code
Bash
git clone https://github.com/your-username/industrial-cmms.git
cd industrial-cmms
Step 3: Install Dependencies
code
Bash
npm install
Step 4: Environment Configuration
Create a .env file in the root directory (or copy from .env.example):
code
Bash
cp .env.example .env
Define any necessary environment variables:
code
Env
PORT=3000
NODE_ENV=development
Step 5: Database Seeding & Mock Data
The system comes pre-configured with a comprehensive industrial seed database in src/data/initialData.ts, containing:
12+ Industrial Assets across multiple production lines (Injection Molding, CNC milling, Blow Molding, Air Compressors, Packaging Lines).
Technicians & Staff Directory with skill specializations (Mechanical, Electrical, PLC/Automation).
Industrial Spare Parts Catalog with stock levels, bin locations, and pricing in USD and Syrian Pounds (SYP).
Historical Work Orders & Tickets showing various lifecycle stages (New, Assigned, In Progress, Awaiting Manager Sign-off, Requester Closure, Closed).
To reset or feed initial data:
code
Bash
# Data loads automatically on launch; custom seed scripts can be triggered via:
npm run build
Step 6: Start the Development Server
code
Bash
npm run dev
The application will be accessible at:
code
Code
http://localhost:3000
4. Live Preview Links & Demonstrations
Target	URL
Production Preview (Shared URL)	https://ais-pre-pvzkxpxfw6md5cusxpdgct-405988954616.europe-west1.run.app
Development URL	https://ais-dev-pvzkxpxfw6md5cusxpdgct-405988954616.europe-west1.run.app
Core UI Modules & Screens Available in the Live Demo:
Executive Dashboard: Real-time KPI summary (MTTR, MTBF, open vs. closed requests, critical fault monitors).
Maintenance Requests Table & Kanban: Full status filters, technician dispatching, and live workflow modals.
Interactive Factory Floor Map: Visual floor plan with interactive machine statuses and live fault pins.
Machine History & Digital Passport: Machine lifecycle expenses, part replacement logs, and maintenance history.
Technicians & Workshop Directory: Active tasks per technician, completed jobs, and workload balance.
Spare Parts & Inventory Manager: Stock alerts, unit costs, and part usage tracking.
Maintenance Report PDF Generator: One-click printable work order with signatures from the Technician, Maintenance Manager, and Requester.
