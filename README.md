# MindMopper

A free, open source alternative to paid mind mapping tools like MindMeister. Create, organize, and share mind maps — visual trees of related ideas and links — without subscriptions or account paywalls.

## What is a mind map?

A mind map is a diagram that starts with a central idea and branches outward into related subtopics, notes, and links. They're useful for brainstorming, planning, note-taking, and organizing complex information visually.

## Features

- Create mind maps with a central topic and unlimited branches
- Add links, notes, and labels to any node
- Share maps with others via a simple URL
- No account required to view shared maps
- Fully open source — self-host or run locally

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 20+

### Run with Docker (recommended)

```bash
git clone https://github.com/andrewwatson/mindmopper
cd mindmopper
docker compose up --build
```

Open http://localhost:8080.

### Run locally for development

```bash
git clone https://github.com/andrewwatson/mindmopper
cd mindmopper

# Build the frontend
cd web && npm install && npm run build && cd ..

# Start the backend (serves frontend at http://localhost:8080)
go run .
```

Or run backend and frontend dev server simultaneously (with hot reload):

```bash
./scripts/dev.sh
# Backend: http://localhost:8080
# Frontend dev server: http://localhost:5173
```

## Why MindMopper?

Most mind mapping tools are either expensive, limit free-tier usage, or lock your data behind a proprietary format. MindMopper is built on the principle that organizing your thoughts shouldn't cost money or require trusting a third party with your ideas.

## License

MIT
