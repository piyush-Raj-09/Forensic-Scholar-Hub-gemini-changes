import { Router, type IRouter } from "express";
import { GenerateCrosswordResponse } from "@workspace/api-zod";
import { geminiGenerate } from "../lib/gemini";

const router: IRouter = Router();

const CROSSWORD_WORD_POOL = [
  // DNA / serology
  "ALLELE", "LOCUS", "GENOME", "PRIMER", "NUCLEOTIDE", "HELIX", "SEROLOGY", "ANTIBODY", "ANTIGEN",
  // Fingerprints
  "WHORL", "LOOP", "ARCH", "RIDGE", "DELTA", "CORE", "LATENT", "PATENT", "BIFURCATION",
  // Pathology / death
  "LIVOR", "RIGOR", "PUTREFACTION", "ALGOR", "NECROSIS", "INQUEST", "LIVIDITY",
  // Toxicology
  "TOXIN", "REAGENT", "ALKALOID", "ANTIDOTE", "NARCOTIC", "METABOLITE",
  // Ballistics
  "CALIBER", "RIFLING", "BORE", "MUZZLE", "STRIATIONS", "PELLET",
  // Crime scene
  "LUMINOL", "LOCARD", "EXEMPLAR", "SUBSTRATE", "SWAB", "CASTING",
  // Entomology
  "MAGGOT", "BLOWFLY", "PUPA", "LARVA",
  // Trace / misc
  "FIBER", "SPATTER", "TRAJECTORY", "SUBSTRATE", "MODUS", "CORPUS",
];

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
  const seed = Math.floor(Math.random() * 1_000_000);
  const pickedWords = shuffleAndPick(CROSSWORD_WORD_POOL, 12);
  req.log.info({ seed }, "Generating forensic crossword");

  const prompt = `SESSION SEED: ${seed} — generate a unique crossword layout different from any previous response.

Create a crossword puzzle with exactly 8 forensic science terms placed on a 15x15 grid (rows and cols 0-14). Mix "across" and "down" directions.

PREFERRED WORDS FOR THIS SESSION (pick 8 of these, chosen to fit well together):
${pickedWords.join(", ")}

You may substitute a word with another forensic term if it helps the grid fit better, but prefer the list above to ensure variety across sessions.

STRICT RULES:
- Every word must fit entirely within the 15x15 grid (row + length ≤ 15 for across; col + length ≤ 15 for down — wait, for across: col + length ≤ 15; for down: row + length ≤ 15)
- Use only UPPERCASE letters
- Words should be 4-12 characters long
- Vary start positions widely across the grid; do not cluster all words in one corner
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

length must equal the exact character count of the answer. Provide exactly 8 clues.`;

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
