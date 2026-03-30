# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Study Planner Extension - a Chrome Extension-style web app for managing study schedules in Arabic.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── study-planner-extension/  # React + Vite frontend (Arabic RTL)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/subjects.ts  # subjects, lessons, postponed_lessons tables
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Study Planner Features

- **Add Subject**: Choose from fixed subject list (عربي, إنجليزي, رياضيات, etc.), set date, add lessons
- **Time Mode**: Fixed (from/to time) or Duration (with countdown timer)
- **Distribute Time**: Toggle to allocate time per lesson (requires time set first)
- **Active Tracking**: Checkboxes for each lesson during study session
- **Postponed Lessons**: Incomplete lessons automatically moved to postponed section
- **Full Arabic RTL UI** with dark purple gradient design

## Database Tables

- `subjects` - Study subjects with time config and status
- `lessons` - Lessons within each subject
- `postponed_lessons` - Lessons not completed on time

## API Endpoints

- `GET/POST /api/subjects` - List/create subjects
- `DELETE /api/subjects/:id` - Delete subject
- `POST /api/subjects/:id/start` - Start a study session
- `POST /api/subjects/:id/complete` - Complete session (moves incomplete lessons to postponed)
- `POST /api/lessons/:id/toggle` - Toggle lesson completion
- `GET /api/postponed` - List postponed lessons
- `DELETE /api/postponed/:id` - Delete postponed lesson
