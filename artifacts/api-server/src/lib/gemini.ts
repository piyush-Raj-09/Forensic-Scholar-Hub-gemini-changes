const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1/models";

export async function geminiGenerate(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${body}`);
  }

  const data = (await resp.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (data.error) throw new Error(data.error.message ?? "Unknown Gemini error");

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return text.trim();
}
