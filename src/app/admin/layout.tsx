import { AdminSidebar } from "@/components/admin-sidebar";
import { LogoutButton } from "@/components/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-white">
      <div className="flex min-h-dvh w-full">
        <AdminSidebar />
        <section className="w-full px-5 py-6 md:px-10 lg:px-12">
          <div className="mb-5 flex items-center justify-between rounded-[16px] border border-[var(--hair)] bg-white p-3 shadow-sm md:hidden">
            <div>
              <p className="text-sm font-semibold">Phero</p>
              <p className="text-xs font-medium text-neutral-500">Admin da plataforma</p>
            </div>
            <LogoutButton variant="light" />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
