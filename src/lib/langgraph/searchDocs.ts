import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LocalIndex } from 'vectra';

const apiKey = process.env.GEMINI_API_KEY;
const embeddingModel = 'text-embedding-004';

export type DocSource = {
  url: string;
  title?: string;
  score: number;
};

export type SearchResult = {
  snippets: Array<{ url: string; title?: string; text: string; score: number }>;
  sources: DocSource[];
};

type LanggraphDocChunkMetadata = {
  url: string;
  title?: string;
  chunkIndex: number;
  text: string;
};

export async function searchDocs(query: string, opts?: { topK?: number }): Promise<SearchResult> {
  const topK = opts?.topK ?? 10;

  const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: embeddingModel });

  const [queryVector] = await embeddings.embedDocuments([query]);
  const vectraDir = path.join(process.cwd(), 'data', 'langgraph-js-docs', 'vectra-index');
  if (!fs.existsSync(vectraDir)) {
    throw new Error(`Missing Vectra index at ${vectraDir}. Run: pnpm index:langgraph (with GEMINI_API_KEY set).`);
  }

  const index = new LocalIndex<LanggraphDocChunkMetadata>(vectraDir);
  if (!(await index.isIndexCreated())) {
    throw new Error(`Vectra index not created at ${vectraDir}. Run: pnpm index:langgraph to create it.`);
  }

  const results = await index.queryItems(queryVector ?? [], query, topK);

  const snippets = results.map((r) => ({
    url: r.item.metadata.url,
    title: r.item.metadata.title,
    text: r.item.metadata.text,
    score: r.score,
  }));

  // Unique sources by URL, keep max score.
  const byUrl = new Map<string, DocSource>();
  for (const s of snippets) {
    const existing = byUrl.get(s.url);
    if (!existing || s.score > existing.score) {
      byUrl.set(s.url, { url: s.url, title: s.title, score: s.score });
    }
  }

  const sources = Array.from(byUrl.values()).sort((a, b) => b.score - a.score);

  return { snippets, sources };
}
