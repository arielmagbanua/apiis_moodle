# GEMINI.md - Project Context

## Project Overview
**tools-site** is a Next.js-based web application providing a suite of utility tools. Its primary feature is a **Quiz Result Summary** tool that processes Moodle quiz results (in CSV format) to generate statistical insights.

### Core Technology Stack
- **Framework:** Next.js 16.2.3 (App Router)
- **Library:** React 19.2.4
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x
- **HTTP Client:** Axios
- **Backend Integration:** Proxies requests to a Firebase Function for data extraction and processing.

## Architecture
- `app/`: Contains the Next.js App Router structure.
  - `api/quiz-result-summary/upload/`: Server-side route handler that validates CSV uploads and forwards them to the processing microservice.
  - `quiz-result-summary/`: The frontend page for uploading files and viewing summaries.
- `components/`: Reusable UI components.
  - `QuizSummary.tsx`: Displays stats like group average, highest scores, and top scorers.
  - `Logo.tsx`: Project branding component.

## Building and Running
Based on `package.json`, use the following commands:

| Task | Command |
| :--- | :--- |
| **Development** | `npm run dev` |
| **Build** | `npm run build` |
| **Production Start** | `npm run start` |
| **Linting** | `npm run lint` |

## Development Conventions
- **TypeScript First:** Strict typing is used throughout the project for both API responses and component props.
- **Next.js Versioning:** Note that this project uses a specific version of Next.js (16.2.3) with React 19. Refer to `AGENTS.md` for specific guidance on breaking changes and conventions.
- **API Proxying:** Client-side components should not hit external APIs directly; instead, use internal API routes (like `/api/quiz-result-summary/upload`) to handle sensitive logic or proxying.
- **Styling:** Tailwind CSS is used for utility-first styling. Prefer modern CSS features where possible.
- **Error Handling:** API routes include validation for file size (10MB limit) and file types (.csv only).
