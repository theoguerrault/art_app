import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function parseMarkdown(text: string): string {
    if (!text) return '';
    
    // Parse markdown to HTML synchronously
    const rawHtml = marked.parse(text) as string;
    
    // Sanitize the HTML to prevent XSS
    return sanitizeHtml(rawHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'img': ['src', 'alt', 'title']
        }
    });
}
