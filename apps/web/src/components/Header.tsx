import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="SlotScout home">
      <img src="/logo-mark-light.svg" alt="" width={24} height={30} />
      <span className="wordmark">
        Slot<b>Scout</b>
      </span>
    </Link>
  );
}

export function Header({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Logo />
      {children}
      <button className="menu-btn" type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ☰
      </button>
      <nav className={open ? "open" : ""} aria-label="Main" onClick={() => setOpen(false)}>
        <NavLink to="/" end>
          Map
        </NavLink>
        <NavLink to="/editor">Map editor</NavLink>
        <NavLink to="/about">How it works</NavLink>
        <NavLink to="/rules">Rules</NavLink>
        <NavLink to="/sources">Sources</NavLink>
        <NavLink to="/ranges">Ranges</NavLink>
        <NavLink to="/terms">Terms</NavLink>
      </nav>
    </header>
  );
}
