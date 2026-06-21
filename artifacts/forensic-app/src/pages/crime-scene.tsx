import { useState, useEffect } from "react";
import { useGenerateCrimeScene, useEvaluateCrimeScene } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, MapPin, AlertTriangle, Microscope, ClipboardList,
  RefreshCw, CheckCircle2, ChevronRight, Siren,
} from "lucide-react";
import { DifficultySelector, LevelBadge, type Difficulty } from "@/components/DifficultySelector";

/* ── Typewriter hook ─────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 22): string {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

/* ── Score ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-emerald-400 border-emerald-400/50"
    : score >= 5 ? "text-yellow-400 border-yellow-400/50"
    : "text-red-400 border-red-400/50";
  const label = score >= 8 ? "Outstanding" : score >= 5 ? "Satisfactory" : "Needs Work";
  return (
    <div className={`inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 bg-card/50 mx-auto ${color}`}>
      <span className="text-5xl font-black leading-none">{score}</span>
      <span className="text-sm text-muted-foreground font-mono">/10</span>
      <span className={`text-[10px] font-mono mt-1 ${color.split(" ")[0]}`}>{label}</span>
    </div>
  );
}

/* ── Per-question feedback card ──────────────────────────────────────────── */
function FeedbackCard({
  label, icon: Icon, score, feedback, correctApproach,
}: {
  label: string;
  icon: React.ElementType;
  score: number;
  feedback: string;
  correctApproach: string;
}) {
  const tier = score >= 3 ? "emerald" : score >= 2 ? "yellow" : "red";
  const cls = {
    emerald: { border: "border-emerald-500/40", text: "text-emerald-400", bg: "bg-emerald-500/10" },
    yellow:  { border: "border-yellow-500/40",  text: "text-yellow-400",  bg: "bg-yellow-500/10"  },
    red:     { border: "border-red-500/40",      text: "text-red-400",     bg: "bg-red-500/10"     },
  }[tier];
  return (
    <Card className={`border ${cls.border} bg-card/30`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${cls.text}`} />
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
          </div>
          <div className={`text-lg font-black font-mono ${cls.text} px-2.5 py-0.5 rounded-lg ${cls.bg} border ${cls.border}`}>
            {score}/10
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>
        <div className={`p-3 rounded-xl ${cls.bg} border ${cls.border} space-y-1`}>
          <p className={`text-[10px] font-mono uppercase tracking-widest font-bold ${cls.text}`}>Correct Approach</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{correctApproach}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main page component ─────────────────────────────────────────────────── */
export default function CrimeScene() {
  const generateScene = useGenerateCrimeScene();
  const evaluateScene = useEvaluateCrimeScene();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [answers, setAnswers] = useState({ crimeType: "", firstEvidence: "", forensicTests: "" });
  const [phase, setPhase] = useState<"select" | "investigate" | "result">("select");
  const [submitError, setSubmitError] = useState("");

  const scene = generateScene.data;
  const evaluation = evaluateScene.data;

  const displayedDescription = useTypewriter(
    phase === "investigate" && scene ? scene.description : "",
    18,
  );
  const typingDone = scene ? displayedDescription.length >= scene.description.length : false;

  const handleGenerate = () => {
    if (!difficulty) return;
    setAnswers({ crimeType: "", firstEvidence: "", forensicTests: "" });
    setSubmitError("");
    evaluateScene.reset();
    generateScene.mutate(
      { data: { difficulty } },
      { onSuccess: () => setPhase("investigate") },
    );
  };

  const handleBack = () => {
    generateScene.reset();
    evaluateScene.reset();
    setPhase("select");
    setAnswers({ crimeType: "", firstEvidence: "", forensicTests: "" });
    setSubmitError("");
    setDifficulty(null);
  };

  const handleReset = () => {
    evaluateScene.reset();
    setAnswers({ crimeType: "", firstEvidence: "", forensicTests: "" });
    setSubmitError("");
    setPhase("investigate");
  };

  const handleSubmit = () => {
    if (!scene || !difficulty) return;
    const missing = !answers.crimeType.trim() || !answers.firstEvidence.trim() || !answers.forensicTests.trim();
    if (missing) {
      setSubmitError("Please answer all three questions before submitting.");
      return;
    }
    setSubmitError("");
    evaluateScene.mutate(
      {
        data: {
          difficulty,
          location: scene.location,
          description: scene.description,
          clues: scene.clues,
          crimeType: scene.crimeType,
          answers: {
            crimeType: answers.crimeType,
            firstEvidence: answers.firstEvidence,
            forensicTests: answers.forensicTests,
          },
        },
      },
      { onSuccess: () => setPhase("result") },
    );
  };

  /* ── Error ─────────────────────────────────────────────────────────────── */
  const anyError = generateScene.isError || evaluateScene.isError;
  if (anyError) {
    const err = generateScene.error ?? evaluateScene.error;
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      ?? (err as Error)?.message ?? "Unknown error";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-lg w-full p-6 rounded-xl border border-destructive/50 bg-destructive/10 space-y-4">
          <h2 className="font-mono text-destructive text-xl font-bold tracking-widest">INVESTIGATION FAILED</h2>
          <p className="text-sm text-muted-foreground font-mono break-words">{msg}</p>
          <div className="flex gap-3">
            <Button onClick={handleBack} variant="ghost" className="font-mono">BACK</Button>
            <Button
              onClick={phase === "result" ? handleReset : handleGenerate}
              variant="outline" className="font-mono border-destructive/50"
            >
              RETRY
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading — generating scene ─────────────────────────────────────── */
  if (generateScene.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-ping" />
          <Siren className="h-16 w-16 text-red-400 animate-pulse relative z-10" />
        </div>
        <p className="font-mono text-xl text-red-400 animate-pulse tracking-widest">DISPATCHING TO SCENE...</p>
      </div>
    );
  }

  /* ── Loading — evaluating ──────────────────────────────────────────── */
  if (evaluateScene.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          <Microscope className="h-16 w-16 text-primary animate-pulse relative z-10" />
        </div>
        <p className="font-mono text-xl text-primary animate-pulse tracking-widest">ANALYZING INVESTIGATION...</p>
      </div>
    );
  }

  /* ── Select difficulty ──────────────────────────────────────────────── */
  if (phase === "select") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold font-mono text-primary">Virtual Crime Scene</h1>
            <p className="text-muted-foreground text-sm">Investigate an AI-generated crime scene · Answer 3 questions</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <Button size="lg" onClick={handleGenerate} disabled={!difficulty} className="w-full font-mono font-bold tracking-widest text-base h-12">
              <Siren className="w-4 h-4 mr-2" /> RESPOND TO SCENE
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Investigate phase ──────────────────────────────────────────────── */
  if (phase === "investigate" && scene) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-page-in">
        {/* Sticky header */}
        <div className="sticky top-[56px] z-40 bg-background/80 backdrop-blur-xl border border-border/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}
            <span className="text-xs font-mono text-muted-foreground hidden sm:block">Virtual Crime Scene</span>
          </div>
          <Button onClick={handleGenerate} variant="outline" size="sm" className="font-mono h-8 px-3 text-xs gap-1.5 shrink-0">
            <RefreshCw className="w-3 h-3" /> New Scene
          </Button>
        </div>

        {/* Crime scene tape top */}
        <div
          className="h-5 w-full rounded-lg"
          style={{
            backgroundImage: "repeating-linear-gradient(-45deg, #0a0a0a 0px, #0a0a0a 12px, #f5c518 12px, #f5c518 24px)",
            opacity: 0.75,
          }}
        />

        {/* Scene card with tape border */}
        <div className="relative rounded-2xl border-2 border-yellow-500/35 bg-card/30 overflow-hidden">
          <div
            className="absolute top-0 inset-x-0 h-1.5"
            style={{ backgroundImage: "repeating-linear-gradient(90deg, #f5c518 0px, #f5c518 20px, #0a0a0a 20px, #0a0a0a 40px)" }}
          />

          <div className="p-6 pt-8 space-y-6">
            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/80 mb-0.5">Active Investigation</p>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">{scene.location}</h2>
              </div>
            </div>

            {/* Description — typewriter */}
            <div className="p-5 rounded-xl bg-muted/20 border border-border/30">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-3">Incident Report</p>
              <p className="text-base text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
                {displayedDescription}
                {!typingDone && (
                  <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            </div>

            {/* Evidence clues — only reveal after typewriter */}
            {typingDone && (
              <div className="space-y-3 animate-in fade-in duration-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-yellow-400/80">
                    Observed Evidence — {scene.clues.length} items
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scene.clues.map((clue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/15 border border-border/20 animate-word-in"
                      style={{ animationDelay: `${idx * 70}ms` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 shadow-[0_0_10px_rgba(239,68,68,0.45)]">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{clue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="h-1.5"
            style={{ backgroundImage: "repeating-linear-gradient(90deg, #f5c518 0px, #f5c518 20px, #0a0a0a 20px, #0a0a0a 40px)" }}
          />
        </div>

        {/* Investigation questions */}
        {typingDone && (
          <div className="space-y-5 animate-in fade-in duration-700">
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h3 className="font-mono text-xs uppercase tracking-widest text-primary">
                Investigation Report
              </h3>
            </div>

            {(
              [
                {
                  key: "crimeType" as const,
                  label: "Q1 — What type of crime is this?",
                  placeholder: "Identify the crime: murder, robbery, fraud, arson, poisoning, burglary…",
                  hint: "Study all observed evidence before drawing a conclusion.",
                },
                {
                  key: "firstEvidence" as const,
                  label: "Q2 — What evidence would you collect first?",
                  placeholder: "Describe what you'd prioritize and why — think about perishability and chain of custody…",
                  hint: "Consider which evidence degrades fastest or is most at risk of contamination.",
                },
                {
                  key: "forensicTests" as const,
                  label: "Q3 — What forensic tests would you run?",
                  placeholder: "e.g. DNA swabbing, fingerprint lifting, toxicology screen, GC-MS, ballistics comparison…",
                  hint: "Be specific — name the tests and what each would reveal.",
                },
              ] as const
            ).map(({ key, label, placeholder, hint }, idx) => (
              <div key={key} className="space-y-2 animate-word-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <label className="block text-sm font-semibold text-foreground">{label}</label>
                <p className="text-xs text-muted-foreground/70 italic">{hint}</p>
                <Textarea
                  value={answers[key]}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={3}
                  className="resize-none text-sm bg-card/30 border-border/40 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
                />
              </div>
            ))}

            {submitError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-mono text-sm animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground/50 font-mono">
                AI will review all three answers and score your investigation.
              </p>
              <Button
                size="lg"
                onClick={handleSubmit}
                className="font-mono font-black tracking-widest px-10 h-12 rounded-xl w-full sm:w-auto shadow-[0_0_24px_hsl(var(--primary)/0.3)]"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> SUBMIT INVESTIGATION
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Result phase ───────────────────────────────────────────────────── */
  if (phase === "result" && evaluation && scene) {
    const score = Math.round(evaluation.totalScore);
    const verdict =
      score >= 8 ? "Outstanding investigative work, detective."
      : score >= 5 ? "Solid investigation with room to improve."
      : "Further forensic training recommended.";

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-page-in">
        {/* Sticky header */}
        <div className="sticky top-[56px] z-40 bg-background/80 backdrop-blur-xl border border-border/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          {difficulty && <LevelBadge difficulty={difficulty} onBack={handleBack} />}
          <div className="flex gap-2 shrink-0">
            <Button onClick={handleReset} variant="outline" size="sm" className="font-mono h-8 px-3 text-xs gap-1.5">
              <RefreshCw className="w-3 h-3" /> Re-investigate
            </Button>
            <Button onClick={handleGenerate} size="sm" className="font-mono h-8 px-3 text-xs gap-1.5">
              <Siren className="w-3 h-3" /> New Scene
            </Button>
          </div>
        </div>

        {/* Score panel */}
        <Card className="border-primary/20 bg-card/50 shadow-[0_0_40px_hsl(var(--primary)/0.07)] overflow-hidden">
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-mono font-black tracking-tight uppercase">
              Investigation Closed
            </h2>
            <ScoreRing score={score} />
            <p className="text-lg text-muted-foreground">{verdict}</p>
          </div>
        </Card>

        {/* Scene recap (collapsible) */}
        <details className="group rounded-2xl border border-border/30 bg-card/20 overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground/60" />
              <span className="text-sm font-mono text-muted-foreground truncate">{scene.location}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-open:rotate-90 transition-transform shrink-0" />
          </summary>
          <div className="px-5 pb-5 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed font-mono border-l-2 border-border/40 pl-3">
              {scene.description}
            </p>
            <ul className="space-y-1.5">
              {scene.clues.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="w-5 h-5 bg-red-500/70 rounded-full text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* Feedback cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-3">
            Detailed Feedback
          </h3>
          <FeedbackCard
            label="Crime Type Identification"
            icon={Siren}
            score={evaluation.crimeTypeFeedback.score}
            feedback={evaluation.crimeTypeFeedback.feedback}
            correctApproach={evaluation.crimeTypeFeedback.correctApproach}
          />
          <FeedbackCard
            label="Evidence Collection Priority"
            icon={AlertTriangle}
            score={evaluation.firstEvidenceFeedback.score}
            feedback={evaluation.firstEvidenceFeedback.feedback}
            correctApproach={evaluation.firstEvidenceFeedback.correctApproach}
          />
          <FeedbackCard
            label="Forensic Tests Selected"
            icon={Microscope}
            score={evaluation.forensicTestsFeedback.score}
            feedback={evaluation.forensicTestsFeedback.feedback}
            correctApproach={evaluation.forensicTestsFeedback.correctApproach}
          />
        </div>

        {/* Senior investigator's approach */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-primary">
              Senior Investigator's Approach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">{evaluation.investigatorApproach}</p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={handleBack} variant="outline" className="font-mono flex-1">← Change Level</Button>
          <Button onClick={handleGenerate} size="lg" className="font-mono font-bold flex-1 tracking-widest">
            <Siren className="w-4 h-4 mr-2" /> NEW SCENE
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
