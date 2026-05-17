import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // --- AI Sanitization Endpoint ---
  app.post("/api/sanitize", async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText) {
        res.status(400).json({ error: "rawText is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are a strict privacy scrubber for an anonymous whistleblowing platform.
Your job is to read the following incident report and remove ALL personally identifiable information (PII).
Remove all names of people, specific locations, exact dates/times, identifying job titles, and any identifiable speech patterns.
Rewrite the report to maintain the core factual allegation (e.g., safety, compliance, or harassment issues), but completely sanitize it.
IMPORTANT: Output ONLY the sanitized text. Do not add conversational filler like "Here is the sanitized version:".

Raw Report:
${rawText}`;

      const result = await model.generateContent(prompt);
      const sanitizedText = result.response.text().trim();

      res.json({ sanitizedText });
    } catch (error) {
      console.error("AI Sanitization Error:", error);
      res.status(500).json({ error: "Failed to sanitize text via AI." });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
