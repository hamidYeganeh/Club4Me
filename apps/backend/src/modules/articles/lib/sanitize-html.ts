const SCRIPT_OR_STYLE =
  /<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const SELF_CLOSING_DANGEROUS =
  /<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi;
const EVENT_HANDLERS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi;

export function sanitizeHtml(input: string): string {
  return input
    .replace(SCRIPT_OR_STYLE, "")
    .replace(SELF_CLOSING_DANGEROUS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(JS_URLS, '$1=""');
}
