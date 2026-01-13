"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECTS_BY_ORGANIZATION, GET_PROJECTS_BY_ORGANIZATION as REFETCH_QUERY } from "@/lib/graphql/queries";
import { CREATE_PROJECT } from "@/lib/graphql/mutations";
import { use, useState, useEffect } from "react";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorMessage, EmptyState } from "@/components/ui/Error";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Stats";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const [slug, setSlug] = useState<string>("");
    const router = useRouter();

    // Create Project State
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    useEffect(() => {
        setSlug(resolvedParams.slug);
    }, [resolvedParams]);

    const { data, loading, error } = useQuery<any>(GET_PROJECTS_BY_ORGANIZATION, {
        variables: { organizationSlug: slug },
        skip: !slug,
    });

    const [createProject, { loading: createLoading }] = useMutation<any>(CREATE_PROJECT, {
        onCompleted: (data) => {
            if (data.createProject.success) {
                setIsCreating(false);
                setNewProjectName("");
                // Optimistic update handled by cache or refetch
                router.refresh();
            }
        },
        refetchQueries: [{ query: REFETCH_QUERY, variables: { organizationSlug: slug } }],
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        await createProject({
            variables: {
                organizationSlug: slug,
                name: newProjectName,
                status: "ACTIVE",
            },
        });
    };

    if (!slug || loading) return <LoadingPage />;
    if (error) return <ErrorMessage message={error.message} />;

    const projects = data?.projectsByOrganization || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
                    <p className="text-slate-400">Manage your projects ({projects.length})</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    + New Project
                </button>
            </div>

            {isCreating && (
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreate} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Project Name</label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="e.g. Website Redesign"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                disabled={createLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading || !newProjectName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                {createLoading ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {projects.length === 0 && !isCreating ? (
                <EmptyState
                    title="No projects yet"
                    message="Get started by creating your first project."
                    action={
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                            Create Project
                        </button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                        <Link
                            key={project.id}
                            href={`/org/${slug}/projects/${project.id}`}
                            className="group bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:-translate-y-1 block"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate pr-2">
                                    {project.name}
                                </h3>
                                <Badge variant={project.status.toLowerCase()}>{project.status}</Badge>
                            </div>

                            <div className="mb-4">
                                <ProgressBar
                                    percentage={project.stats.completionPercentage}
                                    label="Progress"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                                <div className="bg-slate-900/50 rounded py-1">
                                    <span className="block text-slate-300 font-bold text-sm">{project.stats.todoTasks}</span>
                                    Todo
                                </div>
                                <div className="bg-slate-900/50 rounded py-1">
                                    <span className="block text-yellow-500 font-bold text-sm">{project.stats.inProgressTasks}</span>
                                    In Progress
                                </div>
                                <div className="bg-slate-900/50 rounded py-1">
                                    <span className="block text-green-500 font-bold text-sm">{project.stats.completedTasks}</span>
                                    Done
                                </div>
                            </div>

                            {project.stats.overdueTasks > 0 && (
                                <div className="mt-3 text-xs text-red-400 flex items-center gap-1">
                                    <span>⚠️</span> {project.stats.overdueTasks} overdue tasks
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
