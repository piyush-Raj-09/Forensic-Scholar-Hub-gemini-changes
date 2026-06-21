import { useState } from "react";
import { useGenerateCrossword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { DifficultySelector, LevelBadge, type Difficulty } from "@/components/DifficultySelector";

export default function Crossword() {
  const generateCrossword = useGenerateCrossword();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const data = generateCrossword.data;
  const grid = data?.grid;
  const clues = data?.clues ?? [];
  const gridSize = data?.gridSize ?? 15;

  const handleStart = () => {
    if (!difficulty) return;
    setUserGrid({});
    setChecked(false);
    generateCrossword.mutate({ data: { difficulty } });
  };

  const handleBack = () => {
    generateCrossword.reset();
    setUserGrid({});
    setChecked(false);
    setDifficulty(null);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (checked) setChecked(false);
    setUserGrid((prev) => ({ ...prev, [`${row}-${col}`]: value.slice(-1).toUpperCase() }));
  };

  // Check how many words are fully correct
  const correctWords = checked ? clues.filter((clue) => {
    for (let i = 0; i < clue.length; i++) {
      const r = clue.direction === "across" ? clue.row : clue.row + i;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      const key = `${r}-${c}`;
      const correctLetter = grid?.[r]?.[c];
      if (!correctLetter || userGrid[key] !== correctLetter) return false;
    }
    return true;
  }) : [];

  // ── Error ─────────────────────────────────────────────────────────────────
  if (generateCrossword.isError) {
    const errMsg =
      (generateCrossword.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (generateCrossword.error as Error)?.message ?? "An unknown error occurred.";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="max-w-lg w-full p-6 rounded-xl border border-destructive/50 bg-destructive/10 space-y-4">
          <h2 className="font-mono text-destructive text-xl font-bold tracking-widest">GENERATION FAILED</h2>
          <p className="text-sm text-muted-foreground font-mono break-words">{errMsg}</p>
          <div className="flex gap-3">
            <Button onClick={handleBack} variant="ghost" className="font-mono">BACK</Button>
            <Button onClick={handleStart} variant="outline" className="font-mono border-destructive/50">RETRY</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (generateCrossword.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">CONSTRUCTING MATRIX...</p>
      </div>
    );
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!grid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-primary font-mono">Crossword</h1>
            <p className="text-muted-foreground text-sm">Solve the forensic matrix · 15×15 grid</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <Button size="lg" onClick={handleStart} disabled={!difficulty} className="w-full font-mono font-bold tracking-widest text-base h-12">
              GENERATE MATRIX
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const acrossClues = clues.filter((c) => c.direction === "across").sort((a, b) => a.number - b.number);
  const downClues = clues.filter((c) => c.direction === "down").sort((a, b) => a.number - b.number);
  const numberMap: Record<string, number> = {};
  clues.forEach((c) => { numberMap[`${c.row}-${c.col}`] = c.number; });

  // Build a set of cells that belong to correct words (for green highlight)
  const correctCells = new Set<string>();
  if (checked) {
    for (const clue of correctWords) {
      for (let i = 0; i < clue.length; i++) {
        const r = clue.direction === "across" ? clue.row : clue.row + i;
        const c = clue.direction === "across" ? clue.col + i : clue.col;
        correctCells.add(`${r}-${c}`);
      }
    }
  }

  // ── Active crossword ──────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Sticky header */}
      <div className="sticky top-[56px] z-40 bg-background/80 backdrop-blur-xl border border-border/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}
          <span className="text-sm font-mono text-muted-foreground hidden sm:block">Forensic Matrix</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {checked && correctWords.length > 0 && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
              {correctWords.length}/{clues.length} correct
            </span>
          )}
          <Button
            onClick={() => setChecked(true)}
            variant="default"
            size="sm"
            className="font-mono text-xs h-8"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verify
          </Button>
          <Button onClick={handleStart} variant="outline" size="icon" className="h-8 w-8" title="New puzzle">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Grid */}
        <div className="lg:col-span-3">
          <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card/20 p-4">
            <div
              className="grid mx-auto w-max"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                gap: "2px",
                backgroundColor: "hsl(var(--border) / 0.3)",
                padding: "2px",
                borderRadius: "8px",
              }}
            >
              {grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isBlack = cell === null;
                  const cellKey = `${rIdx}-${cIdx}`;
                  const userVal = userGrid[cellKey] ?? "";
                  const clueNum = numberMap[cellKey];
                  const isCorrectCell = correctCells.has(cellKey);
                  const isWrongCell = checked && !isBlack && userVal !== "" && userVal !== cell;

                  if (isBlack) {
                    return (
                      <div
                        key={cellKey}
                        className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-sm"
                        style={{ backgroundColor: "hsl(var(--background))" }}
                      />
                    );
                  }

                  return (
                    <div
                      key={cellKey}
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-sm transition-colors duration-200
                        ${isCorrectCell ? "bg-emerald-500/20 ring-1 ring-inset ring-emerald-500/40"
                        : isWrongCell ? "bg-destructive/20 ring-1 ring-inset ring-destructive/40"
                        : "bg-card"}`}
                    >
                      {clueNum && (
                        <span className="absolute top-0.5 left-0.5 text-[7px] sm:text-[8px] text-muted-foreground/60 leading-none select-none font-sans">
                          {clueNum}
                        </span>
                      )}
                      <input
                        type="text"
                        maxLength={1}
                        className={`absolute inset-0 w-full h-full bg-transparent text-center uppercase font-mono font-bold text-xs sm:text-sm focus:outline-none focus:bg-primary/10 caret-transparent transition-colors
                          ${isCorrectCell ? "text-emerald-400" : isWrongCell ? "text-destructive" : "text-foreground"}`}
                        value={userVal}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Clues panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* ACROSS */}
          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-primary uppercase tracking-[0.2em]">
                → Across
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 px-4 pb-4">
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {acrossClues.map((clue) => {
                  const isCorrect = checked && correctWords.some((c) => c.id === clue.id);
                  return (
                    <li key={clue.id} className={`flex gap-2.5 items-start text-sm transition-colors ${isCorrect ? "text-emerald-400" : ""}`}>
                      <span className={`font-mono font-bold shrink-0 w-6 text-right text-xs mt-0.5 ${isCorrect ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {clue.number}.
                      </span>
                      <span className={`leading-snug ${isCorrect ? "text-emerald-300" : "text-foreground/80"}`}>
                        {clue.clue}
                        <span className="text-muted-foreground/50 text-xs ml-1">({clue.length})</span>
                        {isCorrect && <CheckCircle2 className="inline w-3 h-3 ml-1 text-emerald-400" />}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* DOWN */}
          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-primary uppercase tracking-[0.2em]">
                ↓ Down
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 px-4 pb-4">
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {downClues.map((clue) => {
                  const isCorrect = checked && correctWords.some((c) => c.id === clue.id);
                  return (
                    <li key={clue.id} className={`flex gap-2.5 items-start text-sm transition-colors ${isCorrect ? "text-emerald-400" : ""}`}>
                      <span className={`font-mono font-bold shrink-0 w-6 text-right text-xs mt-0.5 ${isCorrect ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {clue.number}.
                      </span>
                      <span className={`leading-snug ${isCorrect ? "text-emerald-300" : "text-foreground/80"}`}>
                        {clue.clue}
                        <span className="text-muted-foreground/50 text-xs ml-1">({clue.length})</span>
                        {isCorrect && <CheckCircle2 className="inline w-3 h-3 ml-1 text-emerald-400" />}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
