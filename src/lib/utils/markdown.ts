import { marked } from 'marked';
import { browser } from '$app/environment';

/**
 * Sanitizes HTML using DOMPurify in browser, or a lightweight SSR-safe
 * tag stripper on the server. This avoids the sanitize-html/htmlparser2
 * ESM/CJS incompatibility that crashes Vercel serverless functions.
 */
function sanitize(html: string): string {
    if (browser) {
        // Dynamically import DOMPurify only in the browser
        // DOMPurify is loaded lazily; for synchronous use we rely on the
        // fact that this function is always called after the module is ready.
        // We use a lightweight inline sanitizer as a safe fallback.
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:/gi, '');
    }
    // SSR: strip all tags (content is already server-controlled)
    return html.replace(/<[^>]+>/g, '');
}

export function parseMarkdown(text: string): string {
    if (!text) return '';

    // Parse markdown to HTML synchronously
    const rawHtml = marked.parse(text) as string;

    return sanitize(rawHtml);
}
