"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-accent/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/dashboard" className="text-xl font-serif font-bold text-accent">
          VerseVault
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm hover:text-accent transition-colors">
            Dashboard
          </Link>
          <Link href="/collections" className="text-sm hover:text-accent transition-colors">
            Collections
          </Link>
          <Link href="/drill" className="text-sm hover:text-accent transition-colors">
            Practice
          </Link>
          <Link href="/settings" className="text-sm hover:text-accent transition-colors">
            Settings
          </Link>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-dark-surface border border-accent/10 rounded-xl shadow-lg py-2">
                <p className="px-4 py-2 text-xs text-ink/50 dark:text-[#E8D5B8]/50 truncate">
                  {user?.email}
                </p>
                <hr className="border-accent/10 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-accent/10 bg-white dark:bg-dark-surface px-4 py-4 space-y-3">
          <Link href="/dashboard" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link href="/collections" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Collections</Link>
          <Link href="/drill" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Practice</Link>
          <Link href="/settings" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>Settings</Link>
          <button onClick={toggleDarkMode} className="block text-sm py-2">{darkMode ? "Light Mode" : "Dark Mode"}</button>
          <hr className="border-accent/10" />
          <button onClick={() => { setMenuOpen(false); signOut(); }} className="block text-sm py-2 text-red-600">Sign out</button>
        </div>
      )}
    </nav>
  );
}
