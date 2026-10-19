"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth-guard";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { LiveToasts } from "@/components/live-toasts";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AdminSidebar>
          <div className="min-h-screen bg-muted/40">
            <div className="rail pl-0 transition-[padding] duration-200 md:pl-64 collapsed:md:pl-[72px]">
              <AdminHeader />
              <main className="mx-auto max-w-[1400px] p-4 md:p-6 lg:p-8">{children}</main>
            </div>
          </div>
          <LiveToasts />
        </AdminSidebar>
      </AuthGuard>
    </AuthProvider>
  );
}
