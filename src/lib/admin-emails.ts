// List of email addresses with write (admin) access
// All other authenticated users get read-only access
// Configure via ADMIN_EMAILS environment variable (comma-separated)

const envAdminEmails = process.env.ADMIN_EMAILS || '';
export const ADMIN_EMAILS: string[] = envAdminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// Viewer emails - can view admin's list but not edit
// Configure via VIEWER_EMAILS environment variable (comma-separated)
const envViewerEmails = process.env.VIEWER_EMAILS || '';
export const VIEWER_EMAILS: string[] = envViewerEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function isViewer(email: string | null | undefined): boolean {
    if (!email) return false;
    return VIEWER_EMAILS.includes(email.toLowerCase());
}

// Get the first admin's email (for viewer access)
export function getFirstAdminEmail(): string | null {
    return ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS[0] : null;
}
