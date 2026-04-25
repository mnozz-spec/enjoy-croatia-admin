'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  dot?: string;
}

const EDITOR_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/articles', label: 'Articles' },
  { href: '/images', label: 'Images' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/health', label: 'Health' },
];

const CONTRIBUTOR_NAV: NavItem[] = [
  { href: '/upload', label: 'Upload Images' },
];

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === 'editor' ? EDITOR_NAV : CONTRIBUTOR_NAV;

  async function handleSignOut() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gray-900 rounded-md shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">Enjoy Croatia</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
