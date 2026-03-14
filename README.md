# CareNest

Family caregiving platform — manage medications and medical appointments for elderly relatives.

## Quick Start (Development)

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start all services
docker compose up --build

# 3. Create Django superuser (once DB is up)
docker compose exec backend python manage.py createsuperuser
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Django Admin: http://localhost:8000/admin/

## Local Frontend Dev (faster iteration)

```bash
cd frontend
npm install
npm run dev
```

Point `NEXT_PUBLIC_API_URL` to `http://localhost:8000/api/v1` and run backend via Docker.

## Local Backend Dev

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Project Structure

```
carenest/
├── backend/          # Django + DRF
│   ├── apps/
│   │   ├── accounts/     # Users, families, invitations
│   │   ├── seniors/      # Senior management
│   │   ├── medications/  # Medication + schedule
│   │   └── appointments/ # Appointments + reminder tasks
│   └── config/           # Settings, URLs, Celery
├── frontend/         # Next.js 14 App Router
│   ├── messages/         # i18n (pl.json, en.json)
│   └── src/
│       ├── app/[locale]/ # i18n routes
│       ├── components/   # UI components
│       ├── lib/api/      # API client
│       └── types/        # TypeScript types
└── docker-compose.yml
```

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Backend    | Django 5, DRF, PostgreSQL 16  |
| Auth       | simplejwt                     |
| Tasks      | Celery + Redis                |
| Frontend   | Next.js 14, TypeScript        |
| i18n       | next-intl (PL first)          |
| Styling    | Tailwind CSS + shadcn/ui      |
| Containers | Docker Compose                |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full design documentation.
