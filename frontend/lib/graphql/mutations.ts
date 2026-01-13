import { gql } from "@apollo/client";

// ==================== ORGANIZATION MUTATIONS ====================

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($name: String!, $slug: String!, $contactEmail: String!) {
    createOrganization(name: $name, slug: $slug, contactEmail: $contactEmail) {
      success
      message
      errors {
        field
        message
      }
      organization {
        id
        name
        slug
      }
    }
  }
`;

// ==================== PROJECT MUTATIONS ====================

export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $organizationSlug: String!
    $name: String!
    $description: String
    $status: String
    $dueDate: Date
  ) {
    createProject(
      organizationSlug: $organizationSlug
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      success
      message
      errors {
        field
        message
      }
      project {
        id
        name
        status
      }
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $id: ID!
    $organizationSlug: String!
    $name: String
    $description: String
    $status: String
    $dueDate: Date
  ) {
    updateProject(
      id: $id
      organizationSlug: $organizationSlug
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      success
      message
      errors {
        field
        message
      }
      project {
        id
        name
        status
      }
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!, $organizationSlug: String!) {
    deleteProject(id: $id, organizationSlug: $organizationSlug) {
      success
      message
    }
  }
`;

// ==================== TASK MUTATIONS ====================

export const CREATE_TASK = gql`
  mutation CreateTask(
    $organizationSlug: String!
    $projectId: Int!
    $title: String!
    $description: String
    $status: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    createTask(
      organizationSlug: $organizationSlug
      projectId: $projectId
      title: $title
      description: $description
      status: $status
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      success
      message
      errors {
        field
        message
      }
      task {
        id
        title
        status
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: ID!
    $organizationSlug: String!
    $title: String
    $description: String
    $status: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    updateTask(
      id: $id
      organizationSlug: $organizationSlug
      title: $title
      description: $description
      status: $status
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      success
      message
      errors {
        field
        message
      }
      task {
        id
        title
        status
      }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!, $organizationSlug: String!) {
    deleteTask(id: $id, organizationSlug: $organizationSlug) {
      success
      message
    }
  }
`;

// ==================== COMMENT MUTATIONS ====================

export const ADD_COMMENT = gql`
  mutation AddComment(
    $organizationSlug: String!
    $taskId: Int!
    $content: String!
    $authorEmail: String!
  ) {
    addComment(
      organizationSlug: $organizationSlug
      taskId: $taskId
      content: $content
      authorEmail: $authorEmail
    ) {
      success
      message
      errors {
        field
        message
      }
      comment {
        id
        content
        authorEmail
        createdAt
      }
    }
  }
`;
