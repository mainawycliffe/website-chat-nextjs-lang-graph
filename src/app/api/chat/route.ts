import { buildInitialState, createDocsAgent } from '@/lib/langgraph/docsAgent';
import { isAIMessage, isAIMessageChunk } from '@langchain/core/messages';

type StreamBody = {
  // `FetchStreamTransport` posts `{ input, context, command }`.
  input?: { messages?: Array<{ type?: string; content?: unknown }> } | null;
};

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function createIds() {
  const runId =
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return { runId, threadId: runId };
}

function pickUserText(body: StreamBody | null): string {
  const msgs = body?.input?.messages;
  if (!Array.isArray(msgs)) return '';

  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (!m || typeof m !== 'object') continue;
    if (m.type !== 'human') continue;
    if (typeof m.content === 'string' && m.content.trim()) return m.content.trim();
  }

  return '';
}

// The model may return messages in chunks, where each chunk has a partial text
// delta. This function extracts the text content from a chunk or a full
// message, handling various content formats (string, array of strings/objects
// with `text`).
function extractTokenText(token: unknown): string {
  if (!token || typeof token !== 'object') return '';
  const rec = token as Record<string, unknown>;
  const content = rec.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const p = part as Record<string, unknown>;
          if (typeof p.text === 'string') return p.text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as StreamBody | null;
  const userMessage = pickUserText(body);

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'Missing input message' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const agent = createDocsAgent();
  const { runId, threadId } = createIds();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        // Minimal stream for `useStream`: metadata + streaming ai message.
        send('metadata', { run_id: runId, thread_id: threadId });

        const inputs = buildInitialState({ message: userMessage });
        const messageId = `ai:${runId}`;
        let lastFullText = '';

        // Stream only AI text deltas; suppress tool calls/messages entirely (we
        // don't care about this for this project).
        for await (const chunk of await agent.stream(inputs, {
          streamMode: 'messages',
          recursionLimit: 12,
        })) {
          if (!Array.isArray(chunk)) continue;
          const msg = chunk[0];
          if (!isAIMessageChunk(msg) && !isAIMessage(msg)) continue;

          const text = extractTokenText(msg);
          if (!text) continue;

          // If we somehow get a full message (not a chunk), only send the new suffix.
          // For true chunks, `text` is already a delta.
          let delta = text;
          if (isAIMessage(msg) && typeof msg.content === 'string') {
            if (text.startsWith(lastFullText)) delta = text.slice(lastFullText.length);
            lastFullText = text;
          }

          if (!delta) continue;

          // IMPORTANT: `useStream` concatenates message chunks client-side.
          send('messages', [{ id: messageId, type: 'ai', content: delta }, {}]);
        }

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        send('error', { error: 'error', message: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
