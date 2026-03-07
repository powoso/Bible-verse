"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [denomination, setDenomination] = useState(profile?.denomination || "");
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const supabase = createClient();
  const tier = profile?.subscription_tier || "free";

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("users")
      .update({ display_name: displayName, denomination: denomination || null })
      .eq("id", profile!.id);
    await refreshProfile();
    setSaving(false);
  };

  const handleUpgrade = async (targetTier: "pro" | "church") => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to open billing portal.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-serif font-bold">Settings</h1>

      {/* Profile */}
      <div className="verse-card flex-col gap-4 p-6 text-left">
        <h2 className="font-serif font-semibold text-lg">Profile</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-4 w-full">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Denomination (optional)</label>
            <input
              type="text"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              className="input-field"
              placeholder="e.g., Baptist, Catholic, Non-denominational"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-fit text-sm">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="verse-card flex-col gap-4 p-6 text-left">
        <h2 className="font-serif font-semibold text-lg">Appearance</h2>
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-ink/50 dark:text-[#E8D5B8]/50">
              Warm candlelight palette
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              darkMode ? "bg-accent" : "bg-accent/20"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="verse-card flex-col gap-4 p-6 text-left">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-serif font-semibold text-lg">Subscription</h2>
          <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-medium capitalize">
            {tier}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 w-full">
          {(Object.entries(SUBSCRIPTION_TIERS) as [string, typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]][]).map(
            ([key, plan]) => (
              <div
                key={key}
                className={`border rounded-xl p-4 space-y-3 ${
                  key === tier
                    ? "border-accent bg-accent/5"
                    : "border-accent/10"
                }`}
              >
                <h3 className="font-serif font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold">
                  {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                </p>
                <ul className="text-sm space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-ink/60 dark:text-[#E8D5B8]/60">
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                {key === tier ? (
                  <p className="text-sm text-accent font-medium">Current plan</p>
                ) : key !== "free" ? (
                  <button
                    onClick={() => handleUpgrade(key as "pro" | "church")}
                    disabled={upgrading}
                    className="btn-primary text-sm w-full"
                  >
                    {upgrading ? "Loading..." : `Upgrade to ${plan.name}`}
                  </button>
                ) : null}
              </div>
            )
          )}
        </div>

        {tier !== "free" && (
          <button
            onClick={handleManageSubscription}
            className="btn-secondary text-sm"
          >
            Manage Billing
          </button>
        )}
      </div>
    </div>
  );
}
