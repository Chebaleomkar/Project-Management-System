import { gql } from "@apollo/client";

// ==================== ORGANIZATION QUERIES ====================

export const GET_ALL_ORGANIZATIONS = gql`
  query GetAllOrganizations {
    allOrganizations {
      id
      name
      slug
      contactEmail
      projectCount
      stats {
        totalProjects
        activeProjects
        completedProjects
        totalTasks
        completedTasks
      }
    }
  }
`;

export const GET_ORGANIZATION = gql`
  query GetOrganization($slug: String!) {
    organization(slug: $slug) {
      id
      name
      slug
      contactEmail
      createdAt
      stats {
        totalProjects
        activeProjects
        completedProjects
        totalTasks
        completedTasks
      }
    }
  }
`;

// ==================== PROJECT QUERIES ====================

export const GET_PROJECTS_BY_ORGANIZATION = gql`
  query GetProjectsByOrganization($organizationSlug: String!, $status: String) {
    projectsByOrganization(organizationSlug: $organizationSlug, status: $status) {
      id
      name
      description
      status
      dueDate
      createdAt
      taskCount
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
`;

export const GET_PROJECT = gql`
  query GetProject($id: Int!, $organizationSlug: String!) {
    project(id: $id, organizationSlug: $organizationSlug) {
      id
      name
      description
      status
      dueDate
      createdAt
      stats {
        totalTasks
        completedTasks
        inProgressTasks
        todoTasks
        overdueTasks
        completionPercentage
      }
      tasks {
        id
        title
        description
        status
        assigneeEmail
        dueDate
        createdAt
        commentCount
        isOverdue
      }
    }
  }
`;

// ==================== TASK QUERIES ====================

export const GET_TASKS_BY_PROJECT = gql`
  query GetTasksByProject($projectId: Int!, $organizationSlug: String!, $status: String) {
    tasksByProject(projectId: $projectId, organizationSlug: $organizationSlug, status: $status) {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      commentCount
      isOverdue
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: Int!, $organizationSlug: String!) {
    task(id: $id, organizationSlug: $organizationSlug) {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      comments {
        id
        content
        authorEmail
        createdAt
      }
    }
  }
`;

export const GET_OVERDUE_TASKS = gql`
  query GetOverdueTasks($organizationSlug: String!) {
    overdueTasks(organizationSlug: $organizationSlug) {
      id
      title
      dueDate
      project {
        id
        name
      }
    }
  }
`;

// ==================== COMMENT QUERIES ====================

export const GET_COMMENTS_BY_TASK = gql`
  query GetCommentsByTask($taskId: Int!, $organizationSlug: String!) {
    commentsByTask(taskId: $taskId, organizationSlug: $organizationSlug) {
      id
      content
      authorEmail
      createdAt
    }
  }
`;
