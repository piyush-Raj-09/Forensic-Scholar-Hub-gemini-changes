import { Router, type IRouter } from "express";
import { GenerateQuizResponse } from "@workspace/api-zod";
import { geminiGenerate } from "../lib/gemini";

const router: IRouter = Router();

const QUIZ_TOPICS = [
  "DNA profiling and STR analysis",
  "fingerprint classification (loops, whorls, arches)",
  "firearm and ballistics examination",
  "toxicology and poison detection",
  "crime scene documentation and chain of custody",
  "forensic pathology and cause of death determination",
  "digital forensics and cybercrime investigation",
  "blood spatter pattern analysis",
  "questioned document examination and handwriting analysis",
  "forensic anthropology and skeletal analysis",
  "trace evidence analysis (fibers, hair, glass)",
  "serology and body fluid identification",
  "forensic entomology and time of death estimation",
  "arson investigation and fire debris analysis",
  "forensic odontology and bite mark analysis",
  "drug identification and clandestine laboratory investigation",
  "forensic psychology and criminal profiling",
  "footwear and tire track examination",
  "forensic botany and pollen analysis",
  "gunshot residue analysis",
];

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

router.post("/quiz/generate", async (req, res): Promise<void> => {
  const seed = Math.floor(Math.random() * 1_000_000);
  const pickedTopics = shuffleAndPick(QUIZ_TOPICS, 8);
  req.log.info({ seed }, "Generating forensic quiz questions");

  const prompt = `SESSION SEED: ${seed} — use this to generate a completely unique set of questions different from any previous response.

Generate exactly 8 multiple choice quiz questions about forensic science. Each question MUST come from a different one of these randomly selected topics (one question per topic, in this exact order):
${pickedTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

IMPORTANT: Do NOT reuse common textbook examples. The seed ${seed} means this session's questions must be distinct — pick obscure angles, edge cases, or advanced concepts within each topic to maximise variety across sessions.

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

Each question must have exactly 4 options. correctAnswer is the 0-based index of the correct option.`;

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
    const validated = GenerateQuizResponse.parse(parsed);
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating quiz");
    res.status(500).json({ error: (err as Error)?.message ?? "Failed to generate quiz questions" });
  }
});

export default router;
