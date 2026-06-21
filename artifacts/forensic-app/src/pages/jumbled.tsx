import { useState } from "react";
import { useGenerateJumbled } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import type { JumbledWord } from "@workspace/api-client-react";
import { DifficultySelector, LevelBadge, type Difficulty } from "@/components/DifficultySelector";

export default function Jumbled() {
  const generateJumbled = useGenerateJumbled();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, "idle" | "correct" | "wrong" | "revealed">>({});

  const words = generateJumbled.data?.words ?? [];

  const handleStart = () => {
    if (!difficulty) return;
    setInputs({});
    setStatuses({});
    generateJumbled.mutate({ data: { difficulty } });
  };

  const handleBack = () => {
    generateJumbled.reset();
    setInputs({});
    setStatuses({});
    setDifficulty(null);
  };

  const handleCheck = (word: JumbledWord) => {
    const input = inputs[word.id] ?? "";
    if (input.trim().toLowerCase() === word.answer.toLowerCase()) {
      setStatuses((prev) => ({ ...prev, [word.id]: "correct" }));
    } else {
      setStatuses((prev) => ({ ...prev, [word.id]: "wrong" }));
      setTimeout(() => {
        setStatuses((prev) => {
          if (prev[word.id] === "wrong") return { ...prev, [word.id]: "idle" };
          return prev;
        });
      }, 820);
    }
  };

  const handleReveal = (id: number, answer: string) => {
    setInputs((prev) => ({ ...prev, [id]: answer }));
    setStatuses((prev) => ({ ...prev, [id]: "revealed" }));
  };

  const score = Object.values(statuses).filter((s) => s === "correct").length;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (generateJumbled.isError) {
    const errMsg =
      (generateJumbled.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (generateJumbled.error as Error)?.message ?? "An unknown error occurred.";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="max-w-lg w-full p-6 rounded-xl border border-destructive/50 bg-destructive/10 space-y-4">
          <h2 className="font-mono text-destructive text-xl font-bold tracking-widest">GENERATION FAILED</h2>
          <p className="text-sm text-muted-foreground font-mono break-words">{errMsg}</p>
          <div className="flex gap-3">
            <Button onClick={handleBack} variant="ghost" className="font-mono">BACK</Button>
            <Button onClick={handleStart} variant="outline" className="font-mono border-destructive/50 hover:bg-destructive/10">RETRY</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (generateJumbled.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">SCRAMBLING DATA...</p>
      </div>
    );
  }

  // ── Level select / Start screen ──────────────────────────────────────────
  if (!words.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-mono text-primary">Jumbled Words</CardTitle>
            <CardDescription className="text-base">Unscramble 8 forensic terms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2 pb-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!difficulty}
              className="w-full font-mono font-bold tracking-widest"
            >
              GENERATE WORDS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between sticky top-[72px] z-40 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}
          <h2 className="text-xl font-mono font-bold tracking-tight hidden sm:block">Decrypt Terminology</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-muted-foreground">
            Score: <span className="text-primary font-bold text-xl">{score}</span>/8
          </div>
          <Button onClick={handleStart} variant="outline" size="sm" className="font-mono">
            <RefreshCw className="w-4 h-4 mr-2" /> RESTART
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {words.map((word, idx) => {
          const status = statuses[word.id] ?? "idle";
          const isCorrect = status === "correct";
          const isRevealed = status === "revealed";
          const isWrong = status === "wrong";
          const isLocked = isCorrect || isRevealed;
          return (
            <Card key={word.id} className={`border-border/50 overflow-hidden transition-colors ${isCorrect ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]" : ""}`}>
              <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Entry #{idx + 1}</span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  {isRevealed && <Eye className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="text-center py-4">
                  <h3 className={`text-4xl font-mono font-bold tracking-[0.2em] uppercase text-foreground ${isWrong ? "animate-[shake_0.82s_cubic-bezier(.36,.07,.19,.97)_both] text-destructive" : ""}`}>
                    {word.scrambled}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/30 rounded text-sm text-muted-foreground border border-border/30 flex gap-3 items-start">
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
                  <p>{word.hint}</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={inputs[word.id] ?? ""}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [word.id]: e.target.value.toUpperCase() }))}
                    placeholder="Enter decrypted term..."
                    className={`font-mono uppercase ${isCorrect ? "border-primary text-primary focus-visible:ring-primary" : isRevealed ? "border-muted text-muted-foreground" : isWrong ? "border-destructive text-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLocked}
                    onKeyDown={(e) => { if (e.key === "Enter" && !isLocked) handleCheck(word); }}
                  />
                  {!isLocked && (
                    <Button onClick={() => handleCheck(word)} className="font-mono font-bold w-24 shrink-0">
                      VERIFY
                    </Button>
                  )}
                </div>
              </CardContent>
              {!isLocked && (
                <CardFooter className="pt-0 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleReveal(word.id, word.answer)} className="text-xs font-mono text-muted-foreground hover:text-foreground">
                    <Eye className="w-3 h-3 mr-2" /> REVEAL
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
