import { useState } from "react";
import { useGenerateCrossword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Check, X } from "lucide-react";

export default function Crossword() {
  const generateCrossword = useGenerateCrossword();
  const [userGrid, setUserGrid] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const data = generateCrossword.data;
  const grid = data?.grid;
  const clues = data?.clues || [];
  const gridSize = data?.gridSize || 15;

  const handleStart = () => {
    setUserGrid({});
    setChecked(false);
    generateCrossword.mutate(undefined);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (checked) setChecked(false);
    const char = value.slice(-1).toUpperCase();
    setUserGrid(prev => ({
      ...prev,
      [`${row}-${col}`]: char
    }));
  };

  if (generateCrossword.isError) {
    const errMsg = (generateCrossword.error as { response?: { data?: { error?: string } } })?.response?.data?.error
      ?? (generateCrossword.error as Error)?.message
      ?? "An unknown error occurred.";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" data-testid="error-state">
        <div className="max-w-lg w-full p-6 rounded-xl border border-destructive/50 bg-destructive/10 space-y-4">
          <h2 className="font-mono text-destructive text-xl font-bold tracking-widest">GENERATION FAILED</h2>
          <p className="text-sm text-muted-foreground font-mono break-words">{errMsg}</p>
          <Button onClick={handleStart} variant="outline" className="font-mono border-destructive/50 hover:bg-destructive/10" data-testid="button-retry-crossword">
            RETRY
          </Button>
        </div>
      </div>
    );
  }

  if (generateCrossword.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" data-testid="loading-state">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">CONSTRUCTING MATRIX...</p>
      </div>
    );
  }

  if (!grid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-mono text-primary">Crossword</CardTitle>
            <CardDescription className="text-lg">Solve the forensic matrix.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button size="lg" onClick={handleStart} className="font-mono font-bold tracking-widest px-8" data-testid="button-start-crossword">
              GENERATE MATRIX
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const acrossClues = clues.filter(c => c.direction === "across").sort((a, b) => a.number - b.number);
  const downClues = clues.filter(c => c.direction === "down").sort((a, b) => a.number - b.number);

  // Map to store clue numbers for cells
  const numberMap: Record<string, number> = {};
  clues.forEach(clue => {
    numberMap[`${clue.row}-${clue.col}`] = clue.number;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between sticky top-[72px] z-40 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-border/50 shadow-sm">
        <h2 className="text-xl font-mono font-bold tracking-tight">Forensic Matrix</h2>
        <div className="flex items-center gap-4">
          <Button onClick={() => setChecked(true)} variant="default" className="font-mono" data-testid="button-check-answers">
            VERIFY MATRIX
          </Button>
          <Button onClick={handleStart} variant="outline" size="icon" title="New Round" data-testid="button-new-round">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 overflow-x-auto p-4 bg-card/30 rounded-xl border border-border/50">
          <div 
            className="grid gap-[1px] bg-border p-[1px] mx-auto w-max shrink-0" 
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {grid.map((row, rIdx) => 
              row.map((cell, cIdx) => {
                const isBlack = cell === null;
                const cellKey = `${rIdx}-${cIdx}`;
                const userVal = userGrid[cellKey] || "";
                const clueNum = numberMap[cellKey];
                
                let cellClass = "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 relative flex items-center justify-center font-mono font-bold text-sm sm:text-base md:text-lg transition-colors";
                
                if (isBlack) {
                  cellClass += " bg-background";
                } else {
                  cellClass += " bg-card text-foreground";
                  if (checked) {
                    if (userVal === cell) cellClass += " bg-emerald-500/20 text-emerald-500 ring-1 ring-inset ring-emerald-500";
                    else if (userVal !== "") cellClass += " bg-destructive/20 text-destructive ring-1 ring-inset ring-destructive";
                  }
                }

                return (
                  <div key={cellKey} className={cellClass}>
                    {!isBlack && (
                      <>
                        {clueNum && <span className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] text-muted-foreground font-sans leading-none select-none">{clueNum}</span>}
                        <input
                          type="text"
                          maxLength={1}
                          className="absolute inset-0 w-full h-full bg-transparent text-center focus:outline-none focus:bg-primary/10 uppercase caret-transparent"
                          value={userVal}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          data-testid={`input-cell-${rIdx}-${cIdx}`}
                        />
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/30">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-mono text-primary flex items-center gap-2">ACROSS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
              <ul className="space-y-3">
                {acrossClues.map(clue => (
                  <li key={clue.id} className="text-sm flex gap-3 items-start">
                    <span className="font-mono font-bold text-muted-foreground w-6 shrink-0">{clue.number}.</span>
                    <span className="text-foreground leading-relaxed">{clue.clue} <span className="text-muted-foreground text-xs">({clue.length})</span></span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/30">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-mono text-primary flex items-center gap-2">DOWN</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
              <ul className="space-y-3">
                {downClues.map(clue => (
                  <li key={clue.id} className="text-sm flex gap-3 items-start">
                    <span className="font-mono font-bold text-muted-foreground w-6 shrink-0">{clue.number}.</span>
                    <span className="text-foreground leading-relaxed">{clue.clue} <span className="text-muted-foreground text-xs">({clue.length})</span></span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}