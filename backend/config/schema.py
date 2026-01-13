import graphene
from graphene_django import DjangoObjectType
from organizations.models import Organization
from projects.models import Project
from tasks.models import Task


# ==================== TYPES ====================

class TaskType(DjangoObjectType):
    """GraphQL type for Task model."""
    class Meta:
        model = Task
        fields = ("id", "project", "title", "description", "status", "assignee_email", "due_date", "created_at")


class ProjectType(DjangoObjectType):
    """GraphQL type for Project model."""
    tasks = graphene.List(lambda: TaskType)
    
    class Meta:
        model = Project
        fields = ("id", "organization", "name", "description", "status", "due_date", "created_at", "tasks")

    def resolve_tasks(self, info):
        return self.tasks.all()


class OrganizationType(DjangoObjectType):
    """GraphQL type for Organization model."""
    projects = graphene.List(lambda: ProjectType)
    
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at", "updated_at", "projects")

    def resolve_projects(self, info):
        return self.projects.all()


# ==================== QUERIES ====================

class Query(graphene.ObjectType):
    # Health check
    hello = graphene.String(default_value="GraphQL is working")
    
    # Organization queries
    all_organizations = graphene.List(OrganizationType)
    organization = graphene.Field(
        OrganizationType, 
        id=graphene.Int(), 
        slug=graphene.String()
    )
    
    # Project queries
    all_projects = graphene.List(ProjectType)
    projects_by_organization = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True)
    )
    project = graphene.Field(ProjectType, id=graphene.Int(required=True))
    
    # Task queries
    all_tasks = graphene.List(TaskType)
    tasks_by_project = graphene.List(TaskType, project_id=graphene.Int(required=True))
    task = graphene.Field(TaskType, id=graphene.Int(required=True))

    def resolve_all_organizations(self, info):
        return Organization.objects.all()

    def resolve_organization(self, info, id=None, slug=None):
        if id:
            return Organization.objects.filter(id=id).first()
        if slug:
            return Organization.objects.filter(slug=slug).first()
        return None

    def resolve_all_projects(self, info):
        return Project.objects.select_related('organization').all()

    def resolve_projects_by_organization(self, info, organization_slug):
        return Project.objects.filter(
            organization__slug=organization_slug
        ).select_related('organization')

    def resolve_project(self, info, id):
        return Project.objects.filter(id=id).select_related('organization').first()

    def resolve_all_tasks(self, info):
        return Task.objects.select_related('project', 'project__organization').all()

    def resolve_tasks_by_project(self, info, project_id):
        return Task.objects.filter(project_id=project_id).select_related('project')

    def resolve_task(self, info, id):
        return Task.objects.filter(id=id).select_related('project').first()


# ==================== MUTATIONS ====================

# Organization Mutations
class CreateOrganization(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        slug = graphene.String(required=True)
        contact_email = graphene.String(required=True)

    organization = graphene.Field(OrganizationType)

    def mutate(self, info, name, slug, contact_email):
        organization = Organization.objects.create(
            name=name,
            slug=slug,
            contact_email=contact_email
        )
        return CreateOrganization(organization=organization)


class UpdateOrganization(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        slug = graphene.String()
        contact_email = graphene.String()

    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()

    def mutate(self, info, id, name=None, slug=None, contact_email=None):
        try:
            organization = Organization.objects.get(pk=id)
        except Organization.DoesNotExist:
            return UpdateOrganization(organization=None, success=False)

        if name is not None:
            organization.name = name
        if slug is not None:
            organization.slug = slug
        if contact_email is not None:
            organization.contact_email = contact_email

        organization.save()
        return UpdateOrganization(organization=organization, success=True)


class DeleteOrganization(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, id):
        try:
            organization = Organization.objects.get(pk=id)
            organization.delete()
            return DeleteOrganization(success=True, message="Organization deleted successfully")
        except Organization.DoesNotExist:
            return DeleteOrganization(success=False, message="Organization not found")


# Project Mutations
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


class UpdateProject(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)
    success = graphene.Boolean()

    def mutate(self, info, id, name=None, description=None, status=None, due_date=None):
        try:
            project = Project.objects.get(pk=id)
        except Project.DoesNotExist:
            return UpdateProject(project=None, success=False)

        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        if status is not None:
            project.status = status
        if due_date is not None:
            project.due_date = due_date

        project.save()
        return UpdateProject(project=project, success=True)


class DeleteProject(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, id):
        try:
            project = Project.objects.get(pk=id)
            project.delete()
            return DeleteProject(success=True, message="Project deleted successfully")
        except Project.DoesNotExist:
            return DeleteProject(success=False, message="Project not found")


# Task Mutations
class CreateTask(graphene.Mutation):
    class Arguments:
        project_id = graphene.Int(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, project_id, title, description="", status="TODO", assignee_email="", due_date=None):
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return CreateTask(task=None, success=False, message="Project not found")

        task = Task.objects.create(
            project=project,
            title=title,
            description=description,
            status=status,
            assignee_email=assignee_email,
            due_date=due_date
        )
        return CreateTask(task=task, success=True, message="Task created successfully")


class UpdateTask(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    task = graphene.Field(TaskType)
    success = graphene.Boolean()

    def mutate(self, info, id, title=None, description=None, status=None, assignee_email=None, due_date=None):
        try:
            task = Task.objects.get(pk=id)
        except Task.DoesNotExist:
            return UpdateTask(task=None, success=False)

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if status is not None:
            task.status = status
        if assignee_email is not None:
            task.assignee_email = assignee_email
        if due_date is not None:
            task.due_date = due_date

        task.save()
        return UpdateTask(task=task, success=True)


class DeleteTask(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, id):
        try:
            task = Task.objects.get(pk=id)
            task.delete()
            return DeleteTask(success=True, message="Task deleted successfully")
        except Task.DoesNotExist:
            return DeleteTask(success=False, message="Task not found")


# ==================== MUTATION ROOT ====================

class Mutation(graphene.ObjectType):
    # Organization mutations
    create_organization = CreateOrganization.Field()
    update_organization = UpdateOrganization.Field()
    delete_organization = DeleteOrganization.Field()
    
    # Project mutations
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    
    # Task mutations
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    delete_task = DeleteTask.Field()


# ==================== SCHEMA ====================

schema = graphene.Schema(query=Query, mutation=Mutation)
