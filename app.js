import "dotenv/config";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Middleware setup
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Home route
app.get("/", (req, res) => {
  res.render("index", {
    corrected: "",
    originalText: "",
  });
});

// Main logic route
app.post("/correct", async (req, res) => {
  const text = req.body.text.trim();

  if (!text) {
    return res.render("index", {
      corrected: "Please enter some text to correct.",
      originalText: text,
    });
  }

  try {
    const prompt = `Act as a professional text correction tool. Your task is to correct any spelling, grammar, or punctuation errors in the following text. Only return the corrected version, with no explanations or additional text.

Input text: "${text}"

Rules:
1. Fix all spelling errors
2. Correct grammar mistakes
3. Fix punctuation
4. Maintain the original meaning
5. Only output the corrected text
6. Make sure verbs agree with subjects
7. Fix incorrect word usage (their/there/they're, your/you're, etc.)

Corrected text:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let correctedText = response.text().trim();

    // Remove any quotation marks that might be in the response
    correctedText = correctedText.replace(/^["']|["']$/g, "");

    // If no corrections were made, indicate that
    if (correctedText.toLowerCase() === text.toLowerCase()) {
      correctedText = "No corrections needed for this text.";
    }

    console.log("Original:", text);
    console.log("Corrected:", correctedText);

    res.render("index", {
      corrected: correctedText,
      originalText: text,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.render("index", {
      corrected: "An error occurred. Please try again.",
      originalText: text,
    });
  }
});

// Start the server
app.listen(port, () => {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("Warning: GOOGLE_API_KEY is not set in environment variables");
  }
  console.log(`Server running on port ${port}`);
});
