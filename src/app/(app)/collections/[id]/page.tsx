"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import VerseSearch from "@/components/VerseSearch";
import VerseAI from "@/components/VerseAI";
import type { Database } from "@/types/database";
import { FREE_VERSE_LIMIT } from "@/lib/constants";

type Collection = Database["public"]["Tables"]["verse_collections"]["Row"];
type Verse = Database["public"]["Tables"]["verses"]["Row"];

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const tier = profile?.subscription_tier || "free";

  const fetchData = useCallback(async () => {
    const { data: col } = await supabase
      .from("verse_collections")
      .select("*")
      .eq("id", id)
      .single();

    setCollection(col);

    const { data: v } = await supabase
      .from("verses")
      .select("*")
      .eq("collection_id", id)
      .order("created_at", { ascending: false });

    setVerses(v || []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerseAdded = () => {
    setShowSearch(false);
    fetchData();
  };

  const deleteVerse = async (verseId: string) => {
    if (!confirm("Remove this verse?")) return;
    await supabase.from("verses").delete().eq("id", verseId);
    fetchData();
  };

  const canAddVerse = () => {
    if (tier !== "free") return true;
    return verses.length < FREE_VERSE_LIMIT;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-accent font-serif text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/collections" className="text-accent hover:underline text-sm">
          &larr; Collections
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">{collection?.name}</h1>
          {collection?.description && (
            <p className="text-ink/50 dark:text-[#E8D5B8]/50 text-sm">{collection.description}</p>
          )}
        </div>
        <button
          onClick={() => {
            if (!canAddVerse()) {
              alert("Free plan allows 10 verses. Upgrade to Pro for unlimited.");
              return;
            }
            setShowSearch(!showSearch);
          }}
          className="btn-primary text-sm"
        >
          + Add Verse
        </button>
      </div>

      {showSearch && (
        <VerseSearch
          collectionId={id}
          userId={profile!.id}
          onVerseAdded={handleVerseAdded}
          onClose={() => setShowSearch(false)}
        />
      )}

      {selectedVerse && (
        <VerseAI
          verse={selectedVerse}
          tier={tier}
          onClose={() => setSelectedVerse(null)}
        />
      )}

      {verses.length === 0 ? (
        <div className="verse-card flex-col gap-3 py-12">
          <p className="text-ink/60 dark:text-[#E8D5B8]/60 font-serif">
            No verses yet. Search and add your first verse!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {verses.map((verse) => (
            <div key={verse.id} className="verse-card flex-col gap-3 p-6 text-left">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold text-accent">
                  {verse.reference}
                </span>
                <span className="text-xs text-ink/40 dark:text-[#E8D5B8]/40">
                  {verse.translation}
                </span>
              </div>
              <p className="verse-text leading-relaxed">{verse.text}</p>
              {verse.tags && verse.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {verse.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setSelectedVerse(verse)}
                  className="btn-secondary text-sm"
                >
                  AI Tools
                </button>
                <button
                  onClick={() => deleteVerse(verse.id)}
                  className="text-sm text-red-600 hover:text-red-800 px-3"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
