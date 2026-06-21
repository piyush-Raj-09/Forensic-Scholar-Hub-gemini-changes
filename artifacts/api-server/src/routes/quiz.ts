import { Router, type IRouter } from "express";
import { GenerateQuizResponse } from "@workspace/api-zod";
import { geminiGenerate } from "../lib/gemini";

const router: IRouter = Router();

type Difficulty = "easy" | "intermediate" | "hard";

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

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: `DIFFICULTY: EASY
- Target audience: complete beginners with no forensic background
- Questions must be about basic, everyday-knowledge-level concepts (e.g. what DNA stands for, what fingerprints are used for, what a coroner does)
- Use plain language. Avoid scientific jargon in the question text.
- All 4 answer options should be understandable to a non-scientist
- Wrong options should be plausible-sounding but clearly incorrect on reflection
- Explanations should be simple and educational`,

  intermediate: `DIFFICULTY: INTERMEDIATE
- Target audience: students or enthusiasts with some forensic/science knowledge
- Questions should cover forensic techniques, standard procedures, and established terminology (e.g. Locard's exchange principle, types of fingerprint patterns, chain of custody)
- Some technical terms allowed; explain them briefly in the explanation field
- Wrong options should require real knowledge to eliminate`,

  hard: `DIFFICULTY: HARD
- Target audience: forensic science graduates or professionals
- Questions must involve advanced scientific methods, precise terminology, edge-case knowledge, or case-based reasoning (e.g. STR allele frequencies, specific reagent chemistry, instrument techniques like GC-MS or SEM-EDX)
- All 4 options should be technically plausible — only an expert can identify the correct one
- Explanations should be detailed and scientifically rigorous`,
};

router.post("/quiz/generate", async (req, res): Promise<void> => {
  const difficulty: Difficulty = (req.body?.difficulty as Difficulty) ?? "intermediate";
  const seed = Math.floor(Math.random() * 1_000_000);
  const pickedTopics = shuffleAndPick(QUIZ_TOPICS, 8);
  req.log.info({ seed, difficulty }, "Generating forensic quiz questions");

  const prompt = `SESSION SEED: ${seed} — generate a completely unique set of questions different from any previous response.

${DIFFICULTY_INSTRUCTIONS[difficulty]}

Generate exactly 8 multiple choice quiz questions about forensic science. Each question MUST come from a different one of these randomly selected topics (one per topic, in order):
${pickedTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

IMPORTANT: Do NOT reuse common textbook examples. Seed ${seed} ensures this session differs — pick varied angles within each topic.

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
