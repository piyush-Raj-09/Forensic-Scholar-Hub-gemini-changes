import { useState } from "react";
import { useGenerateJumbled } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CheckCircle2, XCircle, RefreshCw, Eye } from "lucide-react";
import type { JumbledWord } from "@workspace/api-client-react";
import { DifficultySelector, LevelBadge, type Difficulty } from "@/components/DifficultySelector";

export default function Jumbled() {
  const generateJumbled = useGenerateJumbled();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, "idle" | "correct" | "wrong" | "revealed">>({});

  const words = generateJumbled.data?.words ?? [];
  const score = Object.values(statuses).filter((s) => s === "correct").length;
  const allDone = words.length > 0 && words.every((w) => statuses[w.id] === "correct" || statuses[w.id] === "revealed");

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
    const input = (inputs[word.id] ?? "").trim().toUpperCase();
    if (input === word.answer.toUpperCase()) {
      setStatuses((prev) => ({ ...prev, [word.id]: "correct" }));
    } else {
      setStatuses((prev) => ({ ...prev, [word.id]: "wrong" }));
      setTimeout(() => {
        setStatuses((prev) => prev[word.id] === "wrong" ? { ...prev, [word.id]: "idle" } : prev);
      }, 820);
    }
  };

  const handleReveal = (id: number, answer: string) => {
    setInputs((prev) => ({ ...prev, [id]: answer }));
    setStatuses((prev) => ({ ...prev, [id]: "revealed" }));
  };

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
            <Button onClick={handleStart} variant="outline" className="font-mono border-destructive/50">RETRY</Button>
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

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!words.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-primary font-mono">Jumbled Words</h1>
            <p className="text-muted-foreground text-sm">Unscramble 8 forensic terms</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <Button size="lg" onClick={handleStart} disabled={!difficulty} className="w-full font-mono font-bold tracking-widest text-base h-12">
              GENERATE WORDS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Sticky header */}
      <div className="sticky top-[56px] z-40 bg-background/80 backdrop-blur-xl border border-border/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}
          <span className="text-sm font-mono hidden sm:block text-muted-foreground">Decrypt Terminology</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Score ring */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-mono text-muted-foreground">Score</div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold text-primary text-sm">
              {score}
            </div>
            <div className="text-sm font-mono text-muted-foreground">/ 8</div>
          </div>
          <Button onClick={handleStart} variant="outline" size="sm" className="font-mono h-8 px-3 text-xs gap-1.5">
            <RefreshCw className="w-3 h-3" /> Restart
          </Button>
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.1)] animate-in fade-in duration-500">
          <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="font-mono font-bold text-primary">All words solved!</p>
            <p className="text-sm text-muted-foreground">{score} correct · {words.length - score} revealed</p>
          </div>
          <Button onClick={handleStart} size="sm" className="ml-auto font-mono shrink-0">
            <RefreshCw className="w-3 h-3 mr-1.5" /> Play Again
          </Button>
        </div>
      )}

      {/* Word cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {words.map((word, idx) => {
          const status = statuses[word.id] ?? "idle";
          const isCorrect = status === "correct";
          const isRevealed = status === "revealed";
          const isWrong = status === "wrong";
          const isLocked = isCorrect || isRevealed;

          return (
            <Card
              key={word.id}
              className={`overflow-hidden transition-all duration-300 animate-word-in
                ${isCorrect ? "border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                : isRevealed ? "border-border/30 opacity-80"
                : "border-border/40"}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Scrambled word display */}
              <CardHeader className="pb-4 bg-muted/10 border-b border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Entry #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCorrect && (
                      <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Correct
                      </span>
                    )}
                    {isRevealed && (
                      <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/30 border border-border/30 rounded-full px-2 py-0.5">
                        <Eye className="w-3 h-3" /> Revealed
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center py-2">
                  <span
                    className={`text-4xl sm:text-5xl font-mono font-black tracking-[0.15em] uppercase select-none
                      ${isCorrect ? "text-emerald-400" : isRevealed ? "text-muted-foreground" : "text-foreground"}
                      ${isWrong ? "animate-shake text-destructive" : ""}`}
                  >
                    {word.scrambled}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-4">
                {/* Hint */}
                <div className="flex gap-3 items-start p-3 bg-muted/20 rounded-xl border border-border/20">
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{word.hint}</p>
                </div>

                {/* Input row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={inputs[word.id] ?? ""}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [word.id]: e.target.value.toUpperCase() }))}
                      placeholder="Type your answer…"
                      className={`font-mono uppercase tracking-widest text-center h-11 text-base pr-10 transition-all duration-200
                        ${isCorrect ? "border-emerald-500/60 bg-emerald-500/5 text-emerald-400 focus-visible:ring-emerald-500/30"
                        : isRevealed ? "border-border/20 text-muted-foreground"
                        : isWrong ? "border-destructive/60 bg-destructive/5 text-destructive focus-visible:ring-destructive/30"
                        : "focus-visible:ring-primary/30"}`}
                      disabled={isLocked}
                      onKeyDown={(e) => { if (e.key === "Enter" && !isLocked) handleCheck(word); }}
                    />
                    {isCorrect && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
                    {isWrong && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />}
                  </div>
                  {!isLocked && (
                    <Button onClick={() => handleCheck(word)} className="font-mono font-bold w-24 h-11 shrink-0">
                      CHECK
                    </Button>
                  )}
                </div>
              </CardContent>

              {!isLocked && (
                <CardFooter className="pt-0 pb-4 justify-end">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleReveal(word.id, word.answer)}
                    className="text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground h-7"
                  >
                    <Eye className="w-3 h-3 mr-1.5" /> Reveal answer
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
