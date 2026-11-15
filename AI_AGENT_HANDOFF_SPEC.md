# IOM ITQAAN ACADEMY — AI AGENT HANDOFF SPECIFICATION (AX / DX / UI-UX / LOGIC)

> **Document Version:** 2.0.0  
> **Target Audience:** Autonomous AI Agents (Cursor, Claude Code, Windsurf, Antigravity, etc.) & Senior Fullstack Engineers  
> **Project Scope:** Enterprise Islamic EdTech Platform for Hifz, Najera, Tajweed & General Islamic Studies Management.

---

## 1. System Architecture & Tech Stack

### 1.1 Architecture Blueprint
```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER (Vite SPA)                       │
│  React 18 + TypeScript + Tailwind CSS + Lucide Icons + TanStack Query  │
│                                                                        │
│  Port: 5174 (Dev) / Production Build: dist/                            │
│  Global State & Offline-First Persistence: LocalStorage + Server Sync  │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ REST API Calls                 │ Hybrid Store Sync
                    │ (/api/...)                     │ (/api/super-admin/stores/:key)
┌───────────────────▼────────────────────────────────▼───────────────────┐
│                      BACKEND SERVER (Python Daemon)                    │
│  Python 3.14 + FastAPI / Custom Server Tools on Port: 3020             │
│  Routes: Auth, Classes, Students, Payments, Super Admin Stores         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ SQL Connection
┌───────────────────────────────────▼────────────────────────────────────┐
│                       DATABASE: MySQL 8 (iom_db)                       │
│  Tables: users, students, guardians, enrollments, class_sessions,      │
│          invoices, super_admin_stores (JSON Payload Key-Value Store)   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Directories & Entry Points
- **Frontend Root:** `c:\zReaverse Ai Website\iom-academy-new-ui`
  - `src/main.tsx`: SPA bootstrap and React DOM mount.
  - `src/App.tsx`: Role detection, Sidebar navigation, Route switching.
  - `src/features/learning/HifzDailySheet.tsx`: Hifz & Najera daily homework sheets, diamond calculations, table/card views.
  - `src/features/tickets/TicketsPage.tsx`: Teacher & Zimmadar support ticket inbox, live chat console, image lightbox.
  - `src/features/guardian/GuardianPortalPage.tsx`: Guardian dashboard, child switch, payments, support ticket creator (with recipient selector & attachment), live chat.
  - `src/lib/superAdminStore.ts`: Global unified reactive store with automatic dual-layer persistence (LocalStorage + Server MySQL).
  - `src/lib/hifzStore.ts`: Hifz students list, batches, sample logbook records, preset ranges.
  - `src/lib/api.ts`: Axios/Fetch API client, endpoints, and authentication tokens.
- **Backend Root:** `c:\zReaverse Ai Website\iom-itqaan-academy-v2 (our website)`
  - `tools/local-preview.py`: Daemon starter and reverse proxy.
  - `server/super-admin-stores.ts`: Server-side endpoint handling `ALLOWED_STORE_KEYS`.

---

## 2. Agent Experience (AX) Directives & Operational Rules

1. **NO Hard Destructive Overwrites:**
   Always inspect existing state structures in `superAdminStore.ts` before modifying data interfaces.
2. **Dual-Layer Persistence Rule:**
   When adding a new global feature, use `useLocalStore<T>(KEY, defaultValue)`. Ensure `KEY` is registered in:
   - Frontend: `ALL_SUPER_ADMIN_KEYS` in `src/lib/superAdminStore.ts`
   - Backend: `ALLOWED_STORE_KEYS` in backend server.
3. **Bangla Typography & Encoding:**
   All Bengali copy must be encoded in UTF-8 without BOM. Use Unicode numbers through `toBn(number)` helper function.
4. **Vite Build Verification:**
   Before completing any task, execute:
   `npm --prefix "c:\zReaverse Ai Website\iom-academy-new-ui" run build`
   Ensure 0 TypeScript errors (`tsc -b && vite build` must exit code 0).
5. **No Nested Double-Boxes in Chat UIs:**
   Chat streams must be single-container flex columns (`flex-1 overflow-y-auto p-4 space-y-3.5`). Do not nest bordered boxes inside other bordered cards.

---

## 3. Developer Experience (DX) & Environment Setup

### 3.1 Running Local Processes
- **Frontend Dev Server:**
  ```powershell
  cd "c:\zReaverse Ai Website\iom-academy-new-ui"
  npm run dev
  # Runs on: http://localhost:5174
  ```
- **Backend Server Daemon:**
  ```powershell
  cd "c:\zReaverse Ai Website\iom-itqaan-academy-v2 (our website)"
  python tools\local-preview.py start --no-browser
  # Runs on: http://localhost:3020
  ```
- **Build Command:**
  ```powershell
  npm --prefix "c:\zReaverse Ai Website\iom-academy-new-ui" run build
  ```

### 3.2 Login Credentials for Testing
- **Super Admin / Central Admin:** `admin@gmail.com` / `admin1234567`
- **Department Zimmadar:** `zimmadar@gmail.com` / `admin1234567`
- **Class Teacher / Ustad:** `teacher@gmail.com` / `admin1234567`
- **Guardian (Parent):** Directly accessible at route `#/guardian`.

