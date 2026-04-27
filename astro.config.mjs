import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import agenticMedia from '@agentic-media/astro-template/integration';

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://example.com';

export default defineConfig({
  site: SITE,
  integrations: [
    agenticMedia(),
    mdx(),
    sitemap({
      filter: (page) => !/\/\d+\/?$/.test(new URL(page).pathname.replace(/\/$/, '')),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  build: { format: 'directory' },
  trailingSlash: 'always',
});
