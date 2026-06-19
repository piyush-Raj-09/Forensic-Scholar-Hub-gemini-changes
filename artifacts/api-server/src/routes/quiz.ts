import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateQuizResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/quiz/generate", async (req, res): Promise<void> => {
  req.log.info("Generating forensic quiz questions");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate exactly 8 multiple choice quiz questions about forensic science. Cover diverse domains including: DNA analysis, fingerprinting, ballistics, toxicology, crime scene investigation, forensic pathology, digital forensics, blood spatter analysis, document examination, and forensic anthropology.

Return ONLY valid JSON with this exact structure, no markdown or extra text:
{
  "questions": [
    {
      "id": 1,
      "question": "What does PCR stand for in DNA forensics?",
      "options": ["Polymerase Chain Reaction", "Protein Chain Replication", "Polygraph Controlled Reading", "Primary Crime Record"],
      "correctAnswer": 0,
      "domain": "DNA Analysis",
      "explanation": "PCR (Polymerase Chain Reaction) is used to amplify small DNA samples into quantities large enough for analysis."
    }
  ]
}

Each question must have exactly 4 options. correctAnswer is the 0-based index of the correct option. Make questions varied in difficulty and cover different forensic domains.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      req.log.error({ text }, "No JSON found in Gemini response");
      res.status(500).json({ error: "Failed to parse Gemini response" });
      return;
    }

    const jsonStr = text.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    const validated = GenerateQuizResponse.parse(parsed);

    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating quiz");
    const msg = (err as Error)?.message ?? "Failed to generate quiz questions";
    res.status(500).json({ error: msg });
  }
});

export default router;
