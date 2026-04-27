import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import agenticMedia from '@agentic-media/astro-template/integration';

// Template integration loads ./site.config.yaml and propagates
// `identity.url` into Astro.site automatically. Don't repeat `site:`
// here.
export default defineConfig({
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
