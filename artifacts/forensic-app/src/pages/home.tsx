import { Link } from "wouter";
import { FileDigit, Beaker, Grid3x3, ChevronRight, Fingerprint, ArrowRight } from "lucide-react";

const modes = [
  {
    title: "Forensic Quiz",
    subtitle: "8 MCQ · 5 min timer",
    description: "Test your knowledge across DNA analysis, ballistics, toxicology, pathology, and more.",
    href: "/quiz",
    icon: FileDigit,
    accent: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/0",
    border: "hover:border-emerald-500/60",
    glow: "hover:shadow-[0_8px_40px_rgba(52,211,153,0.18)]",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    tag: "MCQ",
  },
  {
    title: "Jumbled Words",
    subtitle: "8 words · Unscramble",
    description: "Decode scrambled forensic terminology with contextual hints. Race against your own knowledge.",
    href: "/jumbled",
    icon: Beaker,
    accent: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/0",
    border: "hover:border-cyan-500/60",
    glow: "hover:shadow-[0_8px_40px_rgba(6,182,212,0.18)]",
    iconBg: "bg-cyan-500/10 text-cyan-400",
    tag: "DECODE",
  },
  {
    title: "Crossword",
    subtitle: "8 clues · 15×15 grid",
    description: "Solve an AI-generated forensic matrix. Every session has a completely different layout.",
    href: "/crossword",
    icon: Grid3x3,
    accent: "violet",
    gradient: "from-violet-500/20 to-violet-500/0",
    border: "hover:border-violet-500/60",
    glow: "hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)]",
    iconBg: "bg-violet-500/10 text-violet-400",
    tag: "SOLVE",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-16 py-4">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative w-full text-center overflow-hidden rounded-2xl border border-border/40 bg-card/30 py-16 px-6 sm:py-24 sm:px-10">
        {/* Animated grid background */}
        <div className="hero-grid absolute inset-0 rounded-2xl overflow-hidden" />

        {/* Radial glow behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Floating fingerprint watermarks */}
        <Fingerprint className="animate-float-fp absolute top-8 left-8 w-24 h-24 text-primary pointer-events-none" style={{ animationDelay: "0s" }} />
        <Fingerprint className="animate-float-fp absolute bottom-8 right-8 w-16 h-16 text-primary pointer-events-none" style={{ animationDelay: "3s" }} />
        <Fingerprint className="animate-float-fp absolute top-12 right-16 w-10 h-10 text-primary pointer-events-none" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
          {/* Central logo icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_40px_hsl(142,100%,55%,0.2)] mb-2">
            <Fingerprint className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/40 leading-none">
              Crimi<span className="text-primary drop-shadow-[0_0_20px_hsl(142,100%,55%,0.5)]">nova</span>
            </h1>
            <p className="mt-3 text-sm font-mono tracking-[0.3em] text-primary/70 uppercase">
              Forensic Science Learning Lab
            </p>
          </div>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            AI-powered training simulations for forensic science. Three modes, three difficulty levels, infinite variety.
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
            <span className="text-xs font-mono text-muted-foreground/60 tracking-widest uppercase">Select a module below</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </div>
      </section>

      {/* ── Mode Cards ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {modes.map((mode, i) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.href} href={mode.href}>
              <div
                className={`group relative h-full flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300 cursor-pointer
                  ${mode.border} ${mode.glow} hover:-translate-y-1`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Top gradient flush */}
                <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${mode.gradient} pointer-events-none`} />

                <div className="relative z-10 flex flex-col h-full p-6 gap-5">
                  {/* Icon + Tag row */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mode.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 border border-border/60 rounded px-2 py-1">
                      {mode.tag}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground">{mode.title}</h2>
                    <p className="text-xs font-mono text-muted-foreground/70 tracking-wide">{mode.subtitle}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">{mode.description}</p>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sm font-mono font-bold text-primary group-hover:gap-3 transition-all duration-200">
                    LAUNCH MODULE
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center w-full border-t border-border/30 pt-8">
        {[
          { value: "3", label: "Game Modes" },
          { value: "3", label: "Difficulty Levels" },
          { value: "∞", label: "Unique Sessions" },
          { value: "AI", label: "Generated Content" },
        ].map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="text-2xl font-black text-primary font-mono">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-mono tracking-widest uppercase">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
