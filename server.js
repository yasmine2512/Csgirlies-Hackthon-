import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import pdf from "pdf-parse";
import fs from "fs";
import axios from "axios";
import cors from "cors";
import OpenAI from "openai";
import fileUpload from "express-fileupload";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRoutes from "./Routes/auth.js";
import quizRoutes from "./Routes/quiz.js";
import { saveQuizToUser } from './Routes/quiz.js';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
app.use(
  fileUpload({
    useTempFiles: true,      // store uploaded files in temp folder
    tempFileDir: "/tmp/",    // temp folder
    createParentPath: true,  // automatically create directories
  })
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 4000;

// Multer setup (store uploaded file temporarily)
const upload = multer({ dest: "uploads/" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err.message);
    process.exit(1);
  }
};
connectDB();
// ---------- Utility: call OpenAI Chat API ----------
async function callOpenAIChat(systemPrompt, userPrompt, model = "gpt-4o-mini") {
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 1200
  };
  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    }
  });
  return res.data.choices?.[0]?.message?.content ?? "";
}

app.use("/auth", authRoutes);
app.use("/quiz", quizRoutes);


app.post("/api/summarize", async (req, res) => {
  try {
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.files.pdf;
    console.log("Received file:", file.name, "at", file.tempFilePath);

    // Make sure file exists
    if (!fs.existsSync(file.tempFilePath)) {
      return res.status(400).json({ error: "Uploaded file not found" });
    }

    // Extract text from PDF
    const dataBuffer = await pdf(file.tempFilePath);
    let text = dataBuffer.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "PDF contains no readable text" });
    }

    // Optional: limit text size for OpenAI
    text = text.substring(0, 4000);

    // Call OpenAI to summarize
    const prompt = `Summarize the following text in bullet points:\n\n${text}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4, gpt-4o if your account supports
      messages: [{ role: "user", content: prompt }],
    });

    const summary = response.choices[0].message.content;

    res.json({ summary });
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err);
    res.status(500).json({ error: "Summarization failed" });
  }
});


app.post("/:id/api/generate-quiz", async (req, res) => {
  try {
    const userId = req.params.id
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const system = `
You are an educational assistant.
You will receive a *summary* of a topic (not the full text).
Your job is to generate high-quality quiz questions based on the *topic*, not on exact sentences from the summary.
Questions must test understanding, concepts, and reasoning.
    `;

    const userPrompt = `
The following text is only a *summary* of a topic.
Using the topic described in the summary, generate **10 multiple-choice questions**.

For each question:
- Write a clear and relevant question based on the topic.
- Provide 4 answer options labeled A, B, C, D.
- Clearly indicate the correct answer, like: Answer: C
- Provide a short explanation (one sentence) about why this is the correct answer.

Summary text:
"""${text}"""
    `;

    const quizText = await callOpenAIChat(system, userPrompt);
     if (userId) {
      await saveQuizToUser(userId, quizText);
    }
    res.json({ quiz: quizText });

  } catch (err) {
    console.error(err?.response?.data ?? err);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
