import { useState, useEffect, useRef } from "react";
import { useGenerateQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, ClockAlert } from "lucide-react";
import { DifficultySelector, LevelBadge, type Difficulty } from "@/components/DifficultySelector";

const TOTAL_SECONDS = 300;
const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

function CircularTimer({ seconds, danger }: { seconds: number; danger: boolean }) {
  const progress = seconds / TOTAL_SECONDS;
  const offset = CIRCUMFERENCE * (1 - progress);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <div className={`relative w-16 h-16 shrink-0 ${danger ? "timer-ring-danger" : ""}`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="timer-ring-track" />
        <circle
          cx="50" cy="50" r="45" fill="none" strokeWidth="6"
          className="timer-ring-progress"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono font-bold text-xs tabular-nums ${danger ? "text-destructive animate-pulse" : "text-primary"}`}>
          {m}:{s.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

export default function Quiz() {
  const generateQuiz = useGenerateQuiz();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_SECONDS);
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
    setTimeRemaining(TOTAL_SECONDS);
    generateQuiz.mutate({ data: { difficulty } });
  };

  const handleBack = () => {
    stopTimer();
    generateQuiz.reset();
    setAnswers({});
    setIsFinished(false);
    setIsTimeUp(false);
    setSubmitWarning(false);
    setTimeRemaining(TOTAL_SECONDS);
    setDifficulty(null);
  };

  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) { stopTimer(); setIsTimeUp(true); setIsFinished(true); return 0; }
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
            <Button onClick={handleStart} variant="outline" className="font-mono border-destructive/50">RETRY</Button>
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

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-primary font-mono">Forensic Quiz</h1>
            <p className="text-muted-foreground text-sm">8 AI-generated questions · 5-minute timer</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <Button size="lg" onClick={handleStart} disabled={!difficulty} className="w-full font-mono font-bold tracking-widest text-base h-12">
              GENERATE QUESTIONS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Score card ────────────────────────────────────────────────────────────
  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    const verdict = score >= 7 ? "Excellent work, investigator." : score >= 5 ? "Satisfactory performance." : "Further training required.";
    const circleColor = score >= 7 ? "text-emerald-400 border-emerald-400/40" : score >= 5 ? "text-yellow-400 border-yellow-400/40" : "text-red-400 border-red-400/40";
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-page-in">
        <Card className="border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.1)] bg-card/80 backdrop-blur overflow-hidden">
          {isTimeUp && (
            <div className="bg-destructive/10 border-b border-destructive/30 px-6 py-3 flex items-center gap-2">
              <ClockAlert className="w-4 h-4 text-destructive shrink-0" />
              <span className="font-mono text-destructive text-sm font-bold tracking-widest">TIME EXPIRED — Quiz auto-submitted</span>
            </div>
          )}
          <div className="p-8 text-center space-y-6">
            <h2 className="text-3xl font-mono font-black text-foreground tracking-tight">
              {isTimeUp ? "TIME'S UP" : "QUIZ COMPLETE"}
            </h2>

            <div className={`inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 ${circleColor} bg-card/50 mx-auto`}>
              <span className="text-5xl font-black leading-none">{score}</span>
              <span className="text-base text-muted-foreground font-mono">/ {questions.length}</span>
              <span className="text-xs font-mono text-primary mt-1">{pct}%</span>
            </div>

            <p className="text-lg text-muted-foreground">{verdict}</p>

            {answeredCount < questions.length && (
              <p className="text-sm text-muted-foreground/60 font-mono">
                {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} unanswered
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="font-mono w-full sm:w-auto">
                ← Change Level
              </Button>
              <Button size="lg" onClick={handleStart} className="font-mono font-bold w-full sm:w-auto px-8">
                <RefreshCw className="w-4 h-4 mr-2" /> TRY AGAIN
              </Button>
            </div>
          </div>
        </Card>

        {/* Detailed report */}
        <div className="space-y-4">
          <h3 className="text-lg font-mono font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-3">
            Question Review
          </h3>
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isUnanswered = userAnswer === undefined;
            return (
              <Card key={q.id}
                className={`border-l-[3px] transition-colors
                  ${isCorrect ? "border-l-emerald-500 bg-emerald-500/[0.02]"
                  : isUnanswered ? "border-l-border bg-card/20"
                  : "border-l-destructive bg-destructive/[0.02]"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : isUnanswered ? <AlertCircle className="w-5 h-5 text-muted-foreground/40" />
                        : <XCircle className="w-5 h-5 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                        Q{idx + 1} · {q.domain}
                      </CardDescription>
                      <CardTitle className="text-base leading-snug font-medium">{q.question}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === optIdx;
                      const isActualCorrect = q.correctAnswer === optIdx;
                      let cls = "p-3 rounded-lg border text-sm flex items-center justify-between gap-2";
                      if (isActualCorrect) cls += " bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
                      else if (isSelected) cls += " bg-destructive/10 border-destructive/40 text-destructive";
                      else cls += " bg-muted/20 border-transparent text-muted-foreground";
                      return (
                        <div key={optIdx} className={cls}>
                          <span className="leading-snug">{opt}</span>
                          {isActualCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                          {isSelected && !isActualCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pl-8">
                    {!isUnanswered ? (
                      <div className="p-3 bg-muted/15 rounded-lg border border-border/30 text-sm">
                        <span className="font-mono text-primary text-xs font-bold mr-2 uppercase tracking-wider">Explanation</span>
                        <span className="text-muted-foreground">{q.explanation}</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/10 rounded-lg border border-border/20 text-sm">
                        <span className="font-mono text-xs font-bold mr-2 uppercase tracking-wider text-muted-foreground">Correct answer </span>
                        <span className="text-emerald-400 font-medium">{q.options[q.correctAnswer]}</span>
                      </div>
                    )}
                  </div>
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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Sticky header */}
      <div className="sticky top-[56px] z-40 bg-background/80 backdrop-blur-xl border border-border/40 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm">
        {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-mono text-muted-foreground">
              Question <span className="text-foreground font-bold">{Math.min(answeredCount + 1, questions.length)}</span> of {questions.length}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Circular timer */}
        <CircularTimer seconds={timeRemaining} danger={isDangerTime} />
      </div>

      {/* Questions */}
      <div className="space-y-4 pt-2">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isUnanswered = userAnswer === undefined;
          const highlight = submitWarning && isUnanswered;
          return (
            <Card
              key={q.id}
              id={`question-${q.id}`}
              className={`border transition-all duration-300 bg-card/30
                ${highlight ? "border-destructive/50 shadow-[0_0_16px_hsl(var(--destructive)/0.2)]" : "border-border/40"}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-primary/60 mb-1.5">
                      Q{idx + 1} of {questions.length} · {q.domain}
                      {highlight && <span className="ml-2 text-destructive">⚠ Unanswered</span>}
                    </CardDescription>
                    <CardTitle className="text-lg leading-snug font-semibold">{q.question}</CardTitle>
                  </div>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold border
                    ${userAnswer !== undefined ? "bg-primary/10 border-primary/40 text-primary" : "bg-muted/30 border-border/40 text-muted-foreground"}`}>
                    {idx + 1}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswer(q.id, optIdx)}
                      className={`text-left px-4 py-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3 group
                        ${isSelected
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_16px_rgba(52,211,153,0.12)] ring-1 ring-emerald-500/30"
                          : "bg-muted/15 border-border/30 hover:bg-muted/30 hover:border-primary/30"
                        }`}
                    >
                      <div className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-colors
                        ${isSelected ? "border-emerald-500 bg-emerald-500 text-black" : "border-border/50 text-muted-foreground group-hover:border-primary/50"}`}>
                        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className={`text-sm leading-snug ${isSelected ? "text-emerald-300 font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit section */}
      <div className="pt-6 pb-12 flex flex-col items-center gap-4">
        {submitWarning && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-mono text-sm w-full max-w-sm justify-center animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} still unanswered
          </div>
        )}
        <Button
          size="lg"
          onClick={handleSubmit}
          className={`font-mono font-black tracking-widest px-16 h-14 text-base transition-all duration-200 rounded-2xl
            ${allAnswered
              ? "shadow-[0_0_30px_hsl(var(--primary)/0.4)] scale-100"
              : "opacity-75 scale-95"}`}
        >
          SUBMIT QUIZ
        </Button>
        {!allAnswered && (
          <p className="text-xs font-mono text-muted-foreground/50">
            {questions.length - answeredCount} answer{questions.length - answeredCount !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>
    </div>
  );
}
