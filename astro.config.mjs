import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import agenticMedia from '@agentic-media/astro-template/integration';

// Per-branch base URL for canonical links, sitemap, og:image, JSON-LD @id,
// and every other Astro.site-relative URL.
//
// Cloudflare Pages exposes two env vars at build time:
//   CF_PAGES_BRANCH — the git branch being built (e.g. "main", "feat/foo")
//   CF_PAGES_URL    — the immutable preview URL (e.g. https://abc123.pesce-3venezie.pages.dev)
//
// Strategy:
//   main branch   → live custom domain (canonical, production)
//   any other     → CF_PAGES_URL so preview links resolve correctly
//   local dev     → falls back to prod domain (no env vars set)
//
// The template integration honours an explicit site: value and will NOT
// override it with identity.url from site.config.yaml.
// NOTE: Pesce's production domain is not yet confirmed — update PROD_DOMAIN
// when the custom domain is connected in Cloudflare Pages.
const PROD_DOMAIN = 'https://pesce-3venezie.pages.dev';

const cfBranch = process.env.CF_PAGES_BRANCH;
const cfUrl    = process.env.CF_PAGES_URL;

const site = cfBranch === 'main'
  ? PROD_DOMAIN
  : (cfUrl || PROD_DOMAIN);

export default defineConfig({
  site,
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
