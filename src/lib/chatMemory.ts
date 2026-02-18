import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export type StoredChatMessage = {
  role: 'human' | 'ai';
  content: string;
  ts: number;
};

type ThreadFile = {
  threadId: string;
  messages: StoredChatMessage[];
};

const MAX_STORED_MESSAGES = 30;

function threadDir() {
  return path.join(process.cwd(), 'data', 'chat-memory');
}

function threadPath(threadId: string) {
  // Basic path safety: treat threadId as an opaque identifier.
  const safe = threadId.replaceAll('/', '_');
  return path.join(threadDir(), `${safe}.json`);
}

export async function loadThreadMessages(threadId: string): Promise<StoredChatMessage[]> {
  try {
    const raw = await fs.readFile(threadPath(threadId), 'utf8');
    const parsed = JSON.parse(raw) as ThreadFile;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.messages)) return [];

    return parsed.messages
      .filter((m): m is StoredChatMessage => {
        return (
          !!m &&
          typeof m === 'object' &&
          (m.role === 'human' || m.role === 'ai') &&
          typeof m.content === 'string' &&
          typeof m.ts === 'number'
        );
      })
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

export async function appendThreadMessages(threadId: string, next: StoredChatMessage[]) {
  const dir = threadDir();
  await fs.mkdir(dir, { recursive: true });

  const existing = await loadThreadMessages(threadId);
  const merged = [...existing, ...next].slice(-MAX_STORED_MESSAGES);

  const file: ThreadFile = { threadId, messages: merged };
  const finalPath = threadPath(threadId);
  const tmpPath = `${finalPath}.tmp`;

  await fs.writeFile(tmpPath, JSON.stringify(file, null, 2) + '\n', 'utf8');
  await fs.rename(tmpPath, finalPath);
}

export function toBaseMessages(messages: StoredChatMessage[]): BaseMessage[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => (m.role === 'human' ? new HumanMessage(m.content) : new AIMessage(m.content)));
}
