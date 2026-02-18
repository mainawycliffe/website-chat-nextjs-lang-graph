import { searchDocs } from '@/lib/langgraph/searchDocs';
import { tool } from '@langchain/core/tools';
import type { JSONSchema } from '@langchain/core/utils/json_schema';

export const searchSchema: JSONSchema = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Search query' },
  },
  required: ['query'],
  additionalProperties: false,
};

export const searchTool = tool<JSONSchema, unknown, unknown, string>(
  async (input) => {
    const rec = input && typeof input === 'object' ? (input as Record<string, unknown>) : null;
    const query = rec && typeof rec.query === 'string' ? rec.query : '';
    if (!query) throw new Error('Missing required field: query');

    const result = await searchDocs(query, { topK: 6 });

    // Provide structured snippets so the model can use them without echoing a giant "CONTEXT" block.
    const snippets = result.snippets.map((s) => ({
      url: s.url,
      title: s.title,
      score: s.score,
      text: s.text,
    }));

    return JSON.stringify({ snippets, sources: result.sources });
  },
  {
    name: 'search_langgraph_docs',
    description:
      'Search the LangGraph JavaScript docs and return relevant snippets (for internal grounding) plus source URLs.',
    schema: searchSchema,
  },
);
