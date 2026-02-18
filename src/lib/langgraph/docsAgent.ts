import { HumanMessage, isAIMessage, isToolMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MessageGraph, START } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { searchTool } from './tools';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_TOOL_CALLS = 3;
const GEMINI_MODEL = 'gemini-2.5-flash';

export const toolNode = new ToolNode([searchTool]);

type AgentInput = {
  message: string;
};

function buildSystemPrompt(opts?: { priorConversation?: string }) {
  const rules = [
    'You are a website assistant for LangGraph JavaScript docs.',
    'Rules:',
    `- When the user asks about LangGraph, decide what to search for and call the tool search_langgraph_docs.`,
    `- If the returned snippets are not sufficient, refine your search query and call the tool again.`,
    `- Try at most ${MAX_TOOL_CALLS} retrieval attempts before answering.`,
    "- Use only the returned snippets to answer; if snippets are missing after retries, say you don't know.",
    '- Never include or paraphrase the tool JSON in your response.',
    '- Never output a Context/Snippets section or any raw retrieved passages.',
    '- Output format: return Markdown. Use fenced code blocks (```lang) for any code. Ensure markdown is well-formatted and renders correctly.',
    '- Keep the answer short and concise. Use simple language, single examples and be clear.',
    "- At the end, include a 'Sources:' list with the doc URLs you used.",
  ];

  const prior = opts?.priorConversation?.trim();
  if (prior) {
    rules.push('', 'Prior conversation (for continuity, do not repeat verbatim):', prior);
  }

  return new SystemMessage(rules.join('\n'));
}

export function createDocsAgent(opts?: { priorConversation?: string }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing env var: GEMINI_API_KEY');
  }

  const systemPrompt = buildSystemPrompt(opts);

  const model = new ChatGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL,
    temperature: 0.4, // allow more tokens for a detailed answer with examples
  }).bindTools([searchTool]);

  // Call the model with the given messages and return its response. The model
  // may call tools, which will be handled by the toolNode in the graph.
  const callModel = async (messages: BaseMessage[]) => {
    const response = await model.invoke([
      // include the system prompt as the first message to set expectations for
      // the model's behavior.
      systemPrompt,
      ...messages,
    ]);
    return response;
  };

  // Determine whether to continue with more tool calls or end and respond to
  // the user. This is based on the number of tool calls so far and whether the
  // model has indicated a desire to call more tools in its response.
  const shouldContinue = (messages: BaseMessage[]) => {
    const toolCallsSoFar = messages.filter(isToolMessage).length;
    if (toolCallsSoFar >= MAX_TOOL_CALLS) return '__end__' as const;

    const lastMessage = messages.at(-1);
    if (!lastMessage || !isAIMessage(lastMessage)) return '__end__' as const;
    if (lastMessage.tool_calls?.length) return 'tools' as const;
    return '__end__' as const;
  };

  return new MessageGraph()
    .addNode('agent', callModel)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent')
    .compile();
}

export function buildInitialState(input: AgentInput): BaseMessage[] {
  return [new HumanMessage(input.message)];
}
