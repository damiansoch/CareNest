# CareNest — Architecture Document (Phase 1)

## Overview

CareNest is a family caregiving platform. Families manage elderly relatives by organizing
medications and medical appointments. The MVP is caregiver-focused and web-first.

---

## MVP Scope

### In Scope
- Family-based multi-tenant auth (register, login, invite caregivers)
- Senior CRUD + archive
- Medication CRUD + time-of-day scheduling + archive
- Appointment CRUD + Celery-powered email reminders
- Printable daily medication tracker (HTML/CSS, A4, senior-friendly)
- EN/PL localization with UI language switcher
- Role-based access: admin caregiver vs member caregiver

### Out of Scope (Post-MVP)
- Senior-facing simplified UI
- Medication reminders (only appointment reminders in MVP)
- PDF export
- Mobile app, billing, external integrations

---

## Core Entities

```
Family
  ├── CaregiverMembership (User ↔ Family, role: admin | member)
  └── Senior
        ├── Medication
        │     └── MedicationSchedule (time_of_day slots)
        └── Appointment
              └── ReminderLog
```

---

## Tech Stack

| Layer           | Technology                        | Rationale                              |
|-----------------|-----------------------------------|----------------------------------------|
| Backend         | Django 5 + DRF                    | Monolith, batteries included           |
| Database        | PostgreSQL 16                     | Relational, robust, JSONB available    |
| Auth            | djangorestframework-simplejwt     | Stateless JWT, works with Next.js      |
| Background jobs | Celery + Redis                    | Async email reminders                  |
| Frontend        | Next.js 14 (App Router)           | SSR + CSR, excellent DX                |
| i18n Frontend   | next-intl                         | Best-in-class for App Router           |
| i18n Backend    | Django i18n                       | Standard, .po files                    |
| Styling         | Tailwind CSS 3                    | Utility-first, design system ready     |
| Components      | shadcn/ui                         | Accessible, Tailwind-based             |
| Print           | CSS @media print + @page          | No PDF lib needed for MVP              |
| Containers      | Docker + Docker Compose           | Dev parity, single-command startup     |

---

## Project Folder Structure

```
carenest/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/          # User, Family, Membership, invitations
│   │   ├── seniors/           # Senior model + views
│   │   ├── medications/       # Medication, MedicationSchedule
│   │   └── appointments/      # Appointment, ReminderLog, Celery tasks
│   ├── locale/
│   │   ├── en/LC_MESSAGES/
│   │   └── pl/LC_MESSAGES/
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx          # Dashboard
│   │   │       ├── auth/
│   │   │       │   ├── login/
│   │   │       │   └── register/
│   │   │       ├── seniors/
│   │   │       │   ├── page.tsx      # Senior list
│   │   │       │   ├── new/
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx
│   │   │       │       ├── medications/
│   │   │       │       └── appointments/
│   │   │       ├── tracker/
│   │   │       │   └── [seniorId]/
│   │   │       │       └── page.tsx  # Printable tracker
│   │   │       └── settings/
│   │   │           └── team/         # Invite caregivers
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── layout/               # AppShell, Sidebar, Header
│   │   │   ├── seniors/
│   │   │   ├── medications/
│   │   │   ├── appointments/
│   │   │   └── tracker/
│   │   ├── lib/
│   │   │   ├── api/                  # Typed fetch client + endpoints
│   │   │   └── utils/
│   │   ├── hooks/
│   │   ├── store/                    # Zustand global state
│   │   └── types/                    # Shared TypeScript interfaces
│   ├── messages/
│   │   ├── en.json
│   │   └── pl.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Backend App Breakdown

### accounts/
- `User` — extends AbstractUser, adds `preferred_language`
- `Family` — top-level tenant
- `CaregiverMembership` — User ↔ Family with role (admin/member)
- `Invitation` — email-based invite with token, expiry

### seniors/
- `Senior` — name, DOB, notes, language, photo, accessibility_prefs (JSONB), archived

### medications/
- `Medication` — name, dosage, form, instructions, notes, start/end date, is_active, senior FK
- `MedicationSchedule` — medication FK, time_of_day (enum), custom_time

### appointments/
- `Appointment` — title, doctor, location, datetime (tz-aware), notes, senior FK, caregiver FK
- `ReminderConfig` — appointment FK, offset_hours (24, 2), is_enabled
- `ReminderLog` — appointment FK, reminder_type, sent_at, status, unique constraint

---

## API Design (REST)

Base URL: `/api/v1/`

| Resource                               | Methods              |
|----------------------------------------|----------------------|
| `/auth/register/`                      | POST                 |
| `/auth/login/`                         | POST                 |
| `/auth/token/refresh/`                 | POST                 |
| `/auth/me/`                            | GET, PATCH           |
| `/family/`                             | GET, PATCH           |
| `/family/members/`                     | GET                  |
| `/family/invitations/`                 | GET, POST            |
| `/family/invitations/{token}/accept/`  | POST                 |
| `/seniors/`                            | GET, POST            |
| `/seniors/{id}/`                       | GET, PATCH, DELETE   |
| `/seniors/{id}/medications/`           | GET, POST            |
| `/seniors/{id}/medications/{id}/`      | GET, PATCH, DELETE   |
| `/seniors/{id}/appointments/`          | GET, POST            |
| `/seniors/{id}/appointments/{id}/`     | GET, PATCH, DELETE   |
| `/seniors/{id}/tracker/`              | GET (tracker data)   |

All endpoints require JWT auth. Family scoping is enforced at queryset level.

---

## Email Reminder Flow

```
1. Appointment created/updated with reminder enabled
         │
         ▼
