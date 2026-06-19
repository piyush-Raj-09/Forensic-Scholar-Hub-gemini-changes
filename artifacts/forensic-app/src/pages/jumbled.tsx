import { useState } from "react";
import { useGenerateJumbled } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import type { JumbledWord } from "@workspace/api-client-react";

export default function Jumbled() {
  const generateJumbled = useGenerateJumbled();
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, "idle" | "correct" | "wrong" | "revealed">>({});

  const words = generateJumbled.data?.words || [];

  const handleStart = () => {
    setInputs({});
    setStatuses({});
    generateJumbled.mutate(undefined);
  };

  const handleCheck = (word: JumbledWord) => {
    const input = inputs[word.id] || "";
    if (input.trim().toLowerCase() === word.answer.toLowerCase()) {
      setStatuses((prev) => ({ ...prev, [word.id]: "correct" }));
    } else {
      setStatuses((prev) => ({ ...prev, [word.id]: "wrong" }));
      // Auto-reset wrong status after animation
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

  const score = Object.values(statuses).filter(s => s === "correct").length;

  if (generateJumbled.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" data-testid="loading-state">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">SCRAMBLING DATA...</p>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-mono text-primary">Jumbled Words</CardTitle>
            <CardDescription className="text-lg">Unscramble 8 forensic terms.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button size="lg" onClick={handleStart} className="font-mono font-bold tracking-widest px-8" data-testid="button-start-jumbled">
              GENERATE WORDS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between sticky top-[72px] z-40 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-border/50 shadow-sm">
        <h2 className="text-xl font-mono font-bold tracking-tight">Decrypt Terminology</h2>
        <div className="flex items-center gap-4">
          <div className="font-mono text-muted-foreground">
            Score: <span className="text-primary font-bold text-xl">{score}</span>/8
          </div>
          <Button onClick={handleStart} variant="outline" size="sm" className="font-mono" data-testid="button-new-round">
            <RefreshCw className="w-4 h-4 mr-2" /> RESTART
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {words.map((word, idx) => {
          const status = statuses[word.id] || "idle";
          const isCorrect = status === "correct";
          const isRevealed = status === "revealed";
          const isWrong = status === "wrong";
          const isLocked = isCorrect || isRevealed;

          return (
            <Card key={word.id} className={`border-border/50 overflow-hidden transition-colors ${isCorrect ? 'border-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]' : ''}`}>
              <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Entry #{idx + 1}</span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  {isRevealed && <Eye className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="text-center py-4">
                  <h3 className={`text-4xl font-mono font-bold tracking-[0.2em] uppercase text-foreground ${isWrong ? 'animate-[shake_0.82s_cubic-bezier(.36,.07,.19,.97)_both] text-destructive' : ''}`}>
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
                    value={inputs[word.id] || ""}
                    onChange={(e) => setInputs(prev => ({ ...prev, [word.id]: e.target.value.toUpperCase() }))}
                    placeholder="Enter decrypted term..."
                    className={`font-mono uppercase ${isCorrect ? 'border-primary text-primary focus-visible:ring-primary' : isRevealed ? 'border-muted text-muted-foreground' : isWrong ? 'border-destructive text-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isLocked}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLocked) handleCheck(word);
                    }}
                    data-testid={`input-jumbled-${word.id}`}
                  />
                  {!isLocked && (
                    <Button onClick={() => handleCheck(word)} className="font-mono font-bold w-24 shrink-0" data-testid={`button-check-${word.id}`}>
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