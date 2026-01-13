export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    return (
        <div className="flex items-center justify-center p-4">
            <div
                className={`${sizeClasses[size]} border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin`}
            />
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/4" />
        </div>
    );
}

export function LoadingPage() {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 mt-4">Loading...</p>
            </div>
        </div>
    );
}
