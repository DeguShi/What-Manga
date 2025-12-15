// List of email addresses with write (admin) access
// All other authenticated users get read-only access
// Configure via ADMIN_EMAILS environment variable (comma-separated)

const envEmails = process.env.ADMIN_EMAILS || '';
export const ADMIN_EMAILS: string[] = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
}
