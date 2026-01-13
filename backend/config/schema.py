import graphene
from graphene_django import DjangoObjectType
from django.db.models import Count, Q, Case, When, IntegerField, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.db import IntegrityError

from organizations.models import Organization
from projects.models import Project
from tasks.models import Task
from task_comments.models import TaskComment


# ==================== CUSTOM ERROR TYPES ====================

class ErrorType(graphene.ObjectType):
    """Standardized error response."""
    field = graphene.String()
    message = graphene.String()


# ==================== STATISTICS TYPES ====================

class ProjectStatsType(graphene.ObjectType):
    """Project statistics computed via ORM annotations."""
    total_tasks = graphene.Int()
    completed_tasks = graphene.Int()
    in_progress_tasks = graphene.Int()
    todo_tasks = graphene.Int()
    overdue_tasks = graphene.Int()
    completion_percentage = graphene.Float()


class OrganizationStatsType(graphene.ObjectType):
    """Organization-level statistics."""
    total_projects = graphene.Int()
    active_projects = graphene.Int()
    completed_projects = graphene.Int()
    total_tasks = graphene.Int()
    completed_tasks = graphene.Int()


# ==================== GRAPHQL TYPES ====================

class TaskCommentType(DjangoObjectType):
    """GraphQL type for TaskComment model."""
    class Meta:
        model = TaskComment
        fields = ("id", "task", "content", "author_email", "created_at")


class TaskType(DjangoObjectType):
    """GraphQL type for Task model."""
    comments = graphene.List(lambda: TaskCommentType)
    comment_count = graphene.Int()
    is_overdue = graphene.Boolean()
    
    class Meta:
        model = Task
        fields = ("id", "project", "title", "description", "status", "assignee_email", "due_date", "created_at")

    def resolve_comments(self, info):
        # Use prefetched data if available
        if hasattr(self, '_prefetched_objects_cache') and 'comments' in self._prefetched_objects_cache:
            return self.comments.all()
        return self.comments.select_related('task').all()

    def resolve_comment_count(self, info):
        # Use annotated value if available
        if hasattr(self, 'comment_count_annotated'):
            return self.comment_count_annotated
        return self.comments.count()

    def resolve_is_overdue(self, info):
        if self.due_date and self.status != 'DONE':
            return timezone.now() > self.due_date
        return False


class ProjectType(DjangoObjectType):
    """GraphQL type for Project model with statistics."""
    tasks = graphene.List(lambda: TaskType)
    stats = graphene.Field(ProjectStatsType)
    task_count = graphene.Int()
    
    class Meta:
        model = Project
        fields = ("id", "organization", "name", "description", "status", "due_date", "created_at")

    def resolve_tasks(self, info):
        # Use prefetched data if available
        if hasattr(self, '_prefetched_objects_cache') and 'tasks' in self._prefetched_objects_cache:
            return self.tasks.all()
        return self.tasks.select_related('project').prefetch_related('comments').all()

    def resolve_task_count(self, info):
        if hasattr(self, 'task_count_annotated'):
            return self.task_count_annotated
        return self.tasks.count()

    def resolve_stats(self, info):
        """Compute project statistics using ORM annotations."""
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
        
        return ProjectStatsType(
            total_tasks=total,
            completed_tasks=completed,
            in_progress_tasks=stats['in_progress_tasks'] or 0,
            todo_tasks=stats['todo_tasks'] or 0,
            overdue_tasks=stats['overdue_tasks'] or 0,
            completion_percentage=round(completion_percentage, 2)
        )


