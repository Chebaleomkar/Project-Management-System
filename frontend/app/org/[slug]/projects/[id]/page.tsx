"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECT, GET_PROJECT as REFETCH_QUERY } from "@/lib/graphql/queries";
import { CREATE_TASK, UPDATE_TASK, DELETE_TASK, ADD_COMMENT } from "@/lib/graphql/mutations";
import { use, useState, useEffect } from "react";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorMessage } from "@/components/ui/Error";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

// Types derived from schema
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export default function ProjectDetailsPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const resolvedParams = use(params);
    const [slug, setSlug] = useState<string>("");
    const [projectId, setProjectId] = useState<number>(0);

    // UI State
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Create Task Form
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("TODO");

    // Comment Form
    const [commentContent, setCommentContent] = useState("");
    const [commentEmail, setCommentEmail] = useState("");

    useEffect(() => {
        setSlug(resolvedParams.slug);
        setProjectId(parseInt(resolvedParams.id));
    }, [resolvedParams]);

    // Queries & Mutations
    const { data, loading, error } = useQuery(GET_PROJECT, {
        variables: { id: projectId, organizationSlug: slug },
        skip: !slug || !projectId,
        pollInterval: 5000, // Light polling for "real-time" feel
    });

    const [createTask] = useMutation(CREATE_TASK, {
        refetchQueries: [{ query: REFETCH_QUERY, variables: { id: projectId, organizationSlug: slug } }],
    });

    const [updateTask] = useMutation(UPDATE_TASK);

    const [addComment] = useMutation(ADD_COMMENT, {
        refetchQueries: [{ query: REFETCH_QUERY, variables: { id: projectId, organizationSlug: slug } }],
    });

    // Handlers
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        await createTask({
            variables: {
                organizationSlug: slug,
                projectId: projectId,
                title: newTaskTitle,
                status: newTaskStatus,
            },
        });
        setNewTaskTitle("");
        setIsTaskModalOpen(false);
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        // Optimistic update could go here
        await updateTask({
            variables: {
                id: taskId,
                organizationSlug: slug,
                status: newStatus,
            },
        });
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim() || !commentEmail.trim()) return;

        await addComment({
            variables: {
                organizationSlug: slug,
                taskId: parseInt(selectedTask.id),
                content: commentContent,
                authorEmail: commentEmail,
            },
        });
        setCommentContent("");
    };

    if (loading || !slug) return <LoadingPage />;
    if (error) return <ErrorMessage message={error.message} />;

    const project = data?.project;
    const tasks = project?.tasks || [];

    // Group tasks by status
    const tasksByStatus = {
        TODO: tasks.filter((t: any) => t.status === "TODO"),
        IN_PROGRESS: tasks.filter((t: any) => t.status === "IN_PROGRESS"),
        DONE: tasks.filter((t: any) => t.status === "DONE"),
    };

    return (
        <div className="h-[calc(100vh-theme(spacing.32))] flex flex-col">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href={`/org/${slug}/projects`} className="hover:text-white">Projects</Link>
                        <span>/</span>
                        <span>{project.name}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                </div>
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    + Add Task
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 h-full min-w-[1000px]">
                    {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => (
                        <div key={status} className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700 flex flex-col">
                            {/* Column Header */}
                            <div className="p-4 border-b border-slate-700 font-bold text-slate-300 flex justify-between">
                                <span>{status.replace("_", " ")}</span>
                                <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-sm">
                                    {tasksByStatus[status].length}
                                </span>
                            </div>

                            {/* Task List */}
                            <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                {tasksByStatus[status].map((task: any) => (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        className={`bg-slate-800 p-4 rounded-lg border cursor-pointer transition-all hover:border-indigo-500/50 hover:shadow-lg group ${selectedTask?.id === task.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-700"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-slate-200 group-hover:text-white break-words">{task.title}</h4>
                                            {task.isOverdue && <span title="Overdue">⚠️</span>}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
                                            <div className="flex items-center gap-2">
                                                <span>💬 {task.commentCount || 0}</span>
                                                {task.assigneeEmail && (
                                                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[100px]">
                                                        {task.assigneeEmail.split('@')[0]}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quick Status Change */}
                                            <select
                                                onClick={(e) => e.stopPropagation()}
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className="bg-slate-900 border border-slate-700 rounded text-[10px] px-1 py-0.5 outline-none hover:border-indigo-500"
                                            >
                                                <option value="TODO">Todo</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                {tasksByStatus[status].length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-lg">
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Task Details Side Panel */}
            {selectedTask && (
                <div className="fixed inset-y-0 right-0 w-96 bg-slate-800 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 overflow-y-auto z-50 p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-white truncate pr-4">{selectedTask.title}</h2>
                        <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                    </div>

                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Status</label>
                            <Badge variant={selectedTask.status.toLowerCase()}>{selectedTask.status}</Badge>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Description</label>
                            <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                {selectedTask.description || "No description provided."}
                            </p>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Assignee</label>
                            <div className="text-slate-300 text-sm flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                                    {(selectedTask.assigneeEmail?.[0] || 'U').toUpperCase()}
                                </div>
                                {selectedTask.assigneeEmail || "Unassigned"}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="border-t border-slate-700 pt-6">
                            <h3 className="text-lg font-bold text-white mb-4">Comments ({selectedTask.comments?.length || 0})</h3>

                            {/* Comment List */}
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                                {selectedTask.comments?.map((comment: any) => (
                                    <div key={comment.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-indigo-300">{comment.authorEmail}</span>
                                            <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-300">{comment.content}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Add Comment */}
                            <form onSubmit={handleAddComment} className="space-y-3">
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                                />
                                <input
                                    type="email"
                                    value={commentEmail}
                                    onChange={(e) => setCommentEmail(e.target.value)}
                                    placeholder="Your email (temporary auth)"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!commentContent.trim() || !commentEmail.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Post Comment
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                <select
                                    value={newTaskStatus}
                                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
