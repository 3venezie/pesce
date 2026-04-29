#!/usr/bin/env node
// Walk every article in src/content/articles/**/*.mdx, collect every
// source URL (from the flat `sources:` block) and every `cited_sources`
// source_id (from the structured block, when present), look them up in
// the lordship's mongo `sources` collection, and write a deterministic
// cache to src/data/sources-cache.json. The cache is committed to the
// repo so CF Pages builds (which can't reach the tailnet) build
// reproducibly against frozen content.
//
// Cache shape mirrors what scripts/fetch-sources.mjs has produced
// since the OG cache landed: a flat dict keyed on `sha1(url)[:16]`,
// with `source_id` (mongo ObjectId hex) added so the template's
// `virtual:agentic-media/sources-cache` builds the bySourceId index.
//
// Connection: `LORDSHIP_MONGO_URI` env. **No-op when absent** — that
// way CF Pages installs run the `prebuild` step and exit cleanly,
// building against whatever cache the publisher last committed.
//
// Run from the consumer site root:
//   node scripts/prebuild-sources.mjs
//   LORDSHIP_MONGO_URI=mongodb://... node scripts/prebuild-sources.mjs
//
// Tailnet caveat (memory: tailnet_pymongo_bulk_writes.md):
// pymongo from overlord → lordship-mongo over tailscale hangs after
// ~10 sequential calls. The mongodb node driver behaves similarly.
// This script issues exactly ONE find() with `$in` for URLs and one
// for ObjectIds, then closes the connection.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ARTICLES_DIR = 'src/content/articles';
const CACHE_PATH = 'src/data/sources-cache.json';

function urlKey(url) {
  return createHash('sha1').update(url).digest('hex').slice(0, 16);
}

function collectFromArticles() {
  const urls = new Set();
  const sourceIds = new Set();
  let entries;
  try {
    entries = readdirSync(ARTICLES_DIR, { withFileTypes: true });
  } catch {
    return { urls, sourceIds };
  }
  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith('.mdx')) continue;
    const raw = readFileSync(join(ARTICLES_DIR, ent.name), 'utf8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    // Flat sources block
    const sBlock = fm.match(/^sources:\n((?:\s+- url:.*\n?(?:\s+\w+:.*\n?)*)+)/m);
    if (sBlock) {
      for (const line of sBlock[1].split('\n')) {
        const u = line.match(/^\s+- url:\s*"?([^"\n]+?)"?\s*$/);
        if (u) urls.add(u[1].trim());
      }
    }
    // cited_sources block (optional; populated by future wp-json-sync runs)
    const cBlock = fm.match(/^cited_sources:\n((?:\s+- source_id:.*\n?(?:\s+\w+:.*\n?)*)+)/m);
    if (cBlock) {
      for (const line of cBlock[1].split('\n')) {
        const m = line.match(/^\s+- source_id:\s*"?([0-9a-fA-F]{24})"?\s*$/);
        if (m) sourceIds.add(m[1]);
      }
    }
  }
  return { urls, sourceIds };
}

function entryFromMongoDoc(src) {
  const status = typeof src.http_status === 'number' ? src.http_status : null;
  const ok = status !== null && status >= 200 && status < 400;
  const fetchedAt =
    src.last_fetched_at instanceof Date
      ? src.last_fetched_at.toISOString()
      : src.last_fetched_at ?? null;
  return {
    url: src.url,
    ok,
    title: src.og?.title ?? null,
    description: src.og?.description ?? null,
    image: src.og?.image ?? null,
    siteName: src.og?.site_name ?? null,
    fetchedAt,
    source_id: src._id?.toString?.() ?? null,
    error: ok ? undefined : src.last_fetch_error ?? `HTTP ${status ?? '?'}`,
  };
}

async function main() {
  const uri = process.env.LORDSHIP_MONGO_URI;
  const dbName = process.env.LORDSHIP_MONGO_DB || 'agentic_media_lordship';

  const { urls, sourceIds } = collectFromArticles();
  console.log(`articles: ${urls.size} unique source URLs, ${sourceIds.size} cited source_ids`);

  if (!uri) {
    // CF Pages / local-dev path: no mongo reachable. Don't fail; let
    // the build use whatever cache the publisher last committed.
    console.log('LORDSHIP_MONGO_URI not set — skipping mongo fetch (using committed cache)');
    return;
  }

  let mongodb;
  try {
    mongodb = await import('mongodb');
  } catch (e) {
    console.error('mongodb driver not installed; run `npm install mongodb`');
    process.exit(1);
  }
  const { MongoClient, ObjectId } = mongodb;

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });
  let cache = {};
  try {
    await client.connect();
    const sources = client.db(dbName).collection('sources');

    // ONE bulk find for URLs (tailnet gotcha: many sequential calls hang).
    const urlList = [...urls];
    if (urlList.length > 0) {
      const cur = sources.find({ url: { $in: urlList } });
      for await (const doc of cur) {
        cache[urlKey(doc.url)] = entryFromMongoDoc(doc);
      }
    }

    // Sweep any cited source_ids that didn't come back via URL match
    // (e.g. an article cites a source the publisher already moved or
    // the URL canonicaliser massaged). One more bulk find.
    const missingIds = [...sourceIds].filter((sid) => {
      for (const e of Object.values(cache)) {
        if (e.source_id === sid) return false;
      }
      return true;
    });
    if (missingIds.length > 0) {
      const objIds = missingIds.map((sid) => new ObjectId(sid));
      const cur = sources.find({ _id: { $in: objIds } });
      for await (const doc of cur) {
        cache[urlKey(doc.url)] = entryFromMongoDoc(doc);
      }
    }
  } catch (err) {
    console.error('mongo fetch failed:', err?.message || err);
    console.error('keeping previously-committed cache (no overwrite)');
    process.exit(2);
  } finally {
    await client.close().catch(() => {});
  }

  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
  const ok = Object.values(cache).filter((e) => e.ok).length;
  console.log(`wrote ${CACHE_PATH} — ${Object.keys(cache).length} entries (${ok} ok)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
