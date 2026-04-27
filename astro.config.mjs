import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://example.com';

// Per-site overrides; the template provides the routing/components/styles.
export default defineConfig({
  site: SITE,
  integrations: [
    mdx(),
    sitemap({
      // Drop multi-page article shards (/foo/bar/2/, /3/, ...) so only the
      // canonical page-1 URL is in the sitemap. rel=prev/next on the article
      // pages still links the others for search engines.
      filter: (page) => !/\/\d+\/?$/.test(new URL(page).pathname.replace(/\/$/, '')),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  build: { format: 'directory' },
  trailingSlash: 'always',
});
