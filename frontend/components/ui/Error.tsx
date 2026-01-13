interface ErrorMessageProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export function ErrorMessage({ title = "Error", message, onRetry }: ErrorMessageProps) {
    return (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
            <div className="text-red-400 text-lg font-semibold mb-2">{title}</div>
            <p className="text-red-300/80 mb-4">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            <div className="text-gray-400 text-lg font-medium mb-2">{title}</div>
            <p className="text-gray-500 mb-4">{message}</p>
            {action}
        </div>
    );
}
