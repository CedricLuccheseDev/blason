import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '~/lib/site'

// Everyone may read, the AI crawlers by name; the sitemap is a real
// directive, not a comment.
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            'User-agent: *',
            'Allow: /',
            'User-agent: ClaudeBot',
            'Allow: /',
            'User-agent: GPTBot',
            'Allow: /',
            'User-agent: PerplexityBot',
            'Allow: /',
            `Sitemap: ${SITE_URL}/sitemap.xml`,
            '',
          ].join('\n'),
          { headers: { 'content-type': 'text/plain; charset=utf-8' } },
        ),
    },
  },
})
