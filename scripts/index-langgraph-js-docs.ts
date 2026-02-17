import * as fs from 'node:fs';
import * as path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import type { Document } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import Sitemapper from 'sitemapper';
import { LocalIndex } from 'vectra';

const SITEMAP_URL = 'https://docs.langchain.com/sitemap.xml';
const URL_PREFIX = 'https://docs.langchain.com/oss/javascript/langgraph/';

const OUT_DIR = path.join(process.cwd(), 'data', 'langgraph-js-docs');
const OUT_VECTRA_DIR = path.join(OUT_DIR, 'vectra-index');
const OUT_MANIFEST_JSON = path.join(OUT_DIR, 'manifest.json');

type Manifest = {
  createdAt: string;
  sourceSite: string;
  sitemapUrl: string;
  urlPrefix: string;
  pageLimit: number;
  selectedPageCount: number;
  embeddingModel: string;
  chunkCount: number;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'langgraph-rag-indexer/0.1',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function extractPage(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr('content')?.trim() ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    '';

  const container = $('#content-container');
  const text = (container.length ? container.text() : '').replace(/\s+/g, ' ').trim();

  return { title, text };
}

async function getSitemapUrls(): Promise<string[]> {
  const mapper = new Sitemapper({ url: SITEMAP_URL, timeout: 30_000 });
  const { sites } = (await mapper.fetch()) as { sites: string[] };

  const filtered = sites.map(normalizeUrl).filter((u: string) => u.startsWith(URL_PREFIX));
  return Array.from(new Set(filtered));
}

async function main() {
  const apiKey = requiredEnv('GEMINI_API_KEY');

  const pageLimit = Number(process.env.PAGE_LIMIT ?? '50');
  const concurrency = Number(process.env.CONCURRENCY ?? '3');
  const requestDelayMs = Number(process.env.REQUEST_DELAY_MS ?? '150');

  const chunkSize = Number(process.env.CHUNK_SIZE ?? '1400');
  const chunkOverlap = Number(process.env.CHUNK_OVERLAP ?? '200');

  const embeddingModel = process.env.EMBEDDING_MODEL ?? 'text-embedding-004';

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const urls = await getSitemapUrls();
  const selected = urls.slice(0, pageLimit);

  // Overwrite previous index.
  fs.rmSync(OUT_VECTRA_DIR, { recursive: true, force: true });

  const index = new LocalIndex(OUT_VECTRA_DIR);
  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: embeddingModel,
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  const limit = pLimit(concurrency);
  let chunkCount = 0;

  console.log(`Sitemap URLs (filtered): ${urls.length}`);
  console.log(`Indexing pages: ${selected.length}`);
  console.log(`Output: ${OUT_VECTRA_DIR}`);

  const tasks = selected.map((url) =>
    limit(async () => {
      await sleep(requestDelayMs);

      const html = await fetchText(url);
      const { title, text } = extractPage(html);
      if (!text) return;

      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (!cleaned) return;

      const docs: Document[] = await splitter.createDocuments([cleaned]);
      const chunks = docs.map((d) => d.pageContent).filter((c) => c.trim().length > 0);
      if (!chunks.length) return;

      const vectors = await embeddings.embedDocuments(chunks);

      for (let i = 0; i < chunks.length; i++) {
        await index.insertItem({
          vector: vectors[i] ?? [],
          metadata: {
            url,
            title,
            chunkIndex: i,
            text: chunks[i],
          },
        });
      }
      chunkCount += chunks.length;

      console.log(`Indexed ${url} (chunks: ${chunks.length})`);
    }),
  );

  await Promise.all(tasks);

  const manifest: Manifest = {
    createdAt: new Date().toISOString(),
    sourceSite: 'https://docs.langchain.com',
    sitemapUrl: SITEMAP_URL,
    urlPrefix: URL_PREFIX,
    pageLimit,
    selectedPageCount: selected.length,
    embeddingModel,
    chunkCount,
  };

  fs.writeFileSync(OUT_MANIFEST_JSON, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('\nDone. Wrote:');
  console.log(`- ${OUT_VECTRA_DIR}`);
  console.log(`- ${OUT_MANIFEST_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
