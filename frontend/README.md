# Open Sangam — Frontend

This is the frontend for **Open Sangam**, a platform for exploring classical Tamil Sangam literature through layered Tamil, Urai, and English views.

## Tech Stack
- React
- Vite
- Tailwind CSS
- Firebase / Firestore

## Getting Started

Install dependencies:
Run the development server:
Build for production:
## Environment Variables

This project connects to several backend services and APIs. To run it fully, you'll need a `.env` file in the `frontend/` directory (e.g., `.env.local` for local development).

Key environment variables include:

*   `VITE_AVAI_API_URL`: The base URL for the `avai/agents` backend (e.g., `http://localhost:8080`). This is crucial for connecting the frontend chat interface to the AI Pulavar agents.
*   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.: Firebase configuration details.
*   `VITE_GEMINI_API_KEY`: API key for direct Gemini AI calls (if any, beyond the `avai/agents` service).

Example `.env.local` file content:

```dotenv
VITE_AVAI_API_URL="http://localhost:8080"
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Ensure your `avai/agents` backend is running and accessible at the configured `VITE_AVAI_API_URL`.

## Avai floating assistant

`src/components/avai/FloatingAvai.jsx` is the launcher bubble that follows the
reader across every page except `/avai`, where the full chat already lives. It
posts to the same `/avai/ask` endpoint through `src/services/avaiService.js` —
there is no second transport or prompt contract. Like the full page it is
gated behind `AVAI_ENABLED`, and lazy-loaded so its code is never shipped when
the backend is not configured.

The bubble shows `public/brand/avai-logo.png` **exactly as supplied**: do not
recolour it, redraw it, re-typeset it, or crop it. The disc behind it is
painted with the artwork's own background colour (`#0d0b09`, set in
`index.css`), so the logo's square edges are invisible inside the circle and
every original pixel of the cream mark is kept. The lavender glow is a
box-shadow outside the artwork, so it can never tint the logo itself.
