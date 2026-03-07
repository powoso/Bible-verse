"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TRANSLATIONS } from "@/lib/constants";
import { getInitialSM2 } from "@/lib/sm2";

interface VerseSearchProps {
  collectionId: string;
  userId: string;
  onVerseAdded: () => void;
  onClose: () => void;
}

interface SearchResult {
  reference: string;
  text: string;
  translation: string;
}

export default function VerseSearch({
  collectionId,
  userId,
  onVerseAdded,
  onClose,
}: VerseSearchProps) {
  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState<string>(TRANSLATIONS[0].name);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customText, setCustomText] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState("");
  const [tags, setTags] = useState("");

  const supabase = createClient();

  const searchVerses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        `/api/bible/search?query=${encodeURIComponent(query)}&translation=${translation}`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results || []);
        if (data.results?.length === 0) {
          setError("No verses found. Try a different reference or search term.");
        }
      }
    } catch {
      setError("Search failed. You can add a verse manually below.");
      setUseCustom(true);
    } finally {
      setSearching(false);
    }
  };

  const saveVerse = async (result: SearchResult) => {
    setSaving(true);
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data: verse, error: verseError } = await supabase
      .from("verses")
      .insert({
        collection_id: collectionId,
        user_id: userId,
        reference: result.reference,
        text: result.text,
        translation: result.translation,
        tags: tagArray,
      })
      .select()
      .single();

    if (verseError) {
      setError(verseError.message);
      setSaving(false);
      return;
    }

    // Create user_verse entry with initial SM-2 values
    const sm2 = getInitialSM2();
    await supabase.from("user_verses").insert({
      user_id: userId,
      verse_id: verse.id,
      interval: sm2.interval,
      ease_factor: sm2.ease_factor,
      due_date: sm2.due_date,
      repetitions: sm2.repetitions,
      mastered: sm2.mastered,
    });

    setSaving(false);
    onVerseAdded();
  };

  const saveCustomVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !customText.trim()) return;

    await saveVerse({
      reference: query,
      text: customText,
      translation: translation,
    });
  };

  return (
    <div className="verse-card flex-col gap-4 p-6 text-left">
      <div className="flex items-center justify-between w-full">
        <h3 className="font-serif font-semibold">Search & Add Verse</h3>
        <button onClick={onClose} className="text-ink/40 hover:text-ink">
          ✕
        </button>
      </div>

      <form onSubmit={searchVerses} className="flex flex-col gap-3 w-full">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., John 3:16 or 'love one another'"
            className="input-field flex-1"
            required
          />
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="input-field w-auto"
          >
            {TRANSLATIONS.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
            <option value="ESV">ESV</option>
            <option value="NIV">NIV</option>
            <option value="NASB">NASB</option>
            <option value="NLT">NLT</option>
          </select>
        </div>

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated, e.g., love, faith, prayer)"
          className="input-field"
        />

        <div className="flex gap-3">
          <button type="submit" disabled={searching} className="btn-primary text-sm">
            {searching ? "Searching..." : "Search Bible"}
          </button>
          <button
            type="button"
            onClick={() => setUseCustom(!useCustom)}
            className="btn-secondary text-sm"
          >
            {useCustom ? "Use Search" : "Add Manually"}
          </button>
        </div>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {useCustom && (
        <form onSubmit={saveCustomVerse} className="flex flex-col gap-3 w-full">
          <p className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">
            Enter the reference above and paste the verse text below:
          </p>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Paste the verse text here..."
            className="input-field min-h-[100px] resize-y"
            required
          />
          <button type="submit" disabled={saving} className="btn-primary text-sm w-fit">
            {saving ? "Saving..." : "Save Verse"}
          </button>
        </form>
      )}

      {results.length > 0 && (
        <div className="space-y-3 w-full">
          <p className="text-sm text-ink/50 dark:text-[#E8D5B8]/50">
            {results.length} result(s) found:
          </p>
          {results.map((result, i) => (
            <div
              key={i}
              className="border border-accent/10 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-accent">
                  {result.reference}
                </span>
                <span className="text-xs text-ink/40">{result.translation}</span>
              </div>
              <p className="verse-text text-sm leading-relaxed">{result.text}</p>
              <button
                onClick={() => saveVerse(result)}
                disabled={saving}
                className="btn-primary text-sm"
              >
                {saving ? "Saving..." : "+ Add to Collection"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
