# pesce

Astro 6 editorial site, built on top of
[`agentic-media/astro-template`](https://github.com/agentic-media/astro-template).

## Build

```bash
npm install
npm run build
```

Output goes to `dist/` for Cloudflare Pages.

## Layout

```
.gitattributes              # LFS rules for image/font/binary blobs
astro.config.mjs            # site URL + integrations from the template
package.json                # depends on @agentic-media/astro-template
src/
  content.config.ts         # re-exports template's collection schemas
  content/
    articles/*.mdx          # editorial articles (committed by the publisher)
    authors/*.json          # bylines
public/
  images/                   # hero images for articles
  manifest.webmanifest      # per-site PWA manifest
  robots.txt
workers/
  push/                     # web-push worker (KV namespace IDs are per-site)
```