---

## 4. UI / UX Design Tokens & Standards

### 4.1 Primary Brand Palette
- **Deep Forest Green (Primary Brand):** `#0f3e32` (Hover: `#0b2f26`, Active: `#07211a`)
- **Emerald Accent:** `emerald-600` (`#059669`), `emerald-700` (`#047857`), `emerald-50` (`#ecfdf5`)
- **Sky Blue (Ajker Sobok Theme):** `sky-600` (`#0284c7`), `sky-100` (`#e0f2fe`), `sky-950` (`#082f49`)
- **Indigo (Puratan Sobok / Sat Sobok Theme):** `indigo-600` (`#4f46e5`), `indigo-100` (`#e0e7ff`), `indigo-950` (`#1e1b4b`)
- **Amber/Gold (Tajweed & Tarteel / Amukhta Theme):** `amber-600` (`#d97706`), `amber-100` (`#fef3c7`), `amber-950` (`#451a03`)
- **Rose / Red Flag (Mistakes & Warnings):** `rose-600` (`#e11d48`), `rose-50` (`#fff1f2`), `rose-200` (`#fecdd3`)

### 4.2 Component Design Patterns
- **Rounded Radii:** `rounded-2xl` for main cards and modals; `rounded-xl` for buttons, inputs, and chips.
- **Shadows:** Subtle modern depth using `shadow-xs` or `shadow-3xs`.
- **Badges:** Standard `Badge` component with variants (`approved`, `pending`, `neutral`, `absent`).
- **Image Lightbox:** High-resolution modal with `bg-black/85 backdrop-blur-xs`, zoom view, and direct download button.

---

## 5. Domain Logic & Business Rules

### 5.1 Hifz Daily Logbook Rules
1. **১. আজকের সবক (New Lesson):**
   - Max allowed mistakes: 3.
   - Stepper: `+` / `-`.
   - Mistake >= 4 triggers Red Flag: `৩+ ভুল (রেড ফ্ল্যাগ)` in pulsating rose.
2. **২. সাত সবক (Recent Revision - 7 Pages):**
   - Auto-calculated page range based on today's lesson.
   - Editable custom range override.
   - Mistake >= 4 triggers Red Flag.
3. **৩. আমুখ্তা (Old Revision / Amukhta):**
   - Quarter-para or full-para revision range.
   - Mistake >= 3 triggers Red Flag (`২+ ভুল`).
4. **৪. তেলাওয়াত ও নামাজ (Recitation & Prayer):**
   - Tracks general recitation and prayer recitation (optional/sunnah).
5. **৫. মান / গ্রেড মূল্যায়ন ও ডায়মন্ড পয়েন্ট (Grading & Diamond Points):**
   - **মুমতাজ (Mumtaz):** Base 50 💎
   - **জায়্যিদ জিদ্দান (Jayyid Jiddan):** Base 35 💎
   - **জায়্যিদ (Jayyid):** Base 25 💎
   - **মাকবুল (Maqbool):** Base 20 💎
   - **ডিডাকশন (Deduction):** প্রতি ১টি ভুলের জন্য `-২ 💎` কাটা হয়।
   - Formula: `Net Diamonds = Max(0, Base Grade Points - (Total Mistakes * 2) + Tajweed Points)`

### 5.2 Najera & Tajweed Daily Logbook Rules
1. **১. আজকের সবক:** Same as Hifz.
2. **২. পুরাতন সবক (Old Revision):** Simple page-based revision tracking with mistake counter.
3. **৩. তাজবীদ ও তারতীল (Tajweed & Tarteel):**
   - Dropdown for recitation quality:
     - সুন্দর ও বিশুদ্ধ পাঠ (+৫ 💎)
     - ভালো পাঠ (+২ 💎)
     - সাধারণ পাঠ (০ 💎)
     - দুর্বল পাঠ (-১ 💎)
     - মন্দ / অশুদ্ধ পাঠ (-৫ 💎)
   - **Instant Point Adjustment Grid:**
     - 7 interactive buttons: `[-৫] [-২] [-১] [ 0 ] [+১] [+২] [+৫]`
     - Implemented with `grid grid-cols-7 gap-1 w-full` to mathematically prevent overflow.
     - Single-point steppers `[-]` and `[+]` plus `[রিসেট]` for quick teacher marking.

