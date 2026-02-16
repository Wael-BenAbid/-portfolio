# Portfolio Backend API

Django REST Framework backend for the Portfolio application.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+

### Installation

1. **Clone and setup virtual environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run migrations and create superuser**
```bash
python manage.py migrate
python create_superuser.py
```

4. **Start development server**
```bash
python manage.py runserver
```

## 📁 Project Structure

```
backend/
├── manage.py              # Django CLI
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container configuration
├── .env                  # Environment variables
├── create_superuser.py   # Admin user creation utility
│
├── portfolio/            # Django project settings
│   ├── settings.py       # Main configuration
│   ├── urls.py           # Root URL routing
│   ├── wsgi.py           # WSGI application
│   └── asgi.py           # ASGI application
│
├── api/                  # Authentication & User Management
│   ├── models.py         # CustomUser model
│   ├── views.py          # Auth views (Login, Register, etc.)
│   ├── serializers.py    # User serializers
│   ├── urls.py           # Auth routes
│   └── admin.py          # User admin
│
├── projects/             # Projects & Skills microservice
│   ├── models.py         # Project, MediaItem, Skill
│   ├── views.py          # CRUD operations
│   ├── serializers.py    # Project serializers
│   └── urls.py           # Project routes
│
├── cv/                   # CV Data microservice
│   ├── models.py         # Experience, Education, etc.
│   ├── views.py          # CV CRUD operations
│   └── urls.py           # CV routes
│
├── content/              # Site Settings & Contact microservice
│   ├── models.py         # SiteSettings, About, ContactMessage
│   ├── views.py          # Settings, Contact, Upload
│   └── urls.py           # Content routes
│
└── interactions/         # Likes & Notifications microservice
    ├── models.py         # Like, Notification
    ├── views.py          # Interaction views
    └── urls.py           # Interaction routes
```

## 🔌 API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Register new user |
| POST | `/login/` | Login user |
| POST | `/logout/` | Logout user |
| GET | `/profile/` | Get user profile |
| PATCH | `/profile/update/` | Update profile |
| POST | `/password/change/` | Change password |
| POST | `/social/` | Social auth (Google/Facebook) |
| GET | `/admin/users/` | List all users (admin) |
| PATCH | `/admin/users/<id>/` | Update user (admin) |

### Projects (`/api/projects/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all projects |
| POST | `/` | Create project |
| GET | `/<slug>/` | Get project detail |
| PUT | `/<slug>/` | Update project |
| DELETE | `/<slug>/` | Delete project |
| GET | `/skills/` | List skills |
| POST | `/skills/` | Create skill |

### CV (`/api/cv/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get full CV data |
| GET | `/experiences/` | List experiences |
| POST | `/experiences/` | Create experience |
| GET | `/education/` | List education |
| POST | `/education/` | Create education |
| ... | ... | (skills, languages, certifications, projects, interests) |

### Settings (`/api/settings/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/` | Get site settings |
| PUT | `/settings/` | Update settings (admin) |
| POST | `/contact/` | Submit contact form |
| POST | `/upload/` | Upload image |

### Interactions (`/api/interactions/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/like/<type>/<id>/` | Toggle like |
| GET | `/my-likes/` | User's likes |
| GET | `/notifications/` | User notifications |

## 🔐 Authentication

The API uses Token Authentication. Include the token in requests:

```bash
curl -H "Authorization: Token your-token-here" http://localhost:8000/api/auth/profile/
```

## 🐳 Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend python manage.py migrate
```

## 🧪 Testing

```bash
python manage.py test
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | Required |
| `DJANGO_DEBUG` | Debug mode | False |
| `DB_NAME` | Database name | portfolio_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | Required |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5433 |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | http://localhost:5173 |

## 📄 License

MIT License
