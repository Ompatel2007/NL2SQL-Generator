"use client";

import type { ThemeId } from "./nlSqlTypes";
import Image from "next/image";
import Logo from "../../public/Logo.png";

import Link from "next/link";

export type NavSection = "workspace" | "download" | "learn" | "help" | "developedBy";

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "download", label: "Download" },
  { id: "learn", label: "Learn" },
  { id: "help", label: "Help" },
  { id: "developedBy", label: "Developed By" },
];

interface AppHeaderProps {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  activeSection?: NavSection;
  onSectionChange?: (section: NavSection) => void;
  mode?: "sql" | "plsql";
}

export function AppHeader({
  theme,
  onThemeChange,
  activeSection = "workspace",
  onSectionChange,
  mode,
}: AppHeaderProps) {
  const isDark = theme !== "pearl";

  return (
    <header
      className="sticky top-0 z-50 w-full flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-b transition-colors gap-3 shrink-0 shadow-xs"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand logo & title + Navigation */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
            title="Return to Home"
          >
            <Image src={Logo} alt="NL2Query Logo" className="w-9 h-9" />
            <h1
              className="text-base font-bold tracking-tight whitespace-nowrap"
              style={{ color: "var(--foreground)" }}
            >
              NL2Query
            </h1>
          </Link>

          {/* Mode Switcher Pill */}
          {mode && (
            <div
              className="hidden sm:flex items-center rounded-lg border p-0.5 text-xs font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface-subtle)" }}
            >
              <Link
                href="/sql"
                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                  mode === "sql"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                SQL
              </Link>
              <Link
                href="/plsql"
                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                  mode === "plsql"
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                PL/SQL
              </Link>
            </div>
          )}
        </div>

        {/* Major Top Navigation */}
        <nav
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange?.(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition-all cursor-pointer border whitespace-nowrap font-medium ${
                  isActive
                    ? "font-semibold shadow-xs"
                    : "opacity-80 hover:opacity-100 hover:bg-[var(--surface-hover)]"
                }`}
                style={
                  isActive
                    ? {
                        background: "var(--surface-subtle)",
                        borderColor: "var(--accent)",
                        color: "var(--foreground)",
                      }
                    : {
                        background: "transparent",
                        borderColor: "transparent",
                        color: "var(--muted)",
                      }
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Light / Dark Mode Toggle Button */}
      <button
        type="button"
        onClick={() => onThemeChange(isDark ? "pearl" : "slate")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-2xs hover:opacity-90 active:scale-95 select-none shrink-0"
        style={{
          background: "var(--surface-subtle)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
        aria-label={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      >
        {isDark ? (
          <>
            {/* Moon Icon for Dark Mode */}
            <svg
              className="w-3.5 h-3.5 text-indigo-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <span className="font-semibold text-xs">Dark</span>
          </>
        ) : (
          <>
            {/* Sun Icon for Light Mode */}
            <svg
              className="w-3.5 h-3.5 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="font-semibold text-xs">Light</span>
          </>
        )}

        {/* Mini Pill Switch Track */}
        <div
          className="w-7 h-4 rounded-full p-0.5 flex items-center transition-colors shrink-0"
          style={{
            background: isDark ? "#3f3f46" : "#cbd5e1",
          }}
        >
          <div
            className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform duration-200 ${
              isDark ? "translate-x-3" : "translate-x-0"
            }`}
          />
        </div>
      </button>
    </header>
  );
}
