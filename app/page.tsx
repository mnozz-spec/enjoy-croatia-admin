import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/types';

export default async function HomePage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn) redirect('/login');
  if (session.role === 'contributor') redirect('/upload');
  redirect('/dashboard');
}
