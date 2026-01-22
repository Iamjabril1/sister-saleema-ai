# Sister Saleema — External Server (Render)

This is a tiny Node server that:
- keeps your OpenAI key PRIVATE (server-side only)
- streams Sister Saleema replies in real time (SSE)

## Deploy on Render (fastest)
1) Create a GitHub repo and upload these files.
2) In Render: New + > Web Service > connect the repo.
3) Build: npm install
4) Start: npm start
5) Add env vars in Render:
   - OPENAI_API_KEY = (your key)
   - MODEL = gpt-4.1-mini (optional)
6) Test:
   https://YOUR-RENDER-URL/health

## Connect to your website chat
Set in your landing page JS:
const API_URL = "https://YOUR-RENDER-URL/api/saleema/stream";

## Important
Never put your API key in HTML/JS. Keep it on the server only.
