import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://pesce.pages.dev',
  integrations: [mdx(), sitemap()],
  build: { format: 'directory' },
  trailingSlash: 'always',
});
