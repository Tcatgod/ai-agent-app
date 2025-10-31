import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import OpenAI from "openai";

dotenv.config();

// Confirm API key
console.log("OpenAI API key loaded:", !!process.env.OPENAI_API_KEY);

const app = express();

// CORS: allow React server
app.use(cors({
  origin: "http://localhost:3000",  // React server address
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(bodyParser.json());

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory memory store (could become a database)
let memory = [];

// Test route for browser / curl
app.get("/", (req, res) => res.send("Server is working!"));

// Main AI endpoint
app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  console.log("📩 Received:", message);

  // notice that it could become a huge input
  const context = memory.map(m => `Q: ${m.question}\nA: ${m.answer}`).join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini", // OpenAI model [search online for available models]
      messages: [
        // system message: set the behavior, tone, constraints, and priorities of the AI
        { role: "system", content: "You are an intelligent AI assistant." },
        // user message: the user's question and the context (history) of the conversation
        { role: "user", content: context + "\n" + message }
      ] // those are all tokenized (there is a cost)
    });

    const reply = completion.choices[0].message.content;
    console.log("🤖 Reply:", reply);

    // Store in memory
    memory.push({ question: message, answer: reply });

    res.json({ reply });

  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://127.0.0.1:${PORT}`));

