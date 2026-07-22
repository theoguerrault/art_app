import { marked } from 'marked';

export function parseMarkdown(text: string): string {
    if (!text) return '';
    
    // Parse markdown to HTML synchronously
    // marked.parse returns a string when not using async options
    return marked.parse(text) as string;
}
