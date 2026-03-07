"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Database } from "@/types/database";
import { FREE_COLLECTION_LIMIT } from "@/lib/constants";

type Collection = Database["public"]["Tables"]["verse_collections"]["Row"];

export default function CollectionsPage() {
  const { profile } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [verseCounts, setVerseCounts] = useState<Record<string, number>>({});

  const supabase = createClient();
  const tier = profile?.subscription_tier || "free";

  useEffect(() => {
    fetchCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCollections = async () => {
    const { data } = await supabase
      .from("verse_collections")
      .select("*")
      .order("created_at", { ascending: false });

    setCollections(data || []);

    // Get verse counts per collection
    if (data) {
      const counts: Record<string, number> = {};
      for (const col of data as Collection[]) {
        const { count } = await supabase
          .from("verses")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", col.id);
        counts[col.id] = count || 0;
      }
      setVerseCounts(counts);
    }

    setLoading(false);
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tier === "free" && collections.length >= FREE_COLLECTION_LIMIT) {
      alert("Free plan allows 1 collection. Upgrade to Pro for unlimited collections.");
      return;
    }

    const { error } = await supabase.from("verse_collections").insert({
      user_id: profile!.id,
      name: newName,
      description: newDesc || null,
    });

    if (!error) {
      setNewName("");
      setNewDesc("");
      setShowNewForm(false);
      fetchCollections();
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm("Delete this collection and all its verses?")) return;
    await supabase.from("verse_collections").delete().eq("id", id);
    fetchCollections();
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">My Collections</h1>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="btn-primary text-sm"
        >
          + New Collection
        </button>
      </div>

      {showNewForm && (
        <form onSubmit={createCollection} className="verse-card flex-col gap-4 p-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            className="input-field"
            required
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="input-field"
          />
          <div className="flex gap-3">
            <button type="submit" className="btn-primary text-sm">Create</button>
            <button type="button" onClick={() => setShowNewForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {collections.length === 0 ? (
        <div className="verse-card flex-col gap-3 py-12">
          <p className="text-ink/60 dark:text-[#E8D5B8]/60 font-serif">
            No collections yet. Create one to start adding verses!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="verse-card flex-col gap-3 p-6 text-left">
              <div className="flex items-start justify-between w-full">
                <div>
                  <h3 className="font-serif font-semibold text-lg">{col.name}</h3>
                  {col.description && (
                    <p className="text-sm text-ink/50 dark:text-[#E8D5B8]/50">{col.description}</p>
                  )}
                </div>
                <span className="text-sm text-accent font-medium">
                  {verseCounts[col.id] || 0} verses
                </span>
              </div>
              <div className="flex gap-3 w-full">
                <Link
                  href={`/collections/${col.id}`}
                  className="btn-primary text-sm flex-1 text-center"
                >
                  View Verses
                </Link>
                <button
                  onClick={() => deleteCollection(col.id)}
                  className="text-sm text-red-600 hover:text-red-800 px-3"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