### 5.3 Support Ticket & Live Chat System
1. **Token Generation:** Unique 4-digit token format `TKT-XXXX`.
2. **Recipient Routing (`TICKET_RECIPIENT_OPTIONS`):**
   - **কোর্স জিম্মাদার (Course Zimmadar):**
     - Maulana Abu Bakr Siddique (Hifzul Quran)
     - Mufti Abrarul Haq (Najera & Qaida)
     - Maulana Qari Enamul Hasan (Tajweed)
   - **ক্লাস শিক্ষক / উস্তাদ (Class Teachers):**
     - Mufti Abdur Rahman (Senior Hifz Teacher)
     - Maulana Khalid bin Walid (Hifz Teacher)
     - Hafez Qari Shihab Uddin (Najera Teacher)
     - Ustaza Ayesha Khatun (Female Branch Teacher)
   - **কেন্দ্রীয় প্রশাসন (Central Admin):**
     - Super Admin / Academy Control (Fee & Tech Support)
3. **File & Screenshot Attachments:**
   - Client-side compression via `compressImageToDataUrl` (max dimension 560px, JPEG quality 0.78).
   - Generates compact Data URLs (< 80KB) stored safely in MySQL `super_admin_stores` payload.
   - Non-image files (PDF, DOC) stored as Base64 with MIME types and downloadable on click.

---

## 6. Implementation Status Matrix

| Module / Feature | Status | Notes |
| :--- | :--- | :--- |
| **Authentication & Multi-Role RBAC** | ✅ 100% Implemented | Roles: Super Admin, Branch Admin, Zimmadar, Teacher, Guardian. |
| **Hifz Daily Homework Sheet (Table View)** | ✅ 100% Implemented | Double-header register, inline dropdowns, red flag alerts. |
| **Hifz Daily Homework Sheet (Card View)** | ✅ 100% Implemented | 4-column desktop grid, collapsible cards, responsive steppers. |
| **Najera Daily Homework Sheet** | ✅ 100% Implemented | Ajker Sobok, Puratan Sobok, Tajweed & Tarteel with instant points. |
| **Register Khata A4 Print & PDF Export** | ✅ 100% Implemented | 01-15, 16-31, full month range, 4-officer signature boxes in `HifzDailySheet.tsx`. |
| **Live Notifications & Unread Badges** | ✅ 100% Implemented | Teacher navbar bell icon counter + Guardian portal live alert banner. |
| **Teacher & Zimmadar Duty Management** | ✅ 100% Implemented | `#/teachers` roster tab, add staff modal, duty & batch assignment modal. |
| **Live Class Creation & Operations** | ✅ 100% Implemented | `#/classes` top action, create class modal, persistent custom classes. |
| **Diamond Gamification Engine** | ✅ 100% Implemented | Real-time formula calculation, monthly target, student drawer. |
| **Support Ticket & Token System** | ✅ 100% Implemented | TKT token generation, recipient routing, status lifecycle, purged test data. |
| **Live Chat with File Attachments** | ✅ 100% Implemented | Paperclip uploads, thumbnails, full-screen lightbox modal. |
| **Guardian Portal & Child Switch** | ✅ 100% Implemented | Student 360, attendance summary, payment invoices, support chat. |
| **Automated Server Database Sync** | ✅ 100% Implemented | LocalStorage fallback + MySQL `/api/super-admin/stores/:key`. |
| **Backend Production REST Endpoints** | 🟡 85% Completed | Core MySQL tables functional; advanced reporting in progress. |
| **SMS & WhatsApp Direct Gateway** | 🟡 70% Completed | WhatsApp report generator ready; SMS gateway needs live API key. |

---

## 7. Roadmap & Tasks for the Next AI Agent

1. **SMS Gateway Integration:**
   - Integrate local SMS gateway (e.g. Greenweb, Reve, or Twilio) in `lib/messaging.ts` for instant SMS delivery on ticket creation or absent follow-up.
2. **Automated Weekly Report Digest:**
   - Automated PDF email / WhatsApp weekly summary sent directly to parents on Thursdays.

