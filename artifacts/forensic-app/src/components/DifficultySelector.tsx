import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export type Difficulty = "easy" | "intermediate" | "hard";

interface Level {
  id: Difficulty;
  emoji: string;
  label: string;
  color: string;
  border: string;
  glow: string;
  ring: string;
  badge: string;
  description: string;
}

export const LEVELS: Level[] = [
  {
    id: "easy",
    emoji: "🟢",
    label: "Easy",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    ring: "ring-2 ring-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    description: "Basic forensic concepts and simple terminology. Perfect for beginners.",
  },
  {
    id: "intermediate",
    emoji: "🟡",
    label: "Intermediate",
    color: "text-yellow-400",
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.15)]",
    ring: "ring-2 ring-yellow-400 shadow-[0_0_24px_rgba(234,179,8,0.35)]",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    description: "Standard forensic techniques and procedures. For students and enthusiasts.",
  },
  {
    id: "hard",
    emoji: "🔴",
    label: "Hard",
    color: "text-red-400",
    border: "border-red-500/40",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    ring: "ring-2 ring-red-400 shadow-[0_0_24px_rgba(239,68,68,0.35)]",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    description: "Advanced scientific methods and expert-level terminology. For professionals.",
  },
];

export function getLevelMeta(difficulty: Difficulty): Level {
  return LEVELS.find((l) => l.id === difficulty)!;
}

interface DifficultySelectorProps {
  selected: Difficulty | null;
  onSelect: (d: Difficulty) => void;
}

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground font-mono text-sm tracking-wider uppercase">
        Select difficulty
      </p>
      <div className="grid grid-cols-1 gap-4">
        {LEVELS.map((level) => {
          const isSelected = selected === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onSelect(level.id)}
              className={`w-full text-left p-5 rounded-xl border transition-all duration-200 bg-card/40
                ${isSelected ? `${level.ring} border-transparent` : `${level.border} hover:${level.glow}`}
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{level.emoji}</span>
                <div className="flex-1">
                  <div className={`font-mono font-bold text-lg ${level.color}`}>{level.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{level.description}</div>
                </div>
                {isSelected && (
                  <div className={`text-xs font-mono px-2 py-1 rounded border ${level.badge}`}>
                    SELECTED
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface LevelBadgeProps {
  difficulty: Difficulty;
  onBack: () => void;
}

export function LevelBadge({ difficulty, onBack }: LevelBadgeProps) {
  const meta = getLevelMeta(difficulty);
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="font-mono text-xs text-muted-foreground hover:text-foreground px-2"
      >
        <ChevronLeft className="w-3 h-3 mr-1" /> BACK
      </Button>
      <span className={`text-xs font-mono px-2 py-1 rounded border ${meta.badge}`}>
        {meta.emoji} {meta.label.toUpperCase()}
      </span>
    </div>
  );
}
