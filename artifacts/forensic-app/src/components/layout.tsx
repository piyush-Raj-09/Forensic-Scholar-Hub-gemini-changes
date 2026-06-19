import { Link, useLocation } from "wouter";
import { Fingerprint, Beaker, FileDigit, Grid3x3, Home } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/quiz", label: "Quiz", icon: FileDigit },
    { href: "/jumbled", label: "Jumbled", icon: Beaker },
    { href: "/crossword", label: "Crossword", icon: Grid3x3 },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors" data-testid="link-logo">
            <Fingerprint className="h-6 w-6" />
            <span className="font-mono text-xl font-bold tracking-tight">ForensiQ</span>
          </Link>
          <nav className="flex items-center gap-1 md:gap-4 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
      <footer className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
        <p className="font-mono">ForensiQ Interactive Lab &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}