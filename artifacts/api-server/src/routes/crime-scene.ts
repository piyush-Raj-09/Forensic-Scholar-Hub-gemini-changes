import { Router, type IRouter } from "express";
import {
  GenerateCrimeSceneResponse,
  EvaluateCrimeSceneResponse,
} from "@workspace/api-zod";
// Note: Zod validators above are named by orval from operationIds, not schema names
import { geminiGenerate } from "../lib/gemini";

const router: IRouter = Router();

type Difficulty = "easy" | "intermediate" | "hard";

const DIFFICULTY_SCENE: Record<Difficulty, string> = {
  easy: `DIFFICULTY: EASY
- Simple, clear crime scene (e.g. home burglary, straightforward poisoning)
- 4–5 obvious, unambiguous clues that clearly point to the crime type
- Description should be written in plain English, no jargon
- Suitable for a complete beginner who has watched crime TV shows`,

  intermediate: `DIFFICULTY: INTERMEDIATE
- Moderately complex scene (e.g. suspicious death, hit-and-run, white-collar fraud)
- 5–6 clues including some forensic evidence types (trace, biological, digital)
- May include one slightly misleading detail that requires interpretation
- Suitable for a forensic science student`,

  hard: `DIFFICULTY: HARD
- Complex, multi-layered scene (e.g. staged suicide, cold case, lab poisoning)
- 6–7 clues with technical forensic details; some deliberately misleading
- Requires expert-level interpretation (toxicology, trace analysis, scene reconstruction)
- Suitable for a forensic science professional`,
};

const DIFFICULTY_EVAL: Record<Difficulty, string> = {
  easy: `Marking as a EASY level. Be generous and educational. Award partial credit for reasonable lay-person answers. Explanations should be clear and accessible.`,
  intermediate: `Marking as INTERMEDIATE level. Expect correct terminology and logical reasoning. Partial credit for incomplete but reasonable answers.`,
  hard: `Marking as HARD level. Expect precise scientific terminology, correct methodology, and expert-level reasoning. Be rigorous.`,
};

const SCENE_LOCATIONS = [
  "a ransacked apartment in a high-rise building",
  "an isolated park at dusk",
  "a corporate office after hours",
  "a suburban garage workshop",
  "a luxury hotel room",
  "a university chemistry laboratory",
  "an abandoned warehouse near the docks",
  "a private yacht docked at the marina",
  "a rural farmhouse kitchen",
  "a parking garage stairwell",
  "a coffee shop stockroom",
  "a hospital storage room",
];

router.post("/crime-scene/generate", async (req, res): Promise<void> => {
  const difficulty: Difficulty = (req.body?.difficulty as Difficulty) ?? "intermediate";
  const seed = Math.floor(Math.random() * 1_000_000);
  const location = SCENE_LOCATIONS[seed % SCENE_LOCATIONS.length];
  req.log.info({ seed, difficulty, location }, "Generating virtual crime scene");

  const prompt = `SESSION SEED: ${seed} — generate a completely unique crime scene unlike any previous response.

${DIFFICULTY_SCENE[difficulty]}

You are generating a virtual crime scene for a forensic science training simulation.
Location: ${location}

Generate a realistic, engaging crime scene. Return ONLY valid JSON with NO markdown:
{
  "location": "Descriptive name of the location (e.g. 'Ransacked Apartment — 14th Floor, Block C')",
  "crimeType": "The actual crime type (hidden from user, used only for evaluation)",
  "description": "2–3 vivid sentences describing what first responders see when they arrive. Atmospheric, specific, no editorializing.",
  "clues": [
    "Clue 1 — specific observable detail",
    "Clue 2 — specific observable detail",
    "Clue 3 — specific observable detail",
    "Clue 4 — specific observable detail",
    "Clue 5 — specific observable detail"
  ]
}

The clues should be specific observable facts (what investigators SEE), not conclusions. Each clue on one line, starting with a detail (e.g. "A shattered wine glass near the east window, its contents dried onto the carpet").`;

  try {
    const text = await geminiGenerate(prompt);
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      res.status(500).json({ error: "Failed to parse Gemini response" });
      return;
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const validated = GenerateCrimeSceneResponse.parse(parsed);
    req.log.info({ location: validated.location }, "Crime scene generated");
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating crime scene");
    res.status(500).json({ error: (err as Error)?.message ?? "Failed to generate crime scene" });
  }
});

router.post("/crime-scene/evaluate", async (req, res): Promise<void> => {
  const {
    difficulty,
    location,
    description,
    clues,
    crimeType,
    answers,
  } = req.body as {
    difficulty: Difficulty;
    location: string;
    description: string;
    clues: string[];
    crimeType: string;
    answers: { crimeType: string; firstEvidence: string; forensicTests: string };
  };

  req.log.info({ difficulty }, "Evaluating crime scene investigation");

  const prompt = `You are a senior forensic investigator and educator evaluating a trainee's crime scene analysis.

CRIME SCENE:
Location: ${location}
Description: ${description}
Observed Clues:
${clues.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}
Actual Crime Type (for your reference): ${crimeType}

TRAINEE'S ANSWERS:
1. Crime type identified: "${answers.crimeType}"
2. First evidence to collect: "${answers.firstEvidence}"
3. Forensic tests to run: "${answers.forensicTests}"

${DIFFICULTY_EVAL[difficulty]}

Evaluate all three answers. The total score must be out of 10 (distribute roughly 3/3/4 across the three questions, or adjust based on quality). Return ONLY valid JSON with NO markdown:
{
  "totalScore": 7,
  "crimeTypeFeedback": {
    "score": 3,
    "feedback": "What the trainee got right and wrong about identifying the crime type",
    "correctApproach": "What crime type this is and how the clues point to it"
  },
  "firstEvidenceFeedback": {
    "score": 2,
    "feedback": "Assessment of their evidence collection priority",
    "correctApproach": "What a real investigator would collect first and why (chain of custody, perishability, etc.)"
  },
  "forensicTestsFeedback": {
    "score": 2,
    "feedback": "Assessment of the forensic tests they suggested",
    "correctApproach": "The specific tests a forensic lab would run, with brief explanation of what each reveals"
  },
  "investigatorApproach": "2–3 sentences describing the complete methodical approach a senior forensic investigator would take from arrival to lab submission"
}`;

  try {
    const text = await geminiGenerate(prompt);
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      res.status(500).json({ error: "Failed to parse evaluation response" });
      return;
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const validated = EvaluateCrimeSceneResponse.parse(parsed);
    req.log.info({ totalScore: validated.totalScore }, "Crime scene evaluated");
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error evaluating crime scene");
    res.status(500).json({ error: (err as Error)?.message ?? "Failed to evaluate investigation" });
  }
});

export default router;
