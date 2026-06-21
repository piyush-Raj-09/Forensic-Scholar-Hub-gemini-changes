import { useState, useEffect, useRef } from "react";
import { useGenerateQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Timer, CheckCircle2, XCircle, AlertCircle, RefreshCw, ClockAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DifficultySelector, LevelBadge, type Difficulty } from "@/components/DifficultySelector";

export default function Quiz() {
  const generateQuiz = useGenerateQuiz();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isFinished, setIsFinished] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [submitWarning, setSubmitWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = generateQuiz.data?.questions ?? [];

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleStart = () => {
    if (!difficulty) return;
    stopTimer();
    setAnswers({});
    setIsFinished(false);
    setIsTimeUp(false);
    setSubmitWarning(false);
    setTimeRemaining(300);
    generateQuiz.mutate({ data: { difficulty } });
  };

  const handleBack = () => {
    stopTimer();
    generateQuiz.reset();
    setAnswers({});
    setIsFinished(false);
    setIsTimeUp(false);
    setSubmitWarning(false);
    setTimeRemaining(300);
    setDifficulty(null);
  };

  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopTimer();
            setIsTimeUp(true);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, isFinished]);

  const handleAnswer = (questionId: number, optionIndex: number) => {
    if (isFinished) return;
    setSubmitWarning(false);
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      setSubmitWarning(true);
      const firstUnanswered = questions.find((q) => answers[q.id] === undefined);
      if (firstUnanswered) {
        document.getElementById(`question-${firstUnanswered.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    stopTimer();
    setIsFinished(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;
  const isDangerTime = timeRemaining < 60;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (generateQuiz.isError) {
    const errMsg =
      (generateQuiz.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (generateQuiz.error as Error)?.message ?? "An unknown error occurred.";
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
  if (generateQuiz.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">ANALYZING DATABASE...</p>
      </div>
    );
  }

  // ── Level select / Start screen ──────────────────────────────────────────
  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="max-w-md w-full border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-mono text-primary">Forensic Quiz</CardTitle>
            <CardDescription className="text-base">8 AI-generated questions with a 5-minute timer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2 pb-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!difficulty}
              className="w-full font-mono font-bold tracking-widest"
            >
              GENERATE QUESTIONS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Score card ────────────────────────────────────────────────────────────
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const verdict = score >= 7 ? "Excellent analytical skills." : score >= 5 ? "Satisfactory performance." : "Further training required.";
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)] bg-card/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            {isTimeUp && (
              <div className="flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-md bg-destructive/15 border border-destructive/40 mx-auto w-fit">
                <ClockAlert className="w-5 h-5 text-destructive" />
                <span className="font-mono text-destructive font-bold tracking-widest text-sm">TIME UP!</span>
              </div>
            )}
            <CardTitle className="text-4xl font-mono text-primary">{isTimeUp ? "TIME EXPIRED" : "EVALUATION COMPLETE"}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-6">
            <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-primary/30 bg-primary/5 gap-1">
              <span className="text-5xl font-bold text-foreground leading-none">
                {score}<span className="text-2xl text-muted-foreground">/{questions.length}</span>
              </span>
              <span className="text-sm font-mono text-primary">{percentage}%</span>
            </div>
            <p className="text-xl text-muted-foreground">{verdict}</p>
            {answeredCount < questions.length && (
              <p className="text-sm text-muted-foreground font-mono">
                {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} unanswered.
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" onClick={handleBack} className="font-mono tracking-widest">
                CHANGE LEVEL
              </Button>
              <Button size="lg" onClick={handleStart} className="font-mono tracking-widest">
                <RefreshCw className="w-4 h-4 mr-2" /> TRY AGAIN
              </Button>
            </div>
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
                      let bgClass = "bg-muted/30 border-transparent text-muted-foreground";
                      if (isActualCorrect) bgClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
                      else if (isSelected && !isActualCorrect) bgClass = "bg-destructive/10 border-destructive/50 text-destructive";
                      return (
                        <div key={optIdx} className={`p-3 rounded border ${bgClass} text-sm flex items-center justify-between`}>
                          <span>{opt}</span>
                          {isActualCorrect && <CheckCircle2 className="w-4 h-4 shrink-0 ml-2" />}
                          {isSelected && !isActualCorrect && <XCircle className="w-4 h-4 shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>
                  {!isUnanswered ? (
                    <div className="pl-10 mt-2 p-4 bg-muted/20 rounded-md border border-border/50 text-sm">
                      <span className="font-mono text-primary font-bold mr-2">Explanation:</span>
                      <span className="text-muted-foreground">{q.explanation}</span>
                    </div>
                  ) : (
                    <div className="pl-10 mt-2 p-4 bg-muted/10 rounded-md border border-border/30 text-sm">
                      <span className="font-mono text-primary font-bold mr-2">Correct answer:</span>
                      <span className="text-emerald-400">{q.options[q.correctAnswer]}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Active quiz ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between sticky top-[72px] z-40 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-border/50 shadow-sm gap-4">
        {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-mono text-muted-foreground">Progress: {answeredCount}/{questions.length}</span>
            <span className={`text-sm font-mono flex items-center gap-1 ${isDangerTime ? "text-destructive font-bold animate-pulse" : "text-primary"}`}>
              <Timer className="w-4 h-4" /> {formatTime(timeRemaining)}
            </span>
          </div>
          <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const highlightUnanswered = submitWarning && userAnswer === undefined;
          return (
            <Card
              key={q.id}
              id={`question-${q.id}`}
              className={`border-border/50 bg-card/30 transition-all duration-300 ${highlightUnanswered ? "border-destructive/60 shadow-[0_0_12px_hsl(var(--destructive)/0.25)]" : ""}`}
            >
              <CardHeader>
                <CardDescription className="font-mono text-primary/80 uppercase tracking-widest text-xs mb-2">
                  Query {idx + 1} • {q.domain}
                  {highlightUnanswered && <span className="ml-2 text-destructive font-bold">— Unanswered</span>}
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
                        ${isSelected ? "bg-primary/10 border-primary shadow-[0_0_15px_hsl(var(--primary)/0.15)] ring-1 ring-primary/50" : "bg-muted/20 border-transparent hover:bg-muted hover:border-primary/30"}
                      `}
                    >
                      <div className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center font-mono text-xs ${isSelected ? "border-primary text-primary" : "border-muted-foreground/50 text-muted-foreground"}`}>
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

      <div className="pt-4 pb-10 flex flex-col items-center gap-3">
        {submitWarning && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 text-destructive font-mono text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Please answer all questions before submitting — {questions.length - answeredCount} remaining.
          </div>
        )}
        <Button
          size="lg"
          onClick={handleSubmit}
          className={`font-mono font-bold tracking-widest px-12 transition-all duration-200 ${allAnswered ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : "opacity-80"}`}
        >
          SUBMIT QUIZ
        </Button>
        {!allAnswered && (
          <p className="text-xs font-mono text-muted-foreground">
            {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>
    </div>
  );
}
