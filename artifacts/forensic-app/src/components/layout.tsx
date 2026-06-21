import { Link, useLocation } from "wouter";
import { Fingerprint, Beaker, FileDigit, Grid3x3, Home, Siren } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/quiz", label: "Quiz", icon: FileDigit },
    { href: "/jumbled", label: "Jumbled", icon: Beaker },
    { href: "/crossword", label: "Crossword", icon: Grid3x3 },
    { href: "/crime-scene", label: "Crime Scene", icon: Siren },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary/30">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/40 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between max-w-6xl">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            data-testid="link-logo"
          >
            <div className="relative">
              <Fingerprint className="h-6 w-6 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(142,100%,55%)]" />
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-foreground">
              Crimi<span className="text-primary">nova</span>
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-all duration-200 rounded-md
                    ${isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary shadow-[0_0_8px_hsl(142,100%,55%)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-5xl animate-page-in">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-5 text-center">
        <p className="font-mono text-xs text-muted-foreground/60 tracking-widest uppercase">
          Criminova Interactive Lab &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
