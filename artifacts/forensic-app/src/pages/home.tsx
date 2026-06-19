import { Link } from "wouter";
import { FileDigit, Beaker, Grid3x3, ChevronRight, Fingerprint } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const modes = [
    {
      title: "Forensic Quiz",
      description: "Test your knowledge with multiple-choice questions across various forensic domains.",
      href: "/quiz",
      icon: FileDigit,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Jumbled Words",
      description: "Unscramble forensic terminology and vocabulary with contextual hints.",
      href: "/jumbled",
      icon: Beaker,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      title: "Crossword Puzzle",
      description: "Solve complex forensic crosswords with interconnected clues.",
      href: "/crossword",
      icon: Grid3x3,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 py-8">
      <div className="text-center max-w-3xl space-y-6">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4 ring-1 ring-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
          <Fingerprint className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50">
          Crimi<span className="text-primary">nova</span>
        </h1>
        <p className="text-xl text-muted-foreground font-mono max-w-2xl mx-auto leading-relaxed">
          Initialize your training simulation. Analyze evidence, decode terminology, and test your investigative intellect.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card key={mode.href} className="group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-all hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
              <CardHeader className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${mode.bg} ${mode.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">{mode.title}</CardTitle>
                  <CardDescription className="text-base h-16">{mode.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-4">
                <Link href={mode.href}>
                  <Button className="w-full font-mono font-bold tracking-widest group-hover:bg-primary group-hover:text-primary-foreground transition-all" variant="outline" data-testid={`button-nav-${mode.title.replace(/\s+/g, '-').toLowerCase()}`}>
                    INITIATE <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}