"use client";

import { useQuery } from "@apollo/client/react";
import { GET_ORGANIZATION, GET_OVERDUE_TASKS } from "@/lib/graphql/queries";
import { use, useEffect, useState } from "react";
import { StatCard } from "@/components/ui/Stats";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorMessage } from "@/components/ui/Error";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default function OrganizationDashboard({ params }: { params: Promise<{ slug: string }> }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const [slug, setSlug] = useState<string>("");

    useEffect(() => {
        setSlug(resolvedParams.slug);
    }, [resolvedParams]);

    const { data: orgData, loading: orgLoading, error: orgError } = useQuery<any>(GET_ORGANIZATION, {
        variables: { slug },
        skip: !slug,
    });

    const { data: overdueData, loading: overdueLoading } = useQuery<any>(GET_OVERDUE_TASKS, {
        variables: { organizationSlug: slug },
        skip: !slug,
    });

    if (!slug || orgLoading) return <LoadingPage />;
    if (orgError) return <ErrorMessage message={orgError.message} />;

    const org = orgData?.organization;
    const overdueTasks = overdueData?.overdueTasks || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Overview for {org.name}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Projects"
                    value={org.stats.totalProjects}
                    color="indigo"
                    icon="📁"
                />
                <StatCard
                    label="Active Projects"
                    value={org.stats.activeProjects}
                    color="green"
                    icon="⚡"
                />
                <StatCard
                    label="Completed Tasks"
                    value={org.stats.completedTasks}
                    color="blue"
                    icon="✅"
                />
                <StatCard
                    label="Overdue Tasks"
                    value={overdueTasks.length}
                    color="red"
                    icon="⚠️"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Overdue Tasks Panel */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Attention Needed</h2>
                    {overdueTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No overdue tasks! 🎉
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {overdueTasks.slice(0, 5).map((task: any) => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                                    <div>
                                        <div className="font-medium text-slate-200">{task.title}</div>
                                        <div className="text-xs text-slate-500">
                                            Project: {task.project.name}
                                        </div>
                                    </div>
                                    <div className="text-xs text-red-400 font-medium">
                                        Due {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {overdueTasks.length > 5 && (
                                <div className="text-center pt-2">
                                    <Link href={`/org/${slug}/tasks?filter=overdue`} className="text-sm text-indigo-400 hover:text-indigo-300">
                                        View all {overdueTasks.length} overdue tasks
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href={`/org/${slug}/projects`}
                            className="p-4 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 rounded-lg text-center transition-colors group"
                        >
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🚀</div>
                            <div className="font-medium text-indigo-300">New Project</div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
