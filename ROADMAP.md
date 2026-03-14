# CareNest — Phase 6: Roadmap

Post-MVP improvements, prioritized by user value.

---

## Tier 1 — High Value, Low Risk

### PDF Export for Tracker
- Use `weasyprint` or `@react-pdf/renderer` to export the daily medication tracker as a PDF
- Add "Download PDF" button alongside the existing Print button
- Backend endpoint to generate PDF server-side for reliable rendering

### Medication Reminders (not just appointments)
- Add `MedicationReminder` model with daily schedule
- Celery task to send morning/evening medication summaries by email
- Optional: SMS via Twilio or Vonage

### Senior Accessibility Mode
- `accessibility_preferences.large_text = true` applies CSS class `text-xl` globally in tracker
- High contrast mode via CSS custom property overrides
- Toggle in senior settings panel

### Password Reset Flow
- "Forgot password" link on login → email with reset token
- `/reset-password/{token}` page
- Backend: `PasswordResetRequest` model with expiry

---

## Tier 2 — Medium Value

### Caregiver Notes & Activity Log
- Per-senior daily notes by caregivers ("Jan accepted his morning medication")
- Timestamped, caregiver-attributed log entries
- Visible in senior detail page

### Multiple Families / Family Switching
- Allow a user to be admin of one family and member of another
- Family switcher in the sidebar

### Appointment History & Documents
- Attach files (PDFs, images) to appointments
- View appointment history with notes
- S3/object storage integration

### Medication Refill Tracking
- Track medication stock levels
- Alert when stock falls below threshold (e.g., 7 days remaining)

### Notifications (in-app)
- Real-time notifications via WebSocket (Django Channels)
- "New appointment added", "Medication changed" alerts
- Notification bell in header

---

## Tier 3 — Future

### Senior-Facing Simplified UI
- Separate `/senior` interface with very large text
- Daily plan view (today's medications, upcoming appointment)
- Read-only, no editing capabilities
- Tablet/touch optimized

### Mobile App (React Native / Expo)
- Shared TypeScript types with web frontend
- Push notifications for reminders
- Photo upload for medication labels

### Multi-Language Expansion
- German, Ukrainian, Russian support
- RTL language support (Arabic)
- Backend email templates translated per `preferred_language`

### Medication Interaction Warnings
- Integration with OpenFDA API or similar drug database
- Warn caregiver when adding a medication that interacts with existing ones

### GDPR Tooling
- User data export endpoint (`/api/v1/my-data/`)
- Account deletion with cascaded anonymization
- Consent management UI
- Data retention policies (auto-archive after N years)

### Doctor / Healthcare Provider Portal
- Separate role: `doctor` — read-only access to a senior's medication list
- Share medication list via secure link (no login required, tokenized)

### Billing / SaaS
- Stripe integration for subscription plans
- Free tier: 1 senior, 2 caregivers
- Pro tier: unlimited seniors + caregivers + PDF export + reminders

---

## Technical Debt / Infrastructure

| Item | Priority |
|------|----------|
| Switch to `argon2` password hasher in production | High |
| Add rate limiting to auth endpoints (django-ratelimit) | High |
| API versioning strategy for v2 | Medium |
| Comprehensive test suite (pytest-django + React Testing Library) | Medium |
| CI/CD pipeline (GitHub Actions → Docker Hub → VPS) | Medium |
| Sentry error tracking | Medium |
| Structured logging (structlog) | Low |
| Database read replica for reporting queries | Low |
| Full-text search on medications/appointments (PostgreSQL FTS) | Low |
