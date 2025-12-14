import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'What-Manga Tracker',
    description: 'Personal manga and light novel tracking application',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen bg-background`}>
                <div className="relative flex min-h-screen flex-col">
                    <main className="flex-1">{children}</main>
                </div>
                <Toaster />
            </body>
        </html>
    );
}
