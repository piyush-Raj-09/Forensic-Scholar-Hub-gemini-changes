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

/** Fisher-Yates shuffle on a character array, guaranteed not equal to original. */
function scrambleWord(word: string): string {
  if (word.length <= 1) return word;
  const letters = word.split("");
  let result: string;
  let attempts = 0;
  do {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    result = letters.join("");
    attempts++;
  } while (result === word && attempts < 100);
  return result;
}

/** Verify the scrambled version is an exact anagram of the original. */
function isValidScramble(original: string, scrambled: string): boolean {
  if (original.length !== scrambled.length) return false;
  const freq: Record<string, number> = {};
  for (const ch of original) freq[ch] = (freq[ch] ?? 0) + 1;
  for (const ch of scrambled) {
    if (!freq[ch]) return false;
    freq[ch]--;
  }
  return true;
}

router.post("/jumbled/generate", async (req, res): Promise<void> => {
  const seed = Math.floor(Math.random() * 1_000_000);
  const pickedDomains = shuffleAndPick(JUMBLED_DOMAINS, 8);
  req.log.info({ seed }, "Generating jumbled forensic words");

  const prompt = `SESSION SEED: ${seed} — produce a unique word set different from any previous response.

Generate exactly 8 forensic science vocabulary words — one per domain listed below. Return ONLY the answer word and a hint. Do NOT generate any scrambled/jumbled version — that will be handled separately.

Domains (one word per domain, in this order):
${pickedDomains.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Rules for word selection:
- Use real, single-word forensic science terms only
- Words must be 5-12 uppercase letters (e.g. RIGOR, HISTOLOGY, LUMINOL)
- Avoid overly common words like DNA, AUTOPSY, FORENSIC
- The seed ${seed} means you must vary your word choices; avoid the most frequently used examples

Return ONLY valid JSON, no markdown:
{
  "words": [
    {
      "id": 1,
      "answer": "HISTOLOGY",
      "hint": "The microscopic study of tissue samples, used to determine cause and manner of death"
    }
  ]
}`;

  try {
    const text = await geminiGenerate(prompt);

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      req.log.error({ text }, "No JSON found in Gemini response");
      res.status(500).json({ error: "Failed to parse Gemini response" });
      return;
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      words?: Array<{ id?: number; answer?: string; hint?: string }>;
    };

    if (!Array.isArray(parsed.words)) {
      res.status(500).json({ error: "Unexpected response shape from AI" });
      return;
    }

    // Scramble every word server-side — Gemini never handles this
    const words = parsed.words.map((w, i) => {
      const answer = (w.answer ?? "").toUpperCase().replace(/[^A-Z]/g, "");
      const scrambled = scrambleWord(answer);

      if (!isValidScramble(answer, scrambled)) {
        req.log.warn({ answer, scrambled }, "Scramble validation failed; falling back to reverse");
        // Last-resort fallback: reverse the word (always a valid anagram)
        const reversed = answer.split("").reverse().join("");
        return { id: w.id ?? i + 1, scrambled: reversed === answer ? scrambled : reversed, hint: w.hint ?? "", answer };
      }

      return { id: w.id ?? i + 1, scrambled, hint: w.hint ?? "", answer };
    });

    req.log.info({ words: words.map(w => `${w.answer} → ${w.scrambled}`) }, "Scramble results");

    const validated = GenerateJumbledResponse.parse({ words });
    res.json(validated);
  } catch (err) {
    req.log.error({ err }, "Error generating jumbled words");
    res.status(500).json({ error: (err as Error)?.message ?? "Failed to generate jumbled words" });
  }
});

export default router;
