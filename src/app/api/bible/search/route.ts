import { NextResponse } from "next/server";
import { TRANSLATIONS } from "@/lib/constants";

const BIBLE_API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_API_BASE = "https://api.scripture.api.bible/v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const translationName = searchParams.get("translation") || "KJV";

  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  // Find translation ID
  const translation = TRANSLATIONS.find((t) => t.name === translationName);
  const bibleId = translation?.id || TRANSLATIONS[0].id;

  // If no API key, return helpful message for manual entry
  if (!BIBLE_API_KEY) {
    return NextResponse.json({
      error: "Bible API not configured. Please add your verse manually using the 'Add Manually' button.",
      results: [],
    });
  }

  try {
    // Try as a verse reference first (e.g., "John 3:16")
    const searchResponse = await fetch(
      `${BIBLE_API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          "api-key": BIBLE_API_KEY,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Bible API returned ${searchResponse.status}`);
    }

    const data = await searchResponse.json();

    const results =
      data.data?.verses?.map(
        (v: { reference: string; text: string }) => ({
          reference: v.reference,
          text: v.text.replace(/<[^>]*>/g, "").trim(),
          translation: translationName,
        })
      ) ||
      data.data?.passages?.map(
        (p: { reference: string; content: string }) => ({
          reference: p.reference,
          text: p.content.replace(/<[^>]*>/g, "").trim(),
          translation: translationName,
        })
      ) ||
      [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Bible API error:", error);
    return NextResponse.json({
      error: "Search failed. Try adding the verse manually.",
      results: [],
    });
  }
}
