"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const organizationSlug = params.slug as string;

    const links = [
        { href: `/org/${organizationSlug}`, label: "Overview", exact: true },
        { href: `/org/${organizationSlug}/projects`, label: "Projects" },
        { href: `/org/${organizationSlug}/tasks`, label: "My Tasks" },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        PMS
                    </Link>
                    <div className="mt-2 text-xs text-slate-400 uppercase tracking-wider">
                        {organizationSlug}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {links.map((link) => {
                        const isActive = link.exact
                            ? pathname === link.href
                            : pathname.startsWith(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                        : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <Link
                        href="/"
                        className="block text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Change Organization
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-900">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
