import logo from "@/assets/msn-tracker-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-khaki-deep">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo MSN Tracker"
            width={32}
            height={32}
            loading="lazy"
            className="h-8 w-8"
          />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">MSN Tracker</span> — by Institut Moisson
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Institut Moisson. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}