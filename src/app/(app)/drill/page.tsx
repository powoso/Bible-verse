"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { DRILL_MODES, type DrillMode } from "@/lib/constants";
import DrillSession from "@/components/DrillSession";
import type { Database } from "@/types/database";

type Verse = Database["public"]["Tables"]["verses"]["Row"];
type UserVerse = Database["public"]["Tables"]["user_verses"]["Row"];

interface DrillVerse {
  userVerse: UserVerse;
  verse: Verse;
}

export default function DrillPage() {
  const { profile } = useAuth();
  const [selectedMode, setSelectedMode] = useState<DrillMode | null>(null);
  const [drillVerses, setDrillVerses] = useState<DrillVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const supabase = createClient();
  const tier = profile?.subscription_tier || "free";

  const startDrill = async (mode: DrillMode) => {
    const modeConfig = DRILL_MODES.find((m) => m.id === mode);
    if (!modeConfig?.free && tier === "free") {
      alert("This drill mode requires a Pro subscription. Upgrade in Settings.");
      return;
    }

    setLoading(true);
    setSelectedMode(mode);

    // Fetch verses due for review
    const { data } = await supabase
      .from("user_verses")
      .select("*, verse:verses(*)")
      .lte("due_date", new Date().toISOString())
      .eq("mastered", false)
      .order("due_date", { ascending: true })
      .limit(10);

    if (!data || data.length === 0) {
      // If no due verses, get any verses
      const { data: allVerses } = await supabase
        .from("user_verses")
        .select("*, verse:verses(*)")
        .order("created_at", { ascending: false })
        .limit(10);

      setDrillVerses(
        (allVerses as unknown as DrillVerse[])?.filter((v) => v.verse) || []
      );
    } else {
      setDrillVerses(
        (data as unknown as DrillVerse[])?.filter((v) => v.verse) || []
      );
    }

    setLoading(false);
    setSessionActive(true);
  };

  const handleSessionEnd = () => {
    setSessionActive(false);
    setSelectedMode(null);
    setDrillVerses([]);
  };

  if (sessionActive && selectedMode && drillVerses.length > 0) {
    return (
      <DrillSession
        mode={selectedMode}
        verses={drillVerses}
        userId={profile!.id}
        onEnd={handleSessionEnd}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">Practice</h1>
      <p className="text-ink/60 dark:text-[#E8D5B8]/60">
        Choose a drill mode to practice your verses.
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-accent font-serif text-lg">Loading verses...</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DRILL_MODES.map((mode) => {
            const locked = !mode.free && tier === "free";
            return (
              <button
                key={mode.id}
                onClick={() => startDrill(mode.id)}
                className={`verse-card flex-col gap-3 p-6 text-center hover:border-accent/30 transition-all ${
                  locked ? "opacity-60" : ""
                }`}
              >
                <span className="text-3xl">
                  {mode.id === "read" && "📖"}
                  {mode.id === "fill_blank" && "✏️"}
                  {mode.id === "prompt" && "💬"}
                  {mode.id === "first_letters" && "🔤"}
                  {mode.id === "recite" && "🧠"}
                </span>
                <h3 className="font-serif font-semibold">{mode.name}</h3>
                <p className="text-sm text-ink/50 dark:text-[#E8D5B8]/50">
                  {mode.description}
                </p>
                {locked && (
                  <span className="text-xs text-accent bg-accent/10 px-3 py-1 rounded-full">
                    Pro only
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
