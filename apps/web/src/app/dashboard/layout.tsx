import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen bg-gray-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
