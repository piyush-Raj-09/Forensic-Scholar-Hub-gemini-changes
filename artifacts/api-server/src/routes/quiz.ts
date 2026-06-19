import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { GenerateQuizResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post("/quiz/generate", async (req, res): Promise<void> => {
  req.log.info("Generating forensic quiz questions");

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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      res.status(500).json({ error: "Unexpected response format from AI" });
      return;
    }

    const text = content.text.trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      req.log.error({ text }, "No JSON found in AI response");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const jsonStr = text.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    const validated = GenerateQuizResponse.parse(parsed);

    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating quiz");
    res.status(500).json({ error: "Failed to generate quiz questions" });
  }
});

export default router;
