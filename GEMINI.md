# GEMINI.md

This file provides instructional context for Gemini CLI interactions within the `apiis_moodle` project.

## Project Overview
`apiis_moodle` is a Firebase-based project for the `apiis-moodle-2487f` project ID. It includes Cloud Firestore and Cloud Functions for backend logic.

### Key Technologies
- **Firebase:** Platform for database and serverless compute.
- **Cloud Firestore:** NoSQL document database (Region: `australia-southeast1`).
- **Cloud Functions (v2):** Serverless compute (Runtime: Node.js 24, Region: `australia-southeast1`).
- **TypeScript:** Language for Cloud Functions.
- **ESLint:** Code linting with Google standard and TypeScript support.

## Architecture
The project follows a standard Firebase structure:
- **`firebase.json`**: Main configuration for Firebase services (Firestore and Functions).
- **`firestore.rules`**: Security rules for Cloud Firestore.
- **`firestore.indexes.json`**: Custom indexes for complex Firestore queries.
- **`functions/`**: Directory for Cloud Functions backend.
  - **`src/`**: Source code in TypeScript.
  - **`index.ts`**: Entry point for function definitions.
  - **`lib/`**: Compiled JavaScript output.

*Note: `firebase.json` contains a `runtime: python313` field for functions, but the project is currently set up as a Node.js/TypeScript project (`functions/package.json`, `tsconfig.json`). Ensure the runtime matches the language when deploying.*

## Building and Running
The following commands should be executed within the `functions/` directory:

| Task | Command |
| :--- | :--- |
| **Linting** | `npm run lint` |
| **Build** | `npm run build` |
| **Build (Watch)** | `npm run build:watch` |
| **Emulate Functions**| `npm run serve` |
| **Deploy Functions** | `npm run deploy` |
| **View Logs** | `npm run logs` |

To start all Firebase emulators (Firestore, Functions, etc.) from the root:
- `firebase emulators:start`

## Development Conventions
- **Naming:** Follow standard TypeScript/JavaScript camelCase.
- **Style:** Adhere to Google's ESLint style (indent: 2, double quotes).
- **Functions:** Use Firebase Functions v2 API triggers (`onRequest`, `onCall`, etc.) with `setGlobalOptions` for global configuration.
- **Linting:** Pre-deploy hooks run `npm run lint` and `npm run build` in `functions/`.

## Key Files
- `firebase.json`: Core configuration file for Firebase services.
- `firestore.rules`: Defines access permissions for Firestore data.
- `functions/src/index.ts`: The primary file for serverless backend code.
- `.firebaserc`: Stores project aliases (e.g., `apiis-moodle-2487f`).