2. Celery beat task runs every 15 minutes
   → queries appointments in next 24h with pending reminders
         │
         ▼
3. For each appointment:
   - check ReminderLog for (appointment_id, reminder_type)
   - if not sent AND now >= (appointment_datetime - offset):
       → send email
       → create ReminderLog(status='sent', sent_at=now)
         │
         ▼
4. Email: subject, doctor, time, location, senior name
   → sent to all family admin caregivers + assigned caregiver
```

**Duplicate prevention:** `unique_together = ('appointment', 'reminder_type')` in ReminderLog.

---

## Printable Daily Tracker

### Design Principles
- Font size ≥ 16pt body, ≥ 20pt section headings
- Black text on white background only
- Grouped by time of day (morning → midday → afternoon → evening → bedtime → custom)
- Large checkbox per medication
- Senior name + date at top
- Notes section at bottom
- A4 page with 15mm margins

### Implementation
- React component `<MedicationTracker />` with `@media print` styling
- Tailwind `print:` variants for showing/hiding elements
- `@page { size: A4; margin: 15mm; }` in global CSS
- "Print" button triggers `window.print()`
- No PDF library needed for MVP

---

## Authentication & Authorization

- JWT via simplejwt (access: 15min, refresh: 7d)
- Refresh token stored in httpOnly cookie (frontend handles rotation)
- Every API view checks: `request.user.membership.family == resource.family`
- Roles:
  - `admin`: full CRUD, can invite/remove members
  - `member`: full CRUD on seniors/medications/appointments, cannot manage team

---

## Localization Strategy

### Backend
- Django `USE_I18N = True`, locale files in `locale/en/` and `locale/pl/`
- API error messages translated via Django i18n
- Emails sent in the senior's `preferred_language`

### Frontend
- `next-intl` with `[locale]` route prefix (`/en/...`, `/pl/...`)
- All UI strings in `messages/en.json` and `messages/pl.json`
- Language switcher in header persists to `localStorage` + URL

---

## Security Considerations

- CORS restricted to frontend origin
- JWT tokens short-lived
- All querysets filtered by family (no cross-family data leaks)
- Invitation tokens are UUID4, single-use, expire in 72h
- GDPR: no PII logged in application logs
- Passwords hashed with Argon2 (django[argon2])

---

## Non-Functional

- Timezone-aware datetimes (`USE_TZ = True`, stored as UTC, displayed in user's TZ)
- All models use UUID primary keys
- Soft-delete (archived) for seniors and medications
- Celery tasks are idempotent
