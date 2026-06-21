import { Router, type IRouter } from "express";
import { GenerateCrosswordResponse } from "@workspace/api-zod";
import { geminiGenerate } from "../lib/gemini";

const router: IRouter = Router();

type Difficulty = "easy" | "intermediate" | "hard";

const EASY_WORDS = [
  "DNA", "BLOOD", "FIBER", "SWAB", "CAST", "LOOP", "ARCH", "CORE",
  "BORE", "BODY", "CLUE", "CASE", "LEAD", "MARK", "SCAN", "PRINT",
  "TRACE", "TOXIN", "RIGOR", "LIVOR", "LATEX",
];
const INTERMEDIATE_WORDS = [
  "ALLELE", "LATENT", "PATENT", "WHORL", "DELTA", "RIDGE", "SEROLOGY",
  "AUTOPSY", "FORENSIC", "LUMINOL", "LOCARD", "RIFLING", "CALIBER",
  "MUZZLE", "CORPUS", "MAGGOT", "BLOWFLY", "LARVA", "FIBER",
  "SPATTER", "MODUS", "INQUEST", "NECROSIS", "REAGENT",
];
const HARD_WORDS = [
  "NUCLEOTIDE", "BIFURCATION", "PUTREFACTION", "LIVIDITY", "STRIATIONS",
  "ALKALOID", "METABOLITE", "TRAJECTORY", "EXEMPLAR", "SUBSTRATE",
  "PALYNOLOGY", "CRANIOMETRY", "HISTOLOGY", "PYROLYSIS", "DIAPAUSE",
  "NITROCELLULOSE", "CHROMATOGRAPHY", "TOXICOLOGY", "ENTOMOLOGY",
  "SEROLOGY", "ODONTOLOGY", "ANTHROPOLOGY",
];

const DIFFICULTY_WORD_POOLS: Record<Difficulty, string[]> = {
  easy: EASY_WORDS,
  intermediate: INTERMEDIATE_WORDS,
  hard: HARD_WORDS,
};

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: `DIFFICULTY: EASY
- Use only short, common forensic terms (3-6 letters preferred)
- Clues should be simple, plain-English definitions accessible to beginners
- Example clue style: "Genetic material used for ID" for DNA`,

  intermediate: `DIFFICULTY: INTERMEDIATE
- Use standard forensic science vocabulary (5-9 letters preferred)
- Clues should be descriptive but accessible to a forensic science student
- Example clue style: "Chemical that glows blue when it contacts haemoglobin" for LUMINOL`,

  hard: `DIFFICULTY: HARD
- Use advanced, technical forensic terms (7-14 letters)
- Clues should use precise scientific language and require expert knowledge
- Example clue style: "Sequentially ordered restriction-site polymorphisms used to construct DNA profiles" for RFLP`,
};

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function buildGrid(
  clues: Array<{ answer: string; row: number; col: number; direction: string }>,
  gridSize: number
): Array<Array<string | null>> {
  const grid: Array<Array<string | null>> = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  for (const clue of clues) {
    const letters = clue.answer.split("");
    for (let i = 0; i < letters.length; i++) {
      const r = clue.direction === "across" ? clue.row : clue.row + i;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      if (r < gridSize && c < gridSize) grid[r][c] = letters[i];
    }
  }
  return grid;
}

router.post("/crossword/generate", async (req, res): Promise<void> => {
  const difficulty: Difficulty = (req.body?.difficulty as Difficulty) ?? "intermediate";
  const seed = Math.floor(Math.random() * 1_000_000);
  const pool = DIFFICULTY_WORD_POOLS[difficulty];
  const pickedWords = shuffleAndPick(pool, 12);
  req.log.info({ seed, difficulty }, "Generating forensic crossword");

  const prompt = `SESSION SEED: ${seed} — generate a unique crossword layout different from any previous response.

${DIFFICULTY_INSTRUCTIONS[difficulty]}

Create a crossword puzzle with exactly 8 forensic science terms placed on a 15x15 grid (rows and cols 0-14). Mix "across" and "down" directions.

PREFERRED WORDS FOR THIS SESSION (pick 8 that fit well together on the grid):
${pickedWords.join(", ")}

You may substitute a word with another forensic term at the same difficulty level if it helps the grid fit better.

STRICT RULES:
- Every word must fit entirely within the grid: for "across" words, col + length ≤ 15; for "down" words, row + length ≤ 15
- Use only UPPERCASE letters
- Vary start positions across the grid; do not cluster words in one corner
- Words may share letters at intersections but must not incorrectly overwrite each other

Return ONLY valid JSON, no markdown:
{
  "clues": [
    {
      "id": 1,
      "number": 1,
      "direction": "across",
      "clue": "Fingerprint pattern with a central circular design",
      "answer": "WHORL",
      "row": 0,
      "col": 0,
      "length": 5
    }
  ],
  "gridSize": 15
}

length must equal the exact character count of answer. Provide exactly 8 clues.`;

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

    if (parsed.clues) {
      parsed.clues = parsed.clues.map((c: { id?: number; length?: number; answer?: string }, i: number) => ({
        ...c,
        id: c.id ?? i + 1,
        length: c.length ?? (c.answer?.length ?? 0),
      }));
    }

    parsed.grid = buildGrid(parsed.clues ?? [], parsed.gridSize ?? 15);
    const validated = GenerateCrosswordResponse.parse(parsed);
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating crossword");
    res.status(500).json({ error: (err as Error)?.message ?? "Failed to generate crossword puzzle" });
  }
});

export default router;
