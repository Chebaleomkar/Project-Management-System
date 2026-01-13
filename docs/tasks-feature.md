# Tasks Feature Documentation

## Overview

The Tasks feature allows creating and managing tasks within projects. Each task belongs to a project, has a status, and can be assigned to a team member via email.

## Data Model

```python
class Task(models.Model):
    class Status(models.TextChoices):
        TODO = 'TODO', 'To Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DONE = 'DONE', 'Done'

    project = models.ForeignKey(Project, on_delete=CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=TODO)
    assignee_email = models.EmailField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Key Design Decisions

- **`related_name='tasks'`** - Enables `project.tasks.all()` and nested GraphQL queries
- **`assignee_email`** - Simple assignment without user model dependency
- **`DateTimeField` for due_date** - More precise than DateField for task deadlines
- **CASCADE delete** - Tasks are deleted when parent project is deleted

## GraphQL API

### Queries

| Query | Arguments | Returns |
|-------|-----------|---------|
| `allTasks` | - | All tasks |
| `tasksByProject` | `projectId!` | Tasks in specific project |
| `task` | `id!` | Single task |

### Mutations

| Mutation | Required Args | Optional Args |
|----------|---------------|---------------|
| `createTask` | `projectId`, `title` | `description`, `status`, `assigneeEmail`, `dueDate` |
| `updateTask` | `id` | `title`, `description`, `status`, `assigneeEmail`, `dueDate` |
| `deleteTask` | `id` | - |

## API Examples

### Create Task

```graphql
mutation {
    createTask(
        projectId: 1
        title: "Design homepage mockups"
        description: "Create wireframes and high-fidelity designs"
        status: "TODO"
        assigneeEmail: "designer@company.com"
        dueDate: "2026-02-15T17:00:00"
    ) {
        success
        message
        task {
            id
            title
            status
        }
    }
}
```

### Get Tasks by Project

```graphql
{
    tasksByProject(projectId: 1) {
        id
        title
        status
        assigneeEmail
        dueDate
        createdAt
    }
}
```

### Get Project with Nested Tasks

```graphql
{
    project(id: 1) {
        name
        status
        tasks {
            id
            title
            status
            assigneeEmail
        }
    }
}
```

### Update Task Status

```graphql
mutation {
    updateTask(id: "1", status: "IN_PROGRESS") {
        success
        task {
            id
            title
            status
        }
    }
}
```

### Complete a Task

```graphql
mutation {
    updateTask(id: "1", status: "DONE") {
        success
        task { id title status }
    }
}
```

### Delete Task

```graphql
mutation {
    deleteTask(id: "1") {
        success
        message
    }
}
```

### Full Hierarchy Query

Get organization → projects → tasks in one query:

```graphql
{
    organization(slug: "acme") {
        name
        projects {
            id
            name
            status
            tasks {
                id
                title
                status
                assigneeEmail
            }
        }
    }
}
```

## Implementation Notes

### Nested GraphQL Types

The `ProjectType` was updated to include tasks:

```python
class ProjectType(DjangoObjectType):
    tasks = graphene.List(lambda: TaskType)
    
    class Meta:
        model = Project
        fields = (..., "tasks")

    def resolve_tasks(self, info):
        return self.tasks.all()
```

### Query Optimization

Using `select_related` to prevent N+1 queries:

```python
def resolve_tasks_by_project(self, info, project_id):
    return Task.objects.filter(project_id=project_id).select_related('project')
```

## Status Workflow

```
TODO → IN_PROGRESS → DONE
```

Tasks start in `TODO` status by default and can be updated to reflect progress.

## What's Next

- User authentication and permissions
- Task comments
- Task attachments
- Notifications on assignment
