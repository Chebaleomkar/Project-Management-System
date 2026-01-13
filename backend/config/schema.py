import graphene

class Query(graphene.ObjectType):
    hello = graphene.String(default_value="GraphQL is working")

schema = graphene.Schema(query=Query)
