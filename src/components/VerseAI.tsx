"use client";

import { useState } from "react";
import type { Database } from "@/types/database";

type Verse = Database["public"]["Tables"]["verses"]["Row"];

interface VerseAIProps {
  verse: Verse;
  tier: string;
  onClose: () => void;
}

type AIFeature = "explain" | "remember" | "quiz" | "connect";

export default function VerseAI({ verse, tier, onClose }: VerseAIProps) {
  const [activeFeature, setActiveFeature] = useState<AIFeature | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const isPro = tier === "pro" || tier === "church";

  const features: { id: AIFeature; label: string; desc: string }[] = [
    { id: "explain", label: "Explain This Verse", desc: "Historical context & meaning" },
    { id: "remember", label: "Help Me Remember", desc: "Mnemonic or memory palace" },
    { id: "quiz", label: "Quiz Me", desc: "Comprehension questions" },
    { id: "connect", label: "Connect It", desc: "3 related verses" },
  ];

  const handleFeature = async (feature: AIFeature) => {
    if (!isPro) {
      alert("AI features require a Pro subscription. Upgrade in Settings.");
      return;
    }

    setActiveFeature(feature);
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          reference: verse.reference,
          text: verse.text,
          translation: verse.translation,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setResponse("Error: " + data.error);
      } else {
        setResponse(data.response);
      }
    } catch {
      setResponse("Failed to get AI response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verse-card flex-col gap-4 p-6 text-left">
      <div className="flex items-center justify-between w-full">
        <h3 className="font-serif font-semibold">AI Tools</h3>
        <button onClick={onClose} className="text-ink/40 hover:text-ink">
          ✕
        </button>
      </div>

      <div className="w-full border border-accent/10 rounded-xl p-4 bg-accent/5">
        <span className="text-sm font-semibold text-accent">{verse.reference}</span>
        <p className="verse-text text-sm mt-1">{verse.text}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {features.map((f) => (
          <button
            key={f.id}
            onClick={() => handleFeature(f.id)}
            disabled={loading}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFeature === f.id
                ? "border-accent bg-accent/10"
                : "border-accent/10 hover:border-accent/30"
            } ${!isPro ? "opacity-50" : ""}`}
          >
            <span className="text-sm font-semibold block">{f.label}</span>
            <span className="text-xs text-ink/50 dark:text-[#E8D5B8]/50">{f.desc}</span>
            {!isPro && <span className="text-xs text-accent block mt-1">Pro only</span>}
          </button>
        ))}
      </div>

      {loading && (
        <div className="w-full text-center py-4">
          <div className="animate-pulse text-accent font-serif">Thinking...</div>
        </div>
      )}

      {response && !loading && (
        <div className="w-full border border-accent/10 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-semibold text-accent">
            {features.find((f) => f.id === activeFeature)?.label}
          </h4>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
}
