# Building the Projects App with Django & GraphQL

*January 13, 2026*

This post covers how we built the Projects feature for our Project Management System using Django and GraphQL.

---

## What We Built

A complete CRUD system for managing projects within organizations. Each project belongs to an organization and has status tracking, due dates, and descriptions.

## The Stack

- **Django 6.0** - ORM and admin
- **Graphene-Django** - GraphQL integration
- **PostgreSQL 15** - Database (Docker)

---

## Implementation

### 1. Model Design

We created a `Project` model with a ForeignKey to `Organization`:

```python
class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        ON_HOLD = 'ON_HOLD', 'On Hold'

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

Key decisions:
- **`related_name='projects'`** - Enables reverse lookup from Organization
- **TextChoices** - Type-safe status enum
- **CASCADE** - Delete projects when org is deleted

### 2. GraphQL Types

The tricky part was enabling nested queries. We needed `OrganizationType` to expose its projects:

```python
class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = ("id", "organization", "name", "description", "status", "due_date", "created_at")


class OrganizationType(DjangoObjectType):
    projects = graphene.List(lambda: ProjectType)
    
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at", "updated_at", "projects")

    def resolve_projects(self, info):
        return self.projects.all()
```

The `lambda: ProjectType` handles the circular reference since `ProjectType` references `OrganizationType` through the organization field.

### 3. Queries

We added three project-related queries:

```python
all_projects = graphene.List(ProjectType)
projects_by_organization = graphene.List(ProjectType, organization_slug=graphene.String(required=True))
project = graphene.Field(ProjectType, id=graphene.Int(required=True))
```

The `projects_by_organization` query uses Django's double-underscore syntax for related field filtering:

```python
def resolve_projects_by_organization(self, info, organization_slug):
    return Project.objects.filter(
        organization__slug=organization_slug
    ).select_related('organization')
```

### 4. Mutations

Standard CRUD mutations with error handling:

```python
class CreateProject(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        name = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, organization_slug, name, description="", status="ACTIVE", due_date=None):
        try:
            organization = Organization.objects.get(slug=organization_slug)
        except Organization.DoesNotExist:
            return CreateProject(project=None, success=False, message="Organization not found")

        project = Project.objects.create(
            organization=organization,
            name=name,
            description=description,
            status=status,
            due_date=due_date
        )
        return CreateProject(project=project, success=True, message="Project created successfully")
```

---

## API Examples

**Create a project:**
```graphql
mutation {
    createProject(
        organizationSlug: "acme"
        name: "Website Redesign"
        status: "ACTIVE"
        dueDate: "2026-03-15"
    ) {
        success
        project { id name }
    }
}
```

**Get organization with all projects:**
```graphql
{
    organization(slug: "acme") {
        name
        projects {
            id
            name
            status
            dueDate
        }
    }
}
```

---

## Lessons Learned

1. **Order matters in GraphQL types** - Define `ProjectType` before `OrganizationType` when there are circular references
2. **Use `select_related`** - Prevents N+1 queries when fetching nested data
3. **Return success flags** - Makes error handling easier on the frontend
4. **Use slugs for lookups** - More readable than IDs in URLs and queries

---

## What's Next

- User authentication with JWT
- Task model (belongs to Project)
- Team members and assignments
- Activity logging

---

*[Back to docs](./README.md)*
