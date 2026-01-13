"use client";

import { useQuery } from "@apollo/client/react";
import { GET_ALL_ORGANIZATIONS } from "@/lib/graphql/queries";
import Link from "next/link";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorMessage } from "@/components/ui/Error";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  const { data, loading, error } = useQuery<any>(GET_ALL_ORGANIZATIONS);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Project Management System
          </h1>
          <p className="text-xl text-slate-400">
            Select an organization to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.allOrganizations.map((org: any) => (
            <Link
              key={org.id}
              href={`/org/${org.slug}`}
              className="group bg-slate-800/50 backdrop-blur border border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 transition-all hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  {org.name[0]}
                </div>
                <Badge variant="active">{org.stats.activeProjects} Projects</Badge>
              </div>

              <h2 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-white">
                {org.name}
              </h2>
              <p className="text-slate-400 text-sm mb-4 truncate text-ellipsis">
                {org.contactEmail}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-700/50 pt-4">
                <div>
                  <span className="block text-white font-medium">{org.stats.totalTasks}</span>
                  Tasks
                </div>
                <div className="text-right">
                  <span className="block text-green-400 font-medium">{org.stats.completedProjects}</span>
                  Completed
                </div>
              </div>
            </Link>
          ))}

          {/* Create New Org Card Placeholder */}
          <button className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition-colors h-full min-h-[200px]">
            <span className="text-3xl mb-2">+</span>
            <span className="font-medium">Create Organization</span>
          </button>
        </div>
      </div>
    </div>
  );
}
