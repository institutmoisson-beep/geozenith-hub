import { Link } from "@tanstack/react-router";
import logo from "@/assets/msn-tracker-logo.png";

const links = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#plateforme", label: "Plateforme" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-3.5">
        <a href="#top" className="flex items-center gap-3">
          <img src={logo} alt="Logo MSN Tracker" width={40} height={40} className="h-10 w-10" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight">MSN Tracker</span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              by Institut Moisson
            </span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Link
          to="/auth"
          className="rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          Espace client
        </Link>
      </div>
    </header>
  );
}