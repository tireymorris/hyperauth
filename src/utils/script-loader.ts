import { raw } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';

export function createRawInlineScript(id: string, content: string): HtmlEscapedString {
  return raw(`<script id="${id}">${content}</script>`);
}
