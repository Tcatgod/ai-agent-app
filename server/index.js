import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";

import * as pdfParse from "pdf-parse";
// const pdfParse = (await import("pdf-parse")).default || (await import("pdf-parse"));
// const { default: pdfParse } = await import("pdf-parse");

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

// setup multer for file upload
const upload = multer({ dest: "uploads/" });

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory memory store (could become a database)
let memory = [];
let documents = [];

// Test route for browser / curl
app.get("/", (req, res) => res.send("Server is working!"));

// Main AI endpoint
app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  console.log("📩 Received:", message);

  // notice that it could become a huge input
  // you could use content.slice(0, 1000) to limit the context length
  const documentContext = documents.map(d => `Document: ${d.name}\n${d.content}`).join("\n");
  const textContext = memory.map(m => `Q: ${m.question}\nA: ${m.answer}`).join("\n");

  const context = [textContext, documentContext].filter(Boolean).join("\n");

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

// file upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const fPath = file.path
    let text = "";

    // parse file (based on extension)
    if (ext === ".txt") {
      text = await fs.readFile(fPath, "utf8");
    } else if (ext === ".pdf") {
      // pdf function unfinished
      try {
        const buffer = await fs.readFile(fPath);
        const parsed = await pdfParse(buffer);
        if (!parsed.text || parsed.text.trim().length === 0) {
          await fs.unlink(fPath);
          return res.status(400).json({ error: "PDF has no readable text (maybe scanned or encrypted)." });
        }
        text = parsed.text.trim();
      } catch (pdfErr) {
        console.error("❌ PDF parsing error:", pdfErr);
        await fs.unlink(fPath);
        return res.status(400).json({ error: "Failed to parse PDF. Make sure it's not scanned or corrupted." });
      }
    } else if (ext === ".docx" || ext === ".doc") {
      const data = await mammoth.extractRawText({ path: fPath });
      text = data.value;
    } else {
      await fs.unlink(fPath);
      return res.status(400).json({ error: "Unsupported file type" });
    }

    documents.push({ name: file.originalname, content: text });
    console.log(`📄 Uploaded: ${file.originalname} (${text.length} characters)`);

    await fs.unlink(fPath);

    res.json({ message: "File uploaded successfully", length: text.length });
  } catch (err) {
    console.error("❌ File upload error:", err);
    await fs.unlink(fPath);
    return res.status(500).json({ error: "Failed to process uploaded file" });
  }
});

// Start server
const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://127.0.0.1:${PORT}`));

