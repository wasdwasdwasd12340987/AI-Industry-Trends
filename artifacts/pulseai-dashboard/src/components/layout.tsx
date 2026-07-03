import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = saved || (isDark ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const ThemeContext = React.createContext<{
  theme: "light" | "dark";
  toggleTheme: () => void;
}>({ theme: "dark", toggleTheme: () => {} });

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = React.useContext(ThemeContext);

  const links = [
    { href: "/", label: "Home" },
    { href: "/compare", label: "Compare" },
    { href: "/predict", label: "Predict" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-200">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print-hide">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-primary">PulseAI</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm lg:gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-foreground/80 ${
                    location === link.href ? "text-foreground font-semibold" : "text-foreground/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme">
              {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
