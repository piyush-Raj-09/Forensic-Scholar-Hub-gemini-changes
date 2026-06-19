import { useState, useEffect, useRef } from "react";
import { useGenerateQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Timer, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Quiz() {
  const generateQuiz = useGenerateQuiz();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const questions = generateQuiz.data?.questions || [];

  const handleStart = () => {
    setAnswers({});
    setIsFinished(false);
    setTimeRemaining(300);
    generateQuiz.mutate(undefined);
  };

  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions.length, isFinished]);

  const handleAnswer = (questionId: number, optionIndex: number) => {
    if (isFinished) return;
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionIndex };
      if (Object.keys(next).length === questions.length) {
        setIsFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const score = questions.reduce((acc, q) => {
    return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
  }, 0);

  if (generateQuiz.isError) {
    const errMsg = (generateQuiz.error as { response?: { data?: { error?: string } } })?.response?.data?.error
      ?? (generateQuiz.error as Error)?.message
      ?? "An unknown error occurred.";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" data-testid="error-state">
        <div className="max-w-lg w-full p-6 rounded-xl border border-destructive/50 bg-destructive/10 space-y-4">
          <h2 className="font-mono text-destructive text-xl font-bold tracking-widest">GENERATION FAILED</h2>
          <p className="text-sm text-muted-foreground font-mono break-words">{errMsg}</p>
          <Button onClick={handleStart} variant="outline" className="font-mono border-destructive/50 hover:bg-destructive/10" data-testid="button-retry-quiz">
            RETRY
          </Button>
        </div>
      </div>
    );
  }

  if (generateQuiz.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" data-testid="loading-state">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">ANALYZING DATABASE...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-mono text-primary">Forensic Quiz</CardTitle>
            <CardDescription className="text-lg">Test your knowledge with 8 AI-generated questions.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Button size="lg" onClick={handleStart} className="font-mono font-bold tracking-widest px-8" data-testid="button-start-quiz">
              GENERATE QUESTIONS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)] bg-card/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-mono text-primary">EVALUATION COMPLETE</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-primary/20 bg-primary/5">
              <span className="text-5xl font-bold text-foreground">
                {score}<span className="text-2xl text-muted-foreground">/8</span>
              </span>
            </div>
            <p className="text-xl text-muted-foreground">
              {score >= 6 ? "Excellent analytical skills." : score >= 4 ? "Satisfactory performance." : "Further training required."}
            </p>
            <Button size="lg" onClick={handleStart} className="font-mono tracking-widest mt-4" data-testid="button-new-round">
              <RefreshCw className="w-4 h-4 mr-2" /> NEW ROUND
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h3 className="text-2xl font-mono text-foreground border-b border-border/50 pb-2">Detailed Report</h3>
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isUnanswered = userAnswer === undefined;
            return (
              <Card key={q.id} className={`border-l-4 ${isCorrect ? "border-l-emerald-500" : isUnanswered ? "border-l-muted" : "border-l-destructive"}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : isUnanswered ? <AlertCircle className="w-6 h-6 text-muted-foreground" /> : <XCircle className="w-6 h-6 text-destructive" />}
                    </div>
                    <div>
                      <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Question {idx + 1} • {q.domain}</CardDescription>
                      <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-10">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === optIdx;
                      const isActualCorrect = q.correctAnswer === optIdx;
                      
                      let bgClass = "bg-muted/30 border-transparent";
                      if (isActualCorrect) bgClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-500";
                      else if (isSelected && !isActualCorrect) bgClass = "bg-destructive/10 border-destructive/50 text-destructive";

                      return (
                        <div key={optIdx} className={`p-3 rounded border ${bgClass} text-sm flex items-center justify-between`}>
                          <span>{opt}</span>
                          {isActualCorrect && <CheckCircle2 className="w-4 h-4" />}
                          {isSelected && !isActualCorrect && <XCircle className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pl-10 mt-4 p-4 bg-muted/20 rounded-md border border-border/50 text-sm">
                    <span className="font-mono text-primary font-bold mr-2">Explanation:</span>
                    <span className="text-muted-foreground">{q.explanation}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isDangerTime = timeRemaining < 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between sticky top-[72px] z-40 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-border/50 shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-mono text-muted-foreground">Progress: {answeredCount}/8</span>
              <span className={`text-sm font-mono flex items-center gap-1 ${isDangerTime ? "text-destructive font-bold animate-pulse" : "text-primary"}`}>
                <Timer className="w-4 h-4" /> {formatTime(timeRemaining)}
              </span>
            </div>
            <Progress value={(answeredCount / 8) * 100} className="h-2" />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          return (
            <Card key={q.id} className="border-border/50 bg-card/30">
              <CardHeader>
                <CardDescription className="font-mono text-primary/80 uppercase tracking-widest text-xs mb-2">
                  Query {idx + 1} • {q.domain}
                </CardDescription>
                <CardTitle className="text-xl leading-relaxed">{q.question}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswer(q.id, optIdx)}
                      className={`text-left p-4 rounded-md border transition-all duration-200 flex items-start gap-3
                        ${isSelected 
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)] ring-1 ring-primary/50" 
                          : "bg-muted/20 border-transparent hover:bg-muted hover:border-primary/30"
                        }
                      `}
                      data-testid={`btn-option-${q.id}-${optIdx}`}
                    >
                      <div className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center font-mono text-xs
                        ${isSelected ? "border-primary text-primary" : "border-muted-foreground/50 text-muted-foreground"}
                      `}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className={isSelected ? "text-foreground font-medium" : "text-muted-foreground"}>{opt}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}