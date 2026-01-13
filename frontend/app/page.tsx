"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ALL_ORGANIZATIONS, GET_ALL_ORGANIZATIONS as REFETCH_QUERY } from "@/lib/graphql/queries";
import { CREATE_ORGANIZATION } from "@/lib/graphql/mutations";
import Link from "next/link";
import { useState } from "react";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorMessage } from "@/components/ui/Error";
import { Badge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery<any>(GET_ALL_ORGANIZATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "", contactEmail: "" });

  const [createOrganization, { loading: createLoading }] = useMutation<any>(CREATE_ORGANIZATION, {
    onCompleted: async (data) => {
      if (data.createOrganization.success) {
        setIsModalOpen(false);
        setFormData({ name: "", slug: "", contactEmail: "" });
        await refetch();
        router.refresh();
      }
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.contactEmail) return;

    await createOrganization({
      variables: formData,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setFormData({ ...formData, name, slug });
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden p-4">


      <div className="max-w-6xl w-full z-10">
        <div className="text-center mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-4 hover:bg-indigo-500/20 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Manage your work with elegance
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Project Management
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Reimagined.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Streamline your team's workflow with a powerful, intuitive, and beautiful interface.
            Select an organization below to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Create New Org Card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 transition-all duration-300 h-full min-h-[280px] bg-slate-900/20 hover:bg-slate-800/60 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-20 h-20 rounded-2xl bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xl">
              <span className="text-4xl font-light text-slate-400 group-hover:text-indigo-400 transition-colors">+</span>
            </div>
            <span className="font-medium text-lg relative z-10">Create New Organization</span>
            <span className="text-sm text-slate-600 mt-2 relative z-10">Start a new workspace</span>
          </button>

          {data?.allOrganizations?.slice().reverse().map((org: any) => (
            <Link
              key={org.id}
              href={`/org/${org.slug}`}
              className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 hover:border-indigo-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-bold text-2xl group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300 shadow-inner border border-white/10 group-hover:scale-110 group-hover:shadow-indigo-500/25">
                  {org.name[0]}
                </div>
                <Badge variant="active" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-3 py-1">
                  {org.stats.activeProjects} Active
                </Badge>
              </div>

              <h2 className="text-2xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors relative">
                {org.name}
              </h2>

              <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-400 text-sm truncate max-w-[200px]">
                  {org.contactEmail}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-700/50 pt-6 mt-auto">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1.5">Total Tasks</span>
                  <span className="text-2xl text-slate-200 font-medium font-sans group-hover:text-white transition-colors">
                    {org.stats.totalTasks}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1.5">Completed</span>
                  <span className="text-2xl text-emerald-400 font-medium font-sans">
                    {org.stats.completedProjects}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
            {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <h2 className="text-2xl font-bold text-white mb-2">Create Organization</h2>
            <p className="text-slate-400 mb-6 text-sm">Set up a new workspace for your team.</p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="e.g. Acme Corp"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Slug URL</label>
                <div className="flex items-center">
                  <span className="bg-slate-800 border border-r-0 border-slate-700 text-slate-500 px-3 py-3 rounded-l-lg text-sm select-none">
                    /org/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-r-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-mono placeholder:text-slate-600"
                    placeholder="acme-corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !formData.name || !formData.slug || !formData.contactEmail}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  {createLoading ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