class OrganizationType(DjangoObjectType):
    """GraphQL type for Organization model with statistics."""
    projects = graphene.List(lambda: ProjectType)
    stats = graphene.Field(OrganizationStatsType)
    project_count = graphene.Int()
    
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at", "updated_at")

    def resolve_projects(self, info):
        if hasattr(self, '_prefetched_objects_cache') and 'projects' in self._prefetched_objects_cache:
            return self.projects.all()
        return self.projects.prefetch_related('tasks', 'tasks__comments').all()

    def resolve_project_count(self, info):
        if hasattr(self, 'project_count_annotated'):
            return self.project_count_annotated
        return self.projects.count()

    def resolve_stats(self, info):
        """Compute organization statistics using ORM annotations."""
        project_stats = Project.objects.filter(organization=self).aggregate(
            total_projects=Count('id'),
            active_projects=Count('id', filter=Q(status='ACTIVE')),
            completed_projects=Count('id', filter=Q(status='COMPLETED'))
        )
        
        task_stats = Task.objects.filter(project__organization=self).aggregate(
            total_tasks=Count('id'),
            completed_tasks=Count('id', filter=Q(status='DONE'))
        )
        
        return OrganizationStatsType(
            total_projects=project_stats['total_projects'] or 0,
            active_projects=project_stats['active_projects'] or 0,
            completed_projects=project_stats['completed_projects'] or 0,
            total_tasks=task_stats['total_tasks'] or 0,
            completed_tasks=task_stats['completed_tasks'] or 0
        )


# ==================== QUERIES ====================

class Query(graphene.ObjectType):
    # Health check
    hello = graphene.String(default_value="GraphQL API is running")
    
    # Organization queries
    all_organizations = graphene.List(
        OrganizationType,
        description="List all organizations with optimized prefetching"
    )
    organization = graphene.Field(
        OrganizationType, 
        id=graphene.Int(), 
        slug=graphene.String(),
        description="Get organization by ID or slug"
    )
    
    # Project queries (multi-tenant)
    projects_by_organization = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True),
        status=graphene.String(),
        description="List projects by organization with optional status filter"
    )
    project = graphene.Field(
        ProjectType, 
        id=graphene.Int(required=True),
        organization_slug=graphene.String(required=True),
        description="Get project by ID within organization context"
    )
    project_with_stats = graphene.Field(
        ProjectType,
        id=graphene.Int(required=True),
        organization_slug=graphene.String(required=True),
        description="Get project with computed statistics"
    )
    
    # Task queries (multi-tenant)
    tasks_by_project = graphene.List(
        TaskType, 
        project_id=graphene.Int(required=True),
        organization_slug=graphene.String(required=True),
        status=graphene.String(),
        description="List tasks by project within organization"
    )
    task = graphene.Field(
        TaskType, 
        id=graphene.Int(required=True),
        organization_slug=graphene.String(required=True),
        description="Get task by ID within organization context"
    )
    overdue_tasks = graphene.List(
        TaskType,
        organization_slug=graphene.String(required=True),
        description="List all overdue tasks in organization"
    )
    
    # Comment queries (multi-tenant)
    comments_by_task = graphene.List(
        TaskCommentType, 
        task_id=graphene.Int(required=True),
        organization_slug=graphene.String(required=True),
        description="List comments for a task within organization"
    )

    # ==================== RESOLVERS ====================

    def resolve_all_organizations(self, info):
        """Optimized query with prefetching for nested data."""
        return Organization.objects.prefetch_related(
            'projects',
            'projects__tasks',
            'projects__tasks__comments'
        ).annotate(
            project_count_annotated=Count('projects')
        ).all()

    def resolve_organization(self, info, id=None, slug=None):
        """Get organization with validation."""
        queryset = Organization.objects.prefetch_related(
            'projects',
            'projects__tasks'
        )
        if id:
            return queryset.filter(id=id).first()
        if slug:
            return queryset.filter(slug=slug).first()
        return None

    def resolve_projects_by_organization(self, info, organization_slug, status=None):
        """List projects with multi-tenant isolation and optional filtering."""
        queryset = Project.objects.filter(
            organization__slug=organization_slug
        ).select_related(
            'organization'
        ).prefetch_related(
            'tasks'
        ).annotate(
            task_count_annotated=Count('tasks')
        )
        
        if status:
            queryset = queryset.filter(status=status.upper())
        
        return queryset.order_by('-created_at')

    def resolve_project(self, info, id, organization_slug):
        """Get project with multi-tenant validation."""
        return Project.objects.filter(
            id=id,
            organization__slug=organization_slug
        ).select_related(
            'organization'
        ).prefetch_related(
            'tasks',
            'tasks__comments'
        ).first()

    def resolve_project_with_stats(self, info, id, organization_slug):
        """Get project with task statistics."""
        return Project.objects.filter(
            id=id,
            organization__slug=organization_slug
        ).select_related(
            'organization'
        ).prefetch_related(
            'tasks'
        ).first()

    def resolve_tasks_by_project(self, info, project_id, organization_slug, status=None):
        """List tasks with multi-tenant isolation."""
        queryset = Task.objects.filter(
            project_id=project_id,
            project__organization__slug=organization_slug
        ).select_related(
            'project',
            'project__organization'
        ).prefetch_related(
            'comments'
        ).annotate(
            comment_count_annotated=Count('comments')
        )
        
        if status:
            queryset = queryset.filter(status=status.upper())
        
        return queryset.order_by('-created_at')

    def resolve_task(self, info, id, organization_slug):
        """Get task with multi-tenant validation."""
        return Task.objects.filter(
            id=id,
            project__organization__slug=organization_slug
        ).select_related(
            'project',
            'project__organization'
        ).prefetch_related(
            'comments'
        ).first()

    def resolve_overdue_tasks(self, info, organization_slug):
        """List overdue tasks in organization using ORM filtering."""
        now = timezone.now()
        return Task.objects.filter(
            project__organization__slug=organization_slug,
            due_date__lt=now
        ).exclude(
            status='DONE'
        ).select_related(
            'project',
            'project__organization'
        ).order_by('due_date')

    def resolve_comments_by_task(self, info, task_id, organization_slug):
        """List comments with multi-tenant validation."""
        return TaskComment.objects.filter(
            task_id=task_id,
            task__project__organization__slug=organization_slug
        ).select_related(
            'task',
            'task__project'
        ).order_by('created_at')


