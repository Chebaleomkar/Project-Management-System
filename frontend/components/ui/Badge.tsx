interface BadgeProps {
    variant: "todo" | "in_progress" | "done" | "active" | "completed" | "on_hold" | "overdue";
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant, children, className = "" }: BadgeProps) {
    const variants = {
        todo: "bg-gray-600/50 text-gray-300 border-gray-500/30",
        in_progress: "bg-blue-600/30 text-blue-300 border-blue-500/30",
        done: "bg-green-600/30 text-green-300 border-green-500/30",
        active: "bg-indigo-600/30 text-indigo-300 border-indigo-500/30",
        completed: "bg-green-600/30 text-green-300 border-green-500/30",
        on_hold: "bg-yellow-600/30 text-yellow-300 border-yellow-500/30",
        overdue: "bg-red-600/30 text-red-300 border-red-500/30",
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}

export function getStatusBadgeVariant(status: string): BadgeProps["variant"] {
    const statusMap: Record<string, BadgeProps["variant"]> = {
        TODO: "todo",
        IN_PROGRESS: "in_progress",
        DONE: "done",
        ACTIVE: "active",
        COMPLETED: "completed",
        ON_HOLD: "on_hold",
    };
    return statusMap[status] || "todo";
}
