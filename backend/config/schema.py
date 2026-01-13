import graphene
from graphene_django import DjangoObjectType
from organizations.models import Organization


# Organization Type for GraphQL
class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at", "updated_at")


# Queries
class Query(graphene.ObjectType):
    hello = graphene.String(default_value="GraphQL is working")
    all_organizations = graphene.List(OrganizationType)
    organization = graphene.Field(OrganizationType, id=graphene.Int(), slug=graphene.String())

    def resolve_all_organizations(self, info):
        return Organization.objects.all()

    def resolve_organization(self, info, id=None, slug=None):
        if id:
            return Organization.objects.filter(id=id).first()
        if slug:
            return Organization.objects.filter(slug=slug).first()
        return None


# Mutations
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


class Mutation(graphene.ObjectType):
    create_organization = CreateOrganization.Field()
    update_organization = UpdateOrganization.Field()
    delete_organization = DeleteOrganization.Field()


# Schema
schema = graphene.Schema(query=Query, mutation=Mutation)
