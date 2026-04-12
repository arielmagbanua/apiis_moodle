# GEMINI.md

This file provides foundational context for AI-assisted development in the `apiis_moodle` project.

## Project Overview
`apiis_moodle` is a Firebase-based backend service designed to process data from Moodle. Its primary function is to handle CSV uploads from Moodle quiz results and convert them into structured JavaScript objects for further processing or storage.

### Key Technologies
- **Firebase:** Platform for serverless infrastructure.
- **Cloud Functions (v2):** Used for backend logic, specifically HTTP-triggered functions (Region: `asia-southeast1`).
- **TypeScript:** The primary language for backend development.
- **Node.js (v24):** The runtime environment for Cloud Functions.
- **Busboy & csv-parse:** Libraries used for handling multipart/form-data and robust CSV parsing.
- **ESLint:** Enforces the Google JavaScript/TypeScript style guide.

## Architecture
The project is structured as a standard Firebase project:
- **Root Directory:** Contains project-wide configuration (`firebase.json`, `.firebaserc`, `.gitignore`).
- **`functions/`**: The core backend codebase.
  - **`src/index.ts`**: Main entry point where Cloud Functions are defined.
  - **`lib/`**: Directory for compiled JavaScript (automatically generated during build).
  - **`package.json`**: Manages backend dependencies and scripts.

### Cloud Functions
- **`extractDataFromMoodleQuizResults`**: An HTTP `onRequest` function (v2) that:
  - Validates `POST` requests.
  - Parses `multipart/form-data` using `busboy`.
  - Converts CSV data into JSON using `csv-parse`.
  - Configured with `maxInstances: 2` for cost control.

## Building and Running
Development and deployment should be managed from the `functions/` directory.

| Task | Command | Description |
| :--- | :--- | :--- |
| **Linting** | `npm run lint` | Checks code against style rules. |
| **Linting (Fix)** | `npm run lint -- --fix` | Automatically fixes style violations. |
| **Build** | `npm run build` | Compiles TypeScript into JavaScript in the `lib/` folder. |
| **Emulate** | `npm run serve` | Starts the Firebase Functions emulator locally. |
| **Deploy** | `npm run deploy` | Deploys functions to the Firebase cloud. |
| **Logs** | `npm run logs` | Streams logs from the deployed functions. |

### Global Commands (from root)
- **Start All Emulators:** `firebase emulators:start`

## Development Conventions
- **Code Style:** Strictly follows the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) via ESLint.
- **Concurrency, CORS & Access:** Uses Firebase Functions v2 with `maxInstances: 2` (Global), `cors: true`, and `invoker: "public"` (on the HTTPS function) for consistent performance, cross-origin access, and public availability.
- **Type Safety:** Prioritize TypeScript interfaces and types over `any`.
- **Pre-deployment:** Firebase is configured to automatically run linting and building before every deployment.

## Key Configuration Files
- `firebase.json`: Defines deployment targets and pre-deployment hooks.
- `.firebaserc`: Associates the local environment with the `apiis-moodle-2487f` project ID.
- `functions/tsconfig.json`: Controls the TypeScript compilation process (Target: `es2017`, Module: `NodeNext`).
