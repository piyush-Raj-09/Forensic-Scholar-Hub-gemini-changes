import { Button } from "@/components/ui/button";
import { ChevronLeft, LockOpen, Shield, Skull } from "lucide-react";

export type Difficulty = "easy" | "intermediate" | "hard";

interface Level {
  id: Difficulty;
  label: string;
  tagline: string;
  description: string;
  Icon: React.ElementType;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  selectedBorder: string;
  selectedRing: string;
  selectedGlow: string;
  badge: string;
  hoverGlow: string;
}

export const LEVELS: Level[] = [
  {
    id: "easy",
    label: "Easy",
    tagline: "Beginner",
    description: "Basic forensic concepts and everyday terminology. Perfect for newcomers.",
    Icon: LockOpen,
    emoji: "🟢",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    selectedBorder: "border-emerald-400",
    selectedRing: "ring-1 ring-emerald-400/50",
    selectedGlow: "shadow-[0_0_28px_rgba(52,211,153,0.3)]",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    hoverGlow: "hover:border-emerald-500/50 hover:shadow-[0_4px_20px_rgba(52,211,153,0.12)]",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    tagline: "Proficient",
    description: "Standard forensic techniques and procedures. For students and enthusiasts.",
    Icon: Shield,
    emoji: "🟡",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/25",
    selectedBorder: "border-yellow-400",
    selectedRing: "ring-1 ring-yellow-400/50",
    selectedGlow: "shadow-[0_0_28px_rgba(234,179,8,0.3)]",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    hoverGlow: "hover:border-yellow-500/50 hover:shadow-[0_4px_20px_rgba(234,179,8,0.12)]",
  },
  {
    id: "hard",
    label: "Hard",
    tagline: "Expert",
    description: "Advanced scientific methods and technical forensic terminology. For professionals.",
    Icon: Skull,
    emoji: "🔴",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    selectedBorder: "border-red-400",
    selectedRing: "ring-1 ring-red-400/50",
    selectedGlow: "shadow-[0_0_28px_rgba(239,68,68,0.3)]",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    hoverGlow: "hover:border-red-500/50 hover:shadow-[0_4px_20px_rgba(239,68,68,0.12)]",
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
    <div className="space-y-3">
      <p className="text-center text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase">
        Select Difficulty
      </p>
      <div className="grid grid-cols-1 gap-3">
        {LEVELS.map((level) => {
          const isSelected = selected === level.id;
          const { Icon } = level;
          return (
            <button
              key={level.id}
              onClick={() => onSelect(level.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 bg-card/40
                ${isSelected
                  ? `${level.selectedBorder} ${level.selectedRing} ${level.selectedGlow} bg-card/70`
                  : `${level.border} ${level.hoverGlow}`
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon badge */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${level.bg} transition-transform duration-200 ${isSelected ? "scale-105" : ""}`}>
                  <Icon className={`w-6 h-6 ${level.color}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold text-base ${level.color}`}>{level.label}</span>
                    <span className="text-xs font-mono text-muted-foreground/50">{level.tagline}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>
                </div>

                {/* Selected dot */}
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200
                  ${isSelected ? `${level.selectedBorder} ${level.bg}` : "border-border/40"}`}>
                  {isSelected && <div className={`w-2 h-2 rounded-full ${level.color.replace("text-", "bg-")}`} />}
                </div>
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
  const { Icon } = meta;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="font-mono text-xs text-muted-foreground hover:text-foreground h-7 px-2"
      >
        <ChevronLeft className="w-3 h-3 mr-0.5" /> Back
      </Button>
      <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border ${meta.badge}`}>
        <Icon className="w-3 h-3" />
        {meta.label}
      </div>
    </div>
  );
}
