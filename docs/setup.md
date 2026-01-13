# 📊 Project Management System

A Django GraphQL API for managing organizations and projects with PostgreSQL.

![Django](https://img.shields.io/badge/Django-6.0-green?style=flat-square&logo=django)
![GraphQL](https://img.shields.io/badge/GraphQL-Graphene-E10098?style=flat-square&logo=graphql)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## Quick Start

```bash
# 1. Start PostgreSQL container
docker-compose up -d

# 2. Setup environment
cp backend/.env.example backend/.env
# Edit .env: DB_HOST=localhost, DB_PORT=5433

# 3. Install & run
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r backend/requirement.txt
cd backend
python manage.py migrate
python manage.py runserver
```

**Access Points:**
- GraphQL API: http://localhost:8000/graphql/
- Admin Panel: http://localhost:8000/admin/
- DB Admin: http://localhost:8081

---

## Architecture

```
Client → GraphQL (Graphene) → Django 6.0 → PostgreSQL 15
```

## Data Models

### Organization
| Field | Type |
|-------|------|
| name | CharField(100) |
| slug | SlugField (unique) |
| contact_email | EmailField |
| created_at | DateTime |

### Project
| Field | Type |
|-------|------|
| organization | FK → Organization |
| name | CharField(200) |
| description | TextField |
| status | ACTIVE / COMPLETED / ON_HOLD |
| due_date | DateField (optional) |
| created_at | DateTime |

---

## GraphQL API

### Queries

```graphql
# All organizations with projects
{ allOrganizations { id name slug projects { id name status } } }

# Organization by slug
{ organization(slug: "acme") { id name projects { name status } } }

# All projects
{ allProjects { id name status organization { name } } }

# Projects by organization
{ projectsByOrganization(organizationSlug: "acme") { id name status } }
```

### Mutations

```graphql
# Create organization
mutation { createOrganization(name: "Acme", slug: "acme", contactEmail: "hi@acme.com") { organization { id } } }

# Create project
mutation { createProject(organizationSlug: "acme", name: "Website", status: "ACTIVE") { success project { id } } }

# Update project
mutation { updateProject(id: "1", status: "COMPLETED") { success } }

# Delete
mutation { deleteOrganization(id: "1") { success } }
mutation { deleteProject(id: "1") { success } }
```

---

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| DB_NAME | project_management | Database name |
| DB_USER | postgres | Username |
| DB_PASSWORD | postgres | Password |
| DB_HOST | localhost | Host (use 'db' in Docker) |
| DB_PORT | 5433 | Port |

---

## Project Structure

```
├── backend/
│   ├── config/          # Django settings, URLs, GraphQL schema
│   ├── organizations/   # Organization model & admin
│   ├── projects/        # Project model & admin
│   └── manage.py
├── docs/               # Documentation & blogs
├── docker-compose.yml  # PostgreSQL & Adminer
└── README.md
```

---

## Blogs

- [Building Projects App with GraphQL](./blog-projects-app.md)

---
