# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment setup

Create a .env file based on .env.example and set your Google AI (Gemini) API key:

- GEMINI_API_KEY or GOOGLE_API_KEY

**Important:**

- For free API keys from Google AI Studio, only `gemini-2.5-flash` and `gemini-2.0-pro` are supported.
- The API key must be passed as a query parameter (`?key=YOUR_API_KEY`), not as a Bearer token.
- If using the official SDK, set the environment variable `GEMINI_API_KEY`.

## Genkit flows and API routes

This project exposes Genkit flows via Next.js App Router endpoints using the @genkit-ai/next adapter:

- POST /api/genkit/analyzeDocument
- POST /api/genkit/auditCourse
- POST /api/genkit/generateQuizQuestions
- POST /api/genkit/suggestMissingContent

During local flow development, you can also run the Genkit dev server:

- npm run genkit:dev (or genkit:watch)
