import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Use the Edge-compatible config (without Prisma adapter)
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
