import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { GenerateJumbledResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post("/jumbled/generate", async (req, res): Promise<void> => {
  req.log.info("Generating jumbled forensic words");

  const prompt = `Generate exactly 8 jumbled/scrambled forensic science vocabulary words with hints. Use professional forensic terminology from domains like DNA analysis, fingerprinting, ballistics, toxicology, forensic pathology, crime scene investigation, and digital forensics.

Return ONLY valid JSON with this exact structure, no markdown or extra text:
{
  "words": [
    {
      "id": 1,
      "scrambled": "SELCOSITH",
      "hint": "The study of tissues under a microscope, used to identify cause of death",
      "answer": "HISTOLOGY"
    }
  ]
}

Rules:
- Use UPPERCASE for both scrambled and answer
- The scrambled version must use the exact same letters as the answer, just rearranged
- Make the scrambling obvious but challenging
- Hints should be descriptive and educational
- Use real forensic science terms (6-12 letters work best)
- Make sure all 8 words are from different forensic domains`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
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
    const validated = GenerateJumbledResponse.parse(parsed);

    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating jumbled words");
    const anthropicMsg = (err as { error?: { error?: { message?: string } } })?.error?.error?.message;
    const fallback = (err as Error)?.message ?? "Failed to generate jumbled words";
    res.status(500).json({ error: anthropicMsg ?? fallback });
  }
});

export default router;