# ==================== VALIDATION HELPERS ====================

def validate_organization(slug):
    """Validate organization exists and return it."""
    try:
        return Organization.objects.get(slug=slug)
    except Organization.DoesNotExist:
        return None


def validate_project_in_org(project_id, organization_slug):
    """Validate project exists within organization."""
    try:
        return Project.objects.select_related('organization').get(
            id=project_id,
            organization__slug=organization_slug
        )
    except Project.DoesNotExist:
        return None


def validate_task_in_org(task_id, organization_slug):
    """Validate task exists within organization."""
    try:
        return Task.objects.select_related('project', 'project__organization').get(
            id=task_id,
            project__organization__slug=organization_slug
        )
    except Task.DoesNotExist:
        return None


def validate_status_transition(current_status, new_status, valid_statuses):
    """Validate status is a valid value."""
    if new_status and new_status.upper() not in valid_statuses:
        return False, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    return True, None


# ==================== MUTATIONS ====================

# Organization Mutations
class CreateOrganization(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        slug = graphene.String(required=True)
        contact_email = graphene.String(required=True)

    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()
    message = graphene.String()
    errors = graphene.List(ErrorType)

    def mutate(self, info, name, slug, contact_email):
        errors = []
        
        # Validate slug uniqueness
        if Organization.objects.filter(slug=slug).exists():
            errors.append(ErrorType(field="slug", message="Organization with this slug already exists"))
            return CreateOrganization(organization=None, success=False, message="Validation failed", errors=errors)
        
        try:
            organization = Organization.objects.create(
                name=name,
                slug=slug,
                contact_email=contact_email
            )
            return CreateOrganization(
                organization=organization, 
                success=True, 
                message="Organization created successfully",
                errors=[]
            )
        except IntegrityError as e:
            errors.append(ErrorType(field="slug", message="Duplicate slug"))
            return CreateOrganization(organization=None, success=False, message=str(e), errors=errors)


class UpdateOrganization(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        slug = graphene.String()
        contact_email = graphene.String()

    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()
    message = graphene.String()
    errors = graphene.List(ErrorType)

    def mutate(self, info, id, name=None, slug=None, contact_email=None):
        errors = []
        
        try:
            organization = Organization.objects.get(pk=id)
        except Organization.DoesNotExist:
            errors.append(ErrorType(field="id", message="Organization not found"))
            return UpdateOrganization(organization=None, success=False, message="Organization not found", errors=errors)

        # Validate slug uniqueness if changing
        if slug and slug != organization.slug:
            if Organization.objects.filter(slug=slug).exists():
                errors.append(ErrorType(field="slug", message="Slug already in use"))
                return UpdateOrganization(organization=None, success=False, message="Validation failed", errors=errors)
            organization.slug = slug

        if name is not None:
            organization.name = name
        if contact_email is not None:
            organization.contact_email = contact_email

        organization.save()
        return UpdateOrganization(
            organization=organization, 
            success=True, 
            message="Organization updated successfully",
            errors=[]
        )


class DeleteOrganization(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, id):
        try:
            organization = Organization.objects.get(pk=id)
            name = organization.name
            organization.delete()
            return DeleteOrganization(success=True, message=f"Organization '{name}' deleted successfully")
        except Organization.DoesNotExist:
            return DeleteOrganization(success=False, message="Organization not found")


# Project Mutations (Multi-tenant)
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
    errors = graphene.List(ErrorType)

    def mutate(self, info, organization_slug, name, description="", status="ACTIVE", due_date=None):
        errors = []
        
        # Validate organization
        organization = validate_organization(organization_slug)
        if not organization:
            errors.append(ErrorType(field="organization_slug", message="Organization not found"))
            return CreateProject(project=None, success=False, message="Organization not found", errors=errors)

        # Validate status
        valid_statuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD']
        is_valid, error_msg = validate_status_transition(None, status, valid_statuses)
        if not is_valid:
            errors.append(ErrorType(field="status", message=error_msg))
            return CreateProject(project=None, success=False, message=error_msg, errors=errors)

        project = Project.objects.create(
            organization=organization,
            name=name,
            description=description,
            status=status.upper() if status else 'ACTIVE',
            due_date=due_date
        )
        return CreateProject(
            project=project, 
            success=True, 
            message="Project created successfully",
            errors=[]
        )


class UpdateProject(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        organization_slug = graphene.String(required=True)
        name = graphene.String()
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    message = graphene.String()
    errors = graphene.List(ErrorType)

    def mutate(self, info, id, organization_slug, name=None, description=None, status=None, due_date=None):
        errors = []
        
        # Multi-tenant validation
        project = validate_project_in_org(id, organization_slug)
        if not project:
            errors.append(ErrorType(field="id", message="Project not found in this organization"))
            return UpdateProject(project=None, success=False, message="Project not found", errors=errors)

        # Validate status
        if status:
            valid_statuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD']
            is_valid, error_msg = validate_status_transition(project.status, status, valid_statuses)
            if not is_valid:
                errors.append(ErrorType(field="status", message=error_msg))
                return UpdateProject(project=None, success=False, message=error_msg, errors=errors)
            project.status = status.upper()

        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        if due_date is not None:
            project.due_date = due_date

        project.save()
        return UpdateProject(
            project=project, 
            success=True, 
            message="Project updated successfully",
            errors=[]
        )


class DeleteProject(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        organization_slug = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, id, organization_slug):
        project = validate_project_in_org(id, organization_slug)
        if not project:
            return DeleteProject(success=False, message="Project not found in this organization")
        
        name = project.name
        project.delete()
        return DeleteProject(success=True, message=f"Project '{name}' deleted successfully")


# Task Mutations (Multi-tenant)
class CreateTask(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        project_id = graphene.Int(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    message = graphene.String()
    errors = graphene.List(ErrorType)

    def mutate(self, info, organization_slug, project_id, title, description="", status="TODO", assignee_email="", due_date=None):
        errors = []
        
        # Multi-tenant validation
        project = validate_project_in_org(project_id, organization_slug)
        if not project:
            errors.append(ErrorType(field="project_id", message="Project not found in this organization"))
            return CreateTask(task=None, success=False, message="Project not found", errors=errors)

        # Validate status
        valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
        is_valid, error_msg = validate_status_transition(None, status, valid_statuses)
        if not is_valid:
            errors.append(ErrorType(field="status", message=error_msg))
            return CreateTask(task=None, success=False, message=error_msg, errors=errors)

        task = Task.objects.create(
            project=project,
            title=title,
            description=description,
            status=status.upper() if status else 'TODO',
            assignee_email=assignee_email,
            due_date=due_date
        )
        return CreateTask(
            task=task, 
            success=True, 
            message="Task created successfully",
            errors=[]
        )


class UpdateTask(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        organization_slug = graphene.String(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    message = graphene.String()
    errors = graphene.List(ErrorType)

    def mutate(self, info, id, organization_slug, title=None, description=None, status=None, assignee_email=None, due_date=None):
        errors = []
        
        # Multi-tenant validation
        task = validate_task_in_org(id, organization_slug)
        if not task:
            errors.append(ErrorType(field="id", message="Task not found in this organization"))
            return UpdateTask(task=None, success=False, message="Task not found", errors=errors)

        # Validate status
        if status:
            valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
            is_valid, error_msg = validate_status_transition(task.status, status, valid_statuses)
            if not is_valid:
                errors.append(ErrorType(field="status", message=error_msg))
                return UpdateTask(task=None, success=False, message=error_msg, errors=errors)
            task.status = status.upper()

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if assignee_email is not None:
            task.assignee_email = assignee_email
        if due_date is not None:
            task.due_date = due_date

        task.save()
        return UpdateTask(
            task=task, 
            success=True, 
            message="Task updated successfully",
            errors=[]
        )


class DeleteTask(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        organization_slug = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, id, organization_slug):
        task = validate_task_in_org(id, organization_slug)
        if not task:
            return DeleteTask(success=False, message="Task not found in this organization")
        
        title = task.title
        task.delete()
        return DeleteTask(success=True, message=f"Task '{title}' deleted successfully")


# Comment Mutations (Multi-tenant)
class AddComment(graphene.Mutation):
    class Arguments:
        organization_slug = graphene.String(required=True)
        task_id = graphene.Int(required=True)
        content = graphene.String(required=True)
        author_email = graphene.String(required=True)

    comment = graphene.Field(TaskCommentType)
    success = graphene.Boolean()
    message = graphene.String()
    errors = graphene.List(ErrorType)

    def mutate(self, info, organization_slug, task_id, content, author_email):
        errors = []
        
        # Multi-tenant validation
        task = validate_task_in_org(task_id, organization_slug)
        if not task:
            errors.append(ErrorType(field="task_id", message="Task not found in this organization"))
            return AddComment(comment=None, success=False, message="Task not found", errors=errors)

        # Validate content
        if not content.strip():
            errors.append(ErrorType(field="content", message="Comment content cannot be empty"))
            return AddComment(comment=None, success=False, message="Validation failed", errors=errors)

        comment = TaskComment.objects.create(
            task=task,
            content=content.strip(),
            author_email=author_email
        )
        return AddComment(
            comment=comment, 
            success=True, 
            message="Comment added successfully",
            errors=[]
        )


class Mutation(graphene.ObjectType):
    # Organization mutations
    create_organization = CreateOrganization.Field()
    update_organization = UpdateOrganization.Field()
    delete_organization = DeleteOrganization.Field()
    
    # Project mutations (multi-tenant)
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    
    # Task mutations (multi-tenant)
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    delete_task = DeleteTask.Field()
    
    # Comment mutations (multi-tenant)
    add_comment = AddComment.Field()



schema = graphene.Schema(query=Query, mutation=Mutation)
