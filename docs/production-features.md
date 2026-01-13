# Production-Grade Backend Features

This document covers the advanced backend optimizations implemented to make the Project Management System interview-ready and production-grade.

## Overview

We enhanced the Django GraphQL API with:
- **Project Statistics** using ORM annotations
- **Multi-Tenancy Enforcement** for organization isolation
- **Query Performance Optimization** to prevent N+1 queries
- **Standardized Error Handling** with detailed responses

---

## 1. Project Statistics with ORM Annotations

Instead of computing statistics in Python loops (which is slow and doesn't scale), we use Django's ORM aggregation functions.

### Implementation

```python
from django.db.models import Count, Q

def resolve_stats(self, info):
    now = timezone.now()
    stats = Task.objects.filter(project=self).aggregate(
        total_tasks=Count('id'),
        completed_tasks=Count('id', filter=Q(status='DONE')),
        in_progress_tasks=Count('id', filter=Q(status='IN_PROGRESS')),
        todo_tasks=Count('id', filter=Q(status='TODO')),
        overdue_tasks=Count('id', filter=Q(due_date__lt=now) & ~Q(status='DONE'))
    )
    
    total = stats['total_tasks'] or 0
    completed = stats['completed_tasks'] or 0
    completion_percentage = (completed / total * 100) if total > 0 else 0.0
    
    return ProjectStatsType(...)
```

### Why This Approach?

| Approach | Query Count | Performance |
|----------|-------------|-------------|
| Python loops | N+1 queries | Slow, doesn't scale |
| ORM aggregate() | 1 query | Fast, database-optimized |

The database does the counting in a single query, returning computed values directly.

### GraphQL Query Example

```graphql
{
    projectWithStats(id: 1, organizationSlug: "acme") {
        name
        stats {
            totalTasks
            completedTasks
            inProgressTasks
            todoTasks
            overdueTasks
            completionPercentage
        }
    }
}
```

---

## 2. Multi-Tenancy Enforcement

Every query and mutation now requires organization context to prevent cross-organization data access.

### How It Works

All data operations validate that the resource belongs to the specified organization:

```python
def validate_project_in_org(project_id, organization_slug):
    """Validate project exists within organization."""
    try:
        return Project.objects.select_related('organization').get(
            id=project_id,
            organization__slug=organization_slug
        )
    except Project.DoesNotExist:
        return None
```

### Enforced Queries

| Query | Required Argument |
|-------|-------------------|
| `projectsByOrganization` | `organizationSlug` |
| `project` | `id` + `organizationSlug` |
| `tasksByProject` | `projectId` + `organizationSlug` |
| `task` | `id` + `organizationSlug` |
| `commentsByTask` | `taskId` + `organizationSlug` |

### Enforced Mutations

All mutations now require `organizationSlug`:

```graphql
mutation {
    createTask(
        organizationSlug: "acme"
        projectId: 1
        title: "New task"
    ) {
        success
        task { id }
    }
}
```

If you try to access a project from a different organization, you get:

```json
{
    "success": false,
    "message": "Project not found in this organization",
    "errors": [{"field": "project_id", "message": "Project not found in this organization"}]
}
```

---

## 3. Query Performance Optimization

### The N+1 Problem

Without optimization, fetching an organization with 10 projects and 50 tasks would execute:
- 1 query for organization
- 10 queries for projects
- 50 queries for tasks
- **= 61 queries total**

### Our Solution

Using `select_related()` and `prefetch_related()`:

```python
def resolve_all_organizations(self, info):
    return Organization.objects.prefetch_related(
        'projects',
        'projects__tasks',
        'projects__tasks__comments'
    ).annotate(
        project_count_annotated=Count('projects')
    ).all()
```

Now the same request executes in **4 queries** regardless of data size.

### Optimization Patterns Used

| Pattern | Use Case | Example |
|---------|----------|---------|
| `select_related()` | ForeignKey (to-one) | `Task.select_related('project')` |
| `prefetch_related()` | Reverse FK (to-many) | `Project.prefetch_related('tasks')` |
| `annotate()` | Computed fields | `Count('tasks')` |

### Cached Annotations

We annotate counts at query time and use them in resolvers:

```python
def resolve_task_count(self, info):
    if hasattr(self, 'task_count_annotated'):
        return self.task_count_annotated  # Pre-computed, no extra query
    return self.tasks.count()  # Fallback
```

---

## 4. Standardized Error Handling

### Error Response Type

```python
class ErrorType(graphene.ObjectType):
    field = graphene.String()
    message = graphene.String()
```

### Mutation Response Pattern

Every mutation returns:
- `success` - Boolean indicating success/failure
- `message` - Human-readable message
- `errors` - List of field-specific errors
- The created/updated object (if successful)

### Example: Duplicate Slug Error

```graphql
mutation {
    createOrganization(name: "Test", slug: "acme", contactEmail: "test@test.com") {
        success
        message
        errors {
            field
            message
        }
    }
}
```

Response:
```json
{
    "data": {
        "createOrganization": {
            "success": false,
            "message": "Validation failed",
            "errors": [
                {"field": "slug", "message": "Organization with this slug already exists"}
            ]
        }
    }
}
```

### Status Validation

Invalid status values are caught before database operations:

```python
valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
if new_status.upper() not in valid_statuses:
    return f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
```

---

## 5. New Queries Added

### Overdue Tasks Query

Finds all tasks past their due date that aren't completed:

```graphql
{
    overdueTasks(organizationSlug: "acme") {
        id
        title
        dueDate
        project { name }
    }
}
```

Implementation uses database-level filtering:

```python
def resolve_overdue_tasks(self, info, organization_slug):
    now = timezone.now()
    return Task.objects.filter(
        project__organization__slug=organization_slug,
        due_date__lt=now
    ).exclude(
        status='DONE'
    ).select_related('project').order_by('due_date')
```

---

## 6. GraphQL Type Enhancements

### TaskType

New computed fields:
- `commentCount` - Number of comments (annotated)
- `isOverdue` - Boolean computed from due_date and status

### ProjectType

New fields:
- `stats` - ProjectStatsType with task statistics
- `taskCount` - Annotated task count

### OrganizationType

New fields:
- `stats` - OrganizationStatsType with project/task counts
- `projectCount` - Annotated project count

---

## Summary of Changes

| Feature | Before | After |
|---------|--------|-------|
| Statistics | Manual counting in Python | ORM `aggregate()` with `Count` and `Q` |
| Tenant Isolation | None | Required `organizationSlug` on all operations |
| Query Performance | N+1 queries | Optimized with prefetch/select_related |
| Error Handling | Basic success/fail | Structured errors with field names |
| Computed Fields | None | Annotated counts, isOverdue, stats |

---

## Testing the Features

### Get Project with Statistics
```json
{
    "query": "{ project(id: 1, organizationSlug: \"acme\") { name stats { totalTasks completedTasks completionPercentage overdueTasks } } }"
}
```

### Get Overdue Tasks
```json
{
    "query": "{ overdueTasks(organizationSlug: \"acme\") { id title dueDate project { name } } }"
}
```

### Create Task with Organization Context
```json
{
    "query": "mutation { createTask(organizationSlug: \"acme\", projectId: 1, title: \"New Task\", status: \"TODO\") { success message errors { field message } task { id } } }"
}
```

---

## Best Practices Applied

1. **Database-level computations** - Use `aggregate()`, `annotate()`, not Python loops
2. **Eager loading** - `select_related()` for FK, `prefetch_related()` for reverse FK
3. **Consistent error responses** - All mutations return success, message, errors
4. **Multi-tenancy by default** - Organization context required everywhere
5. **Validation before mutation** - Check constraints before touching the database
6. **Descriptive GraphQL schema** - Added `description` to all queries/mutations

These patterns make the API production-ready, scalable, and maintainable.
