"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Database } from "@/types/database";

type UserVerse = Database["public"]["Tables"]["user_verses"]["Row"];
type Verse = Database["public"]["Tables"]["verses"]["Row"];

interface DueVerse extends UserVerse {
  verse: Verse;
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [dueVerses, setDueVerses] = useState<DueVerse[]>([]);
  const [stats, setStats] = useState({ mastered: 0, inProgress: 0, notStarted: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const fetchDashboardData = async () => {
    try {
      // Get due verses
      const { data: userVerses } = await supabase
        .from("user_verses")
        .select("*, verse:verses(*)")
        .lte("due_date", new Date().toISOString())
        .eq("mastered", false)
        .order("due_date", { ascending: true })
        .limit(10);

      setDueVerses((userVerses as unknown as DueVerse[]) || []);

      // Get stats
      const { data: allUserVerses } = await supabase
        .from("user_verses")
        .select("mastered, repetitions");

      const { count: totalVerses } = await supabase
        .from("verses")
        .select("*", { count: "exact", head: true });

      if (allUserVerses) {
        const mastered = allUserVerses.filter((v: { mastered: boolean }) => v.mastered).length;
        const inProgress = allUserVerses.filter((v: { mastered: boolean; repetitions: number }) => !v.mastered && v.repetitions > 0).length;
        const tracked = allUserVerses.length;
        setStats({
          mastered,
          inProgress,
          notStarted: (totalVerses || 0) - tracked,
          total: totalVerses || 0,
        });
      }

      // Update streak (non-blocking)
      if (profile?.id) {
        supabase.rpc("update_streak", { p_user_id: profile.id }).catch(() => {});
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent font-serif text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">
            Welcome back, {profile?.display_name || "friend"}
          </h1>
          <p className="text-ink/60 dark:text-[#E8D5B8]/60">
            Keep hiding God&apos;s Word in your heart.
          </p>
        </div>

        {/* Streak */}
        <div className="verse-card px-6 py-4 flex-col items-center gap-1">
          <span className="text-3xl font-serif font-bold text-accent">
            {profile?.streak_count || 0}
          </span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">day streak</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="verse-card flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.mastered}</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">Mastered</span>
        </div>
        <div className="verse-card flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">In Progress</span>
        </div>
        <div className="verse-card flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-ink/40 dark:text-[#E8D5B8]/40">{stats.notStarted}</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">Not Started</span>
        </div>
        <div className="verse-card flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-accent">{stats.total}</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">Total Verses</span>
        </div>
      </div>

      {/* Due for Review */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold">Due for Review</h2>
          {dueVerses.length > 0 && (
            <Link href="/drill" className="btn-primary text-sm">
              Start Drill
            </Link>
          )}
        </div>

        {dueVerses.length === 0 ? (
          <div className="verse-card flex-col gap-3 py-12">
            <p className="text-ink/60 dark:text-[#E8D5B8]/60 font-serif text-lg">
              No verses due for review!
            </p>
            <Link href="/collections" className="btn-secondary text-sm">
              Add more verses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dueVerses.map((uv) => (
              <div key={uv.id} className="verse-card flex-col gap-2 p-6 text-left">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-semibold text-accent">
                    {uv.verse?.reference}
                  </span>
                  <span className="text-xs text-ink/40 dark:text-[#E8D5B8]/40">
                    {uv.verse?.translation}
                  </span>
                </div>
                <p className="verse-text text-sm leading-relaxed">
                  {uv.verse?.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/collections" className="verse-card flex-col gap-2 py-6 hover:border-accent/30 transition-colors">
          <span className="text-2xl">📚</span>
          <span className="font-serif font-semibold">My Collections</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">Search and add verses</span>
        </Link>
        <Link href="/drill" className="verse-card flex-col gap-2 py-6 hover:border-accent/30 transition-colors">
          <span className="text-2xl">🎯</span>
          <span className="font-serif font-semibold">Practice</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">Drill your verses</span>
        </Link>
        <Link href="/settings" className="verse-card flex-col gap-2 py-6 hover:border-accent/30 transition-colors">
          <span className="text-2xl">⚙️</span>
          <span className="font-serif font-semibold">Settings</span>
          <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">Profile & subscription</span>
        </Link>
      </div>
    </div>
  );
}
