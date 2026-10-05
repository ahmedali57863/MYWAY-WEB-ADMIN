# MYWAY Admin Dashboard 🚗✨

> Enterprise administrative portal and operations management system for the **MYWAY** ride-sharing and carpooling platform.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features & Modules](#key-features--modules)
  - [1. User Management & Details Modal](#1-user-management--details-modal)
  - [2. Pending Approvals & Verification Workflows](#2-pending-approvals--verification-workflows)
  - [3. Driver Fleet & Vehicle Inspection](#3-driver-fleet--vehicle-inspection)
  - [4. Student Verification & Badge Management](#4-student-verification--badge-management)
  - [5. Support Desk & Live Communications](#5-support-desk--live-communications)
  - [6. Broadcast Messaging](#6-broadcast-messaging)
  - [7. Database Collections Inspector](#7-database-collections-inspector)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Database Schema & Conventions](#database-schema--conventions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## 🌟 Overview

The **MYWAY Admin Dashboard** provides platform administrators, support teams, and compliance officers with real-time operational controls. It manages identity verifications, driver onboarding, student discount credentials, vehicle inspections, customer support tickets, and push broadcast alerts.

---

## 🚀 Key Features & Modules

### 1. User Management & Details Modal (`/users`)
- **Interactive User Listing**: Filter by role (*All Accounts*, *Drivers*, *Passengers*), search by name, phone, email, city, or user ID.
- **`NewUserDetails` Profile Viewer**:
  - **Header & Quick Actions**: View user UUID with one-click copy feedback, direct delete action with confirmation dialog, and close button.
  - **Identity Hero**: High-resolution avatar with online status indicator, role badges (*Driver*, *Passenger*, *Pro/Student*, *Admin*), and live platform tenure calculation (*e.g., "Attached with MYWAY for 12 months 3 weeks 5 days"*).
  - **Activity Statistics**: Live count of published routes, ride demands, and successful matches.
  - **Tabbed Information Breakdown**:
    - **Profile Info**: Full name, verified phone number, email, admin access status, formatted account creation date (*e.g., "29 Sept 2026 at 11:05 PM"*), and tenure duration.
    - **Addresses & Region**: Registered manual address, last-known GPS address, city / operating region, emergency contact info.
    - **Verifications & Trust**: Identity review status, CNIC document state, CNIC verification badge, driver privilege status, and campus / student discount validity.
- **Privilege & Permission Override (`EditUserModal`)**:
  - Update profile name and phone number.
  - Toggle identity review status (`Unverified`, `Pending`, `Verified`, `Rejected`).
  - Toggle verified driver privilege, CNIC manual override, student tier, and admin access with audit warning notifications.

### 2. Pending Approvals & Verification Workflows (`/pending-approvals`)
- **Driver & Vehicle Applications**: Streamlined onboarding queue for drivers applying for platform privileges.
- **`document_urls` JSONB Integration**: Dynamically extracts and signs private documents from the `profiles.document_urls` column (`cnic_url`, `license_url`, `vehicle_url`, `cnic_front_url`, `cnic_back_url`, `registration_url`).
- **Visual Document Cards**:
  - Real thumbnail image preview with hover-zoom indicator.
  - Clear upload status chip: `✓ Image Attached` (green) vs `⚠️ Not Uploaded` (amber).
  - High-resolution full-screen lightbox inspection on click.
- **Action Processing**: Immediate single-click approve/reject actions with automatic server cache revalidation and local optimistic state updates.

### 3. Driver Fleet & Vehicle Inspection (`/drivers`)
- **Driver Database**: Search and filter active, pending, and suspended drivers.
- **Vehicle Document Hub**: Review vehicle make, model, year, license plate, registration certificate, and vehicle photos.
- **Driver Profile Drawer**: Detailed view containing license documentation, CNIC records, vehicle cards, and quick privilege toggles.

### 4. Student Verification & Badge Management (`/student-verifications`)
- **Campus Verification Portal**: Review student card submissions, universities, roll numbers, and validity dates.
- **Phone Number Integration**: Displays the student's registered phone number fetched directly from Supabase profiles (with fallback to `N/A`).
- **Student Badge Actions**:
  - Three-dot contextual action menu on active student records.
  - **Cancel / Suspend Student Badge**: Instantly strips student privileges (`verification_tier = 'standard'`, `is_pro = false`) both on the UI and directly in the PostgreSQL backend.

### 5. Support Desk & Live Communications (`/support`)
- **Multi-Thread Inbox**: Browse open, in-progress, and resolved customer support tickets.
- **Conversation Stream**: Real-time chat dialogue between passenger/driver and support team.

### 6. Broadcast Messaging (`/broadcast`)
- **Push Notification Dispatcher**: Send platform-wide announcements or target specific audience segments (*All Users*, *Active Drivers*, *Verified Students*).
- **Scheduled & Immediate Broadcasts**: Track broadcast history, reach estimates, and delivery status.

### 7. Database Collections Inspector (`/collections/[table]`)
- **Dynamic Supabase Table Viewer**: Inspect tables (`profiles`, `routes`, `ride_demand`, `matches`, `vehicles`, `verifications`, `student_verifications`, etc.) directly from the admin interface.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom Design System |
| **Backend & Database** | [Supabase PostgreSQL](https://supabase.com/) |
| **Authentication** | Supabase Auth with Admin Service Role Client |
| **File Storage** | Supabase Storage (signed private URLs for secure document verification) |
| **Icons** | Custom Vector SVG Design System (`FigmaUI.tsx`) |

---

## 🗄️ Database Schema & Constraints Reference

- **`profiles.verification_status`**: Constrained to `'unverified' | 'pending' | 'verified'`
- **`profiles.verification_tier`**: Constrained to `'none' | 'student' | 'pro'`
- **`profiles.document_urls` (JSONB)**:
  ```json
  {
    "cnic_url": "path/to/cnic.jpg",
    "license_url": "path/to/license.jpg",
    "vehicle_url": "path/to/vehicle.jpg",
    "cnic_front_url": "path/to/front.jpg",
    "cnic_back_url": "path/to/back.jpg",
    "registration_url": "path/to/reg.jpg"
  }
  ```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js `18.x` or higher
- npm / yarn / pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/myway-admin.git
   cd myway-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see below).

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-instance.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📜 Available Scripts

- `npm run dev` — Starts the development server with Turbopack.
- `npm run build` — Creates an optimized production build.
- `npm run start` — Starts the production server.
- `npm run lint` — Runs ESLint checks.

---

<div align="center">
  <sub>Built with ❤️ for the MYWAY platform operations team.</sub>
</div>
