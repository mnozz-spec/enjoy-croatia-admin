import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/types';
import Sidebar from '@/components/Sidebar';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={session.role!} />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
