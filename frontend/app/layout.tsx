import { ApolloWrapper } from "@/lib/apollo-provider";
import "./globals.css";

export const metadata = {
  title: "Project Management System",
  description: "Manage projects, tasks, and teams efficiently.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-50 min-h-screen">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
