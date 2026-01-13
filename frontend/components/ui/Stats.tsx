interface StatCardProps {
    label: string;
    value: number | string;
    color?: "indigo" | "green" | "yellow" | "red" | "blue";
    icon?: React.ReactNode;
}

export function StatCard({ label, value, color = "indigo", icon }: StatCardProps) {
    const colorClasses = {
        indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
        green: "from-green-500/20 to-green-600/10 border-green-500/30",
        yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
        red: "from-red-500/20 to-red-600/10 border-red-500/30",
        blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    };

    const textColors = {
        indigo: "text-indigo-400",
        green: "text-green-400",
        yellow: "text-yellow-400",
        red: "text-red-400",
        blue: "text-blue-400",
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
                </div>
                {icon && <div className={`${textColors[color]} text-2xl`}>{icon}</div>}
            </div>
        </div>
    );
}

interface ProgressBarProps {
    percentage: number;
    label?: string;
}

export function ProgressBar({ percentage, label }: ProgressBarProps) {
    const color = percentage >= 75 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-indigo-500";

    return (
        <div>
            {label && (
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300">{percentage.toFixed(0)}%</span>
                </div>
            )}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}
