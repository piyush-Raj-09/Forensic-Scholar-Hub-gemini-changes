import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateCrosswordResponse } from "@workspace/api-zod";

const router: IRouter = Router();

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
      if (r < gridSize && c < gridSize) {
        grid[r][c] = letters[i];
      }
    }
  }

  return grid;
}

router.post("/crossword/generate", async (req, res): Promise<void> => {
  req.log.info("Generating forensic crossword");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Create a simple crossword puzzle with exactly 8 forensic science terms. Place them on a 15x15 grid (rows and cols 0-14). Mix "across" and "down" directions. Make sure words intersect naturally where possible.

IMPORTANT RULES:
- Each word must fit within the 15x15 grid
- Use only UPPERCASE letters
- Words should be 4-12 characters long
- Pick terms from: DNA, RIGOR, LATENT, BALLISTICS, TOXIN, AUTOPSY, LUMINOL, SEROLOGY, LOCARD, FORENSIC, FIBER, MODUS, CORPUS, LIVOR, SPATTER, CAST, BORE, CALIBER, PRINTS, RIDGE, WHORL, LOOP, ARCH, CORE, DELTA, EXEMPLAR

Return ONLY valid JSON, no markdown:
{
  "clues": [
    {
      "id": 1,
      "number": 1,
      "direction": "across",
      "clue": "Genetic material used for identification",
      "answer": "DNA",
      "row": 0,
      "col": 0,
      "length": 3
    },
    {
      "id": 2,
      "number": 2,
      "direction": "down",
      "clue": "Post-mortem stiffening of muscles",
      "answer": "RIGOR",
      "row": 0,
      "col": 2,
      "length": 5
    }
  ],
  "gridSize": 15
}

Make sure length matches the actual answer length. Vary the starting positions so words don't overlap incorrectly. Provide exactly 8 clues with a mix of across and down.`;

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

    if (parsed.clues) {
      parsed.clues = parsed.clues.map((c: { id?: number; length?: number; answer?: string }, i: number) => ({
        ...c,
        id: c.id ?? i + 1,
        length: c.length ?? (c.answer?.length ?? 0),
      }));
    }

    const grid = buildGrid(parsed.clues ?? [], parsed.gridSize ?? 15);
    parsed.grid = grid;

    const validated = GenerateCrosswordResponse.parse(parsed);
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating crossword");
    const msg = (err as Error)?.message ?? "Failed to generate crossword puzzle";
    res.status(500).json({ error: msg });
  }
});

export default router;
