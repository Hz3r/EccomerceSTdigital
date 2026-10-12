"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth-guard";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AdminSidebar>
          <div className="min-h-screen bg-slate-50">
            <div className="pl-0 md:pl-64">
              <AdminHeader />
              <main className="p-4 md:p-6">{children}</main>
            </div>
          </div>
        </AdminSidebar>
      </AuthGuard>
    </AuthProvider>
  );
}
