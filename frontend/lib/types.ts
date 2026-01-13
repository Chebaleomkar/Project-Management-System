// Organization types
export interface OrganizationStats {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    contactEmail: string;
    createdAt?: string;
    updatedAt?: string;
    projectCount?: number;
    stats?: OrganizationStats;
}

// Project types
export interface ProjectStats {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    overdueTasks: number;
    completionPercentage: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
    dueDate?: string;
    createdAt: string;
    taskCount?: number;
    stats?: ProjectStats;
    tasks?: Task[];
    organization?: Organization;
}

// Task types
export interface Task {
    id: string;
    title: string;
    description: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    assigneeEmail?: string;
    dueDate?: string;
    createdAt: string;
    commentCount?: number;
    isOverdue?: boolean;
    comments?: Comment[];
    project?: Project;
}

// Comment types
export interface Comment {
    id: string;
    content: string;
    authorEmail: string;
    createdAt: string;
    task?: Task;
}

// Error types
export interface GraphQLError {
    field: string;
    message: string;
}

// Mutation response types
export interface MutationResponse {
    success: boolean;
    message: string;
    errors?: GraphQLError[];
}
