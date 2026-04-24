import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  let role: SessionData['role'] | null = null;

  if (password === process.env.EDITOR_PASSWORD) {
    role = 'editor';
  } else if (password === process.env.CONTRIBUTOR_PASSWORD) {
    role = 'contributor';
  }

  if (!role) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.isLoggedIn = true;
  session.role = role;
  await session.save();

  return NextResponse.json({ role });
}

export async function DELETE() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
  return NextResponse.json({ ok: true });
}
