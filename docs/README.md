# 📊 Project Management System

A modern Django GraphQL API for managing organizations, projects, and teams with PostgreSQL backend.

![Django](https://img.shields.io/badge/Django-6.0-green?style=flat-square&logo=django)
![GraphQL](https://img.shields.io/badge/GraphQL-Graphene-E10098?style=flat-square&logo=graphql)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)

---

## Overview

The Project Management System is a backend API built with Django and GraphQL, designed to manage organizations, projects, and team collaboration. It uses Docker-containerized PostgreSQL for data persistence.

### Features

| Feature | Description |
|---------|-------------|
| 🚀 **GraphQL API** | Single endpoint for all operations with type-safe queries and mutations |
| 🐘 **PostgreSQL** | Robust relational database running in Docker with persistent volumes |
| 🔒 **Type Safety** | Strongly typed schema with auto-generated documentation via GraphiQL |

---

## Architecture

The application follows a clean architecture with separation of concerns between the API layer, business logic, and data persistence.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Client      │ ──▶ │    GraphQL      │ ──▶ │     Django      │ ──▶ │   PostgreSQL    │
│ Postman/Frontend│     │   (Graphene)    │     │      6.0        │     │       15        │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Backend Framework | Django | 6.0 | Web framework with ORM |
| GraphQL Library | Graphene-Django | 3.x | GraphQL implementation for Django |
| Database | PostgreSQL | 15 | Relational data storage |
| Containerization | Docker Compose | 3.9 | Database container orchestration |
| DB Admin | Adminer | Latest | Database management UI |

### Project Structure

```
Project Management System/
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py      # Django settings with PostgreSQL & Graphene config
│   │   ├── urls.py          # URL routing with GraphQL endpoint
│   │   ├── schema.py        # GraphQL schema, queries, and mutations
│   │   └── wsgi.py
│   ├── organizations/
│   │   ├── models.py        # Organization model
│   │   ├── admin.py         # Django admin registration
│   │   └── ...
│   ├── .env                 # Environment variables (gitignored)
│   ├── .env.example         # Example environment template
│   ├── manage.py
│   └── requirement.txt
├── docs/
│   └── README.md            # This documentation
├── docker-compose.yml       # PostgreSQL & Adminer containers
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Python 3.12+
- Docker & Docker Compose
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/Chebaleomkar/Project-Management-System.git
cd Project-Management-System
```

### Step 2: Start Database Containers

```bash
# Start PostgreSQL and Adminer containers
docker-compose up -d

# Verify containers are running
docker ps
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp backend/.env.example backend/.env
```

Edit `.env` with your settings:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `DB_NAME` | project_management | PostgreSQL database name |
| `DB_USER` | postgres | Database username |
| `DB_PASSWORD` | postgres | Database password |
| `DB_HOST` | localhost | Database host (use 'db' inside Docker) |
| `DB_PORT` | 5433 | Database port (5433 for Docker from host) |

### Step 4: Install Dependencies & Run

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r backend/requirement.txt

# Run migrations
cd backend
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| GraphQL API | http://localhost:8000/graphql/ | GraphQL endpoint with GraphiQL UI |
| Django Admin | http://localhost:8000/admin/ | Django administration panel |
| Adminer | http://localhost:8081 | Database management UI |

---

## API Reference

All API operations are performed through the GraphQL endpoint at `/graphql/` using POST requests.

### Organization Type

```graphql
type OrganizationType {
    id: ID!
    name: String!
    slug: String!
    contactEmail: String!
    createdAt: DateTime!
    updatedAt: DateTime!
}
```

### Queries

| Query | Arguments | Returns | Description |
|-------|-----------|---------|-------------|
| `hello` | None | String | Health check endpoint |
| `allOrganizations` | None | [OrganizationType] | List all organizations |
| `organization` | id: Int, slug: String | OrganizationType | Get organization by ID or slug |

### Mutations

| Mutation | Arguments | Returns | Description |
|----------|-----------|---------|-------------|
| `createOrganization` | name!, slug!, contactEmail! | organization | Create new organization |
| `updateOrganization` | id!, name?, slug?, contactEmail? | organization, success | Update existing organization |
| `deleteOrganization` | id! | success, message | Delete organization |

---

## Usage Examples

### Query: Get All Organizations

```graphql
query {
    allOrganizations {
        id
        name
        slug
        contactEmail
        createdAt
    }
}
```

### Query: Get Organization by ID

```graphql
query {
    organization(id: 1) {
        id
        name
        slug
        contactEmail
    }
}
```

### Mutation: Create Organization

```graphql
mutation {
    createOrganization(
        name: "Acme Corporation"
        slug: "acme"
        contactEmail: "admin@acme.com"
    ) {
        organization {
            id
            name
            slug
            contactEmail
            createdAt
        }
    }
}
```

### Mutation: Update Organization

```graphql
mutation {
    updateOrganization(
        id: "1"
        name: "Acme Private Limited"
    ) {
        success
        organization {
            id
            name
            slug
            contactEmail
        }
    }
}
```

### Mutation: Delete Organization

```graphql
mutation {
    deleteOrganization(id: "1") {
        success
        message
    }
}
```

### Using with Postman

**Endpoint:** `POST http://127.0.0.1:8000/graphql/`

**Headers:**
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
    "query": "mutation { createOrganization(name: \"Test Org\", slug: \"test\", contactEmail: \"test@test.com\") { organization { id name } } }"
}
```

---

## Docker Configuration

### docker-compose.yml

```yaml
version: "3.9"

services:
  db:
    image: postgres:15
    container_name: pg_project_mgmt
    environment:
      POSTGRES_DB: project_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  adminer:
    image: adminer
    container_name: adminer_project_mgmt
    ports:
      - "8081:8080"
    depends_on:
      - db

volumes:
  postgres_data:
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ using Django, GraphQL, PostgreSQL & Docker
</p>
