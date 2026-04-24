import type { SessionOptions } from 'iron-session';
import type { SessionData } from './types';

export type { SessionData };

export const sessionOptions: SessionOptions = {
  cookieName: 'enjoy-croatia-admin',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
