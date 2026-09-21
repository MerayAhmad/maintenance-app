🐄 Akbeitara (أكبيطرة الذكية) - Smart Cattle Herd & Farm Management System
1. Project Description: Concept & Core Objectives
Akbeitara is a comprehensive, full-stack smart dairy and beef cattle herd management platform designed for modern livestock farmers, agricultural supervisors, and veterinary doctors.
Key Objectives:
Full Lifecycle & Pedigree Tracking: Records each animal's profile from birth/purchase to sale/death, storing international RFID codes, ear-tag IDs, breed, lineage, age, weight, and reproductive states.
Production & Reproductive Monitoring: Tracks estrus cycles, artificial insemination dates, gestation milestones, calving, and daily milk yields per cow.
AI Veterinary Clinical Assistant (Gemini): Integrates Google Gemini AI to analyze clinical symptoms in real time, suggest differential veterinary diagnoses, and recommend nutritional rations.
Dedicated Field Visits & Veterinary Campaigns Portal: Connects national/regional agricultural directorates with local farm breeders to schedule vaccination campaigns and veterinary visits, displaying full breeder contact info (phone number, national ID, and physical address).
Multi-Role Access Control (RBAC): Enforces role permissions between Super Admin / Veterinary Officers and Farm Breeders.
Financial & Operational Intelligence: Auto-calculates herd valuations, operating costs, milk revenues, and net farm margins.
2. Tech Stack
Frontend Framework: React 19 & TypeScript
Styling & Design System: Tailwind CSS v4
Animations & Icons: Motion (motion/react) & Lucide React
Backend Server: Node.js with Express 4
Build Tooling & Bundling: Vite 6, tsx, and esbuild
Database & Cloud Storage: Firebase Cloud Firestore (featuring real-time data sync, automated data cleaning to prevent undefined values, and offline localStorage fallback)
Artificial Intelligence: Google Gemini API (@google/genai TypeScript SDK)
3. Setup Guide: Installation & Database Seeding
Prerequisites
Node.js (v18.0.0 or higher)
npm (v9+) or yarn / pnpm
A Google Gemini API Key from Google AI Studio
(Optional) A Firebase Project with Cloud Firestore enabled
Step 1: Clone the Repository
code
Bash
git clone <YOUR_GITHUB_REPO_URL>
cd akbeitara-farm-management
Step 2: Install Dependencies
code
Bash
npm install
Step 3: Configure Environment Variables
Create a .env file in the root directory by copying .env.example:
code
Bash
cp .env.example .env
Fill in your credentials:
code
Env
# Google Gemini API Key for AI Vet Doctor
GEMINI_API_KEY="your_gemini_api_key_here"

# Application URL
APP_URL="http://localhost:3000"
Step 4: Database Setup (Firebase Cloud Firestore)
The application comes pre-equipped with an automated synchronization and seeding module:
Open the application in your browser and click on the Cloud / Database icon in the sidebar.
Enter your Firebase project credentials (apiKey, projectId, appId, etc.).
The platform will automatically structure and populate the Firestore database collections:
farms: Cattle farms mapped to Syrian governorates and districts.
cows: Cattle records, RFID tags, lactation cycles, and health data.
events: Vaccinations, veterinary treatments, inseminations, and milk records.
users: Registered breeders with phones, national IDs, and addresses.
visitAnnouncements: Field visit campaigns and attendee registrations.
notifications: Breeder registration approval requests.
Step 5: Run the Development Server
code
Bash
npm run dev
Open your browser at http://localhost:3000.
Step 6: Build for Production Deployment
code
Bash
npm run build
npm start
4. Live Demo & Preview Links
Vercel Host: farm-mangement-app.vercel.app
