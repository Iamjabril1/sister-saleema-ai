import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "2mb" }));

// ✅ Allow your website(s) only (add more if needed)
const ALLOWED_ORIGINS = [
  "https://www.tenkfearless.com",
  "https://tenkfearless.com",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, cb) {
    // allow same-origin / server-to-server
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked for origin: " + origin));
  }
}));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.MODEL || "gpt-4.1-mini";

/**
 * Sister Saleema — system prompt (edit freely)
 */
const SALEEMA_SYSTEM = `
You are Sister Saleema — a friendly, supportive, confident coach for:
"The Eternal Detox Program: Towards a More Abundant Life • A Supreme Mindz Lifestyle" by Ten K Fearless.

Core duties:
1) Answer questions clearly with practical next steps.
2) Keep it warm + real. Short paragraphs. No robotic tone.
3) When appropriate, guide people to start NOW:
   - Create account: https://www.tenkfearless.com/create-account
   - Join Facebook group: https://www.facebook.com/groups/theeternaldetoxprogram
4) If asked "How do I start?" always give steps:
   (a) Create account, (b) Start Day 1, (c) Join FB group for accountability.
5) If they hesitate, explain benefits and invite them to begin.

Safety:
- Refuse self-harm/violence/illegal advice.
- If someone is in danger, tell them to contact local emergency services.

Style:
- Conversational, supportive, confident.
- Use bullets when helpful.
`;

// SSE init
function sseInit(res) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

/**
 * POST /api/saleema/stream
 * body: { userId?: string, messages: [{role:'user'|'assistant', content:string}, ...] }
 */
app.post("/api/saleema/stream", async (req, res) => {
  sseInit(res);

  const { messages = [], userId = "website_visitor" } = req.body || {};
  if (!Array.isArray(messages)) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: "messages must be an array" })}\n\n`);
    return res.end();
  }

  try {
    const stream = await client.responses.stream({
      model: MODEL,
      input: [
        { role: "system", content: SALEEMA_SYSTEM },
        ...messages.map((m) => ({
          role: m.role,
          content: String(m.content ?? ""),
        })),
      ],
      user: String(userId).slice(0, 64),
    });

    stream.on("event", (event) => {
      if (event.type === "response.output_text.delta") {
        res.write(`event: delta\ndata: ${JSON.stringify({ delta: event.delta })}\n\n`);
      }
      if (event.type === "response.completed") {
        res.write(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
        res.end();
      }
    });

    stream.on("error", (err) => {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err?.message || "stream error" })}\n\n`);
      res.end();
    });
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err?.message || "request failed" })}\n\n`);
    res.end();
  }
});

// Optional: demo page
app.use("/", express.static("public"));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`✅ Saleema server listening on :${PORT}`));
