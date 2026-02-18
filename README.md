# LangGraph Docs Chat

A tiny Next.js chat app that answers questions about **LangGraph (JavaScript)**
using a file based vector index ([Vectra](https://github.com/Stevenic/vectra)),
powered by LangGraph and Gemini.

Live Demo: https://lang-graph-docs-chat.vercel.app/

## Prerequisites

- Node.js 22+ (tested on 24)
- pnpm
- `GEMINI_API_KEY`

## Getting the API key

You can get an API Key for Gemini for free at AI Studio:
https://ai.google.dev/

### Set the API key in your environment:

Add a `.env.local` file in the root of the project with the following content:

```env
GEMINI_API_KEY=your_api_key_here
```

## Run it

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Index the docs

Docs are already indexed in a local vector index (Vectra) and included in the repo, but if you want to re-index:

```bash
export GEMINI_API_KEY=your_key_here
pnpm run index:langgraph
```

## Notes

- The local index is stored in `data/langgraph-js-docs/vectra-index/`.
- I only indexed Javascript/Typescript LangGraph docs, not Python and not
  LangChain Docs, for time and cost reasons, but can be easily extended to
  include those as well.
