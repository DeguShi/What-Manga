import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

// Edge-compatible auth config (no database adapter)
// Used by middleware which runs on Edge runtime
export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
            const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');

            // Debug logging
            console.log('[Middleware Auth]', {
                path: request.nextUrl.pathname,
                isLoggedIn,
                user: auth?.user?.email || 'none',
            });

            // Always allow API auth routes
            if (isApiAuth) return true;

            // Allow auth pages for everyone (login page)
            if (isAuthPage) return true;

            // Block unauthenticated users from other routes
            return isLoggedIn;
        },
    },
} satisfies NextAuthConfig;
