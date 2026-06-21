import { Router, type IRouter } from "express";
import { GenerateJumbledResponse } from "@workspace/api-zod";
import { geminiGenerate } from "../lib/gemini";

const router: IRouter = Router();

const JUMBLED_DOMAINS = [
  "DNA and molecular forensics",
  "fingerprint science and dactyloscopy",
  "ballistics and firearms examination",
  "toxicology and pharmacology",
  "forensic pathology and autopsy procedures",
  "crime scene investigation techniques",
  "digital and cyber forensics",
  "trace evidence and locard exchange",
  "serology and blood typing",
  "forensic entomology",
  "forensic anthropology and osteology",
  "questioned documents and ink analysis",
  "arson and fire investigation",
  "forensic odontology",
  "criminal profiling and forensic psychology",
  "forensic botany",
  "gunshot residue and shooting reconstruction",
  "footwear impression evidence",
];

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

router.post("/jumbled/generate", async (req, res): Promise<void> => {
  const seed = Math.floor(Math.random() * 1_000_000);
  const pickedDomains = shuffleAndPick(JUMBLED_DOMAINS, 8);
  req.log.info({ seed }, "Generating jumbled forensic words");

  const prompt = `SESSION SEED: ${seed} — produce a unique word set different from any previous response.

Generate exactly 8 jumbled/scrambled forensic science vocabulary words. Each word MUST come from a different one of these randomly selected domains (one word per domain, in this order):
${pickedDomains.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Avoid the most common/obvious terms (e.g. do not use DNA, AUTOPSY, FORENSIC as they appear too frequently). The seed ${seed} signals you must choose less-common, varied terminology.

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
- The scrambled version must use the EXACT same letters as the answer, just rearranged (verify letter-by-letter before returning)
- Hints should be descriptive and educational
- Use real forensic science terms (6-12 letters work best)`;

  try {
    const text = await geminiGenerate(prompt);

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      req.log.error({ text }, "No JSON found in Gemini response");
      res.status(500).json({ error: "Failed to parse Gemini response" });
      return;
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const validated = GenerateJumbledResponse.parse(parsed);
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating jumbled words");
    res.status(500).json({ error: (err as Error)?.message ?? "Failed to generate jumbled words" });
  }
});

export default router;
