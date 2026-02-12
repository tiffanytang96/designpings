# Design Pings ✨

A playful-but-practical product planning board built with Next.js.

Design Pings combines:

- 📥 A Kanban-style ping workflow (`Inbox`, `In Progress`, `Done`)
- 🧩 Rich ping metadata (priority, due date, tags, checklist)
- 🗒️ A sticky notes board with optional voice-to-text dictation
- 💾 Local persistence for board data and UI preferences

## Why This Project 🚀

Design Pings is meant to feel lightweight, fast, and focused:

- Smooth interactions for daily planning
- Clear visual hierarchy for task status
- Mobile-friendly flows without losing desktop power

## Features ✅

- Drag and drop pings across columns and reorder within a column
- Focus mode that emphasizes active working columns
- Search by ping title and tags
- Add/Edit Ping modal with title, description, column, priority, due date, tags, and checklist progress
- Sticky notes board with add, edit, recolor, and delete actions
- Desktop sticky-note drag canvas and mobile stacked list layout
- Voice-to-text sticky input using the Web Speech API
- Mobile responsive UI with single-column selector, bottom actions, and responsive top navigation
- Persistent state with Zustand + localStorage/sessionStorage fallback

## Tech Stack 🛠️

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + daisyUI
- Framer Motion
- Zustand (persist middleware)
- dnd-kit
- Heroicons + Lucide icons

## Project Structure 🗂️

```text
src/
  app/
    page.tsx
    globals.css
  components/
    Column.tsx
    PingCard.tsx
    AddPingModal.tsx
    TopBar.tsx
    sticky/
      StickyNotesBoard.tsx
      StickyCanvas.tsx
      StickyNoteCard.tsx
  hooks/
    useSpeechRecognition.ts
  stores/
    boardStore.ts
    stickyStore.ts
```

## Getting Started ⚡

### 1) Install dependencies

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts 📜

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run production server
npm run lint    # run ESLint
```

## Data Persistence 💾

This app is frontend-only and stores state in browser storage:

- `pingboard:data` for pings and tags
- `design-pings-sticky-notes` for sticky notes
- `pingboard:ui` for UI preferences (focus mode, nav visibility, sticky drawer state)

## Browser Notes 🌐

- Voice dictation relies on `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- Best support is in Chromium-based browsers
- If unsupported, the mic action is disabled and a fallback message is shown

## Deploying to Vercel ▲

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Use defaults (`npm install`, `npm run build`)
4. Deploy

No backend environment variables are required for the current feature set.
