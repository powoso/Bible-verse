import { NextResponse } from "next/server";
import { TRANSLATIONS } from "@/lib/constants";

const BIBLE_API_BASE = "https://bible.helloao.org/api";

// Map common book names/abbreviations to HelloAO book codes
const BOOK_MAP: Record<string, { code: string; name: string }> = {
  // Old Testament
  genesis: { code: "GEN", name: "Genesis" },
  gen: { code: "GEN", name: "Genesis" },
  exodus: { code: "EXO", name: "Exodus" },
  exod: { code: "EXO", name: "Exodus" },
  ex: { code: "EXO", name: "Exodus" },
  leviticus: { code: "LEV", name: "Leviticus" },
  lev: { code: "LEV", name: "Leviticus" },
  numbers: { code: "NUM", name: "Numbers" },
  num: { code: "NUM", name: "Numbers" },
  deuteronomy: { code: "DEU", name: "Deuteronomy" },
  deut: { code: "DEU", name: "Deuteronomy" },
  joshua: { code: "JOS", name: "Joshua" },
  josh: { code: "JOS", name: "Joshua" },
  judges: { code: "JDG", name: "Judges" },
  judg: { code: "JDG", name: "Judges" },
  ruth: { code: "RUT", name: "Ruth" },
  "1 samuel": { code: "1SA", name: "1 Samuel" },
  "1samuel": { code: "1SA", name: "1 Samuel" },
  "1sam": { code: "1SA", name: "1 Samuel" },
  "1 sam": { code: "1SA", name: "1 Samuel" },
  "2 samuel": { code: "2SA", name: "2 Samuel" },
  "2samuel": { code: "2SA", name: "2 Samuel" },
  "2sam": { code: "2SA", name: "2 Samuel" },
  "2 sam": { code: "2SA", name: "2 Samuel" },
  "1 kings": { code: "1KI", name: "1 Kings" },
  "1kings": { code: "1KI", name: "1 Kings" },
  "1 kgs": { code: "1KI", name: "1 Kings" },
  "2 kings": { code: "2KI", name: "2 Kings" },
  "2kings": { code: "2KI", name: "2 Kings" },
  "2 kgs": { code: "2KI", name: "2 Kings" },
  "1 chronicles": { code: "1CH", name: "1 Chronicles" },
  "1chronicles": { code: "1CH", name: "1 Chronicles" },
  "1 chr": { code: "1CH", name: "1 Chronicles" },
  "2 chronicles": { code: "2CH", name: "2 Chronicles" },
  "2chronicles": { code: "2CH", name: "2 Chronicles" },
  "2 chr": { code: "2CH", name: "2 Chronicles" },
  ezra: { code: "EZR", name: "Ezra" },
  nehemiah: { code: "NEH", name: "Nehemiah" },
  neh: { code: "NEH", name: "Nehemiah" },
  esther: { code: "EST", name: "Esther" },
  est: { code: "EST", name: "Esther" },
  job: { code: "JOB", name: "Job" },
  psalms: { code: "PSA", name: "Psalms" },
  psalm: { code: "PSA", name: "Psalms" },
  ps: { code: "PSA", name: "Psalms" },
  psa: { code: "PSA", name: "Psalms" },
  proverbs: { code: "PRO", name: "Proverbs" },
  prov: { code: "PRO", name: "Proverbs" },
  pro: { code: "PRO", name: "Proverbs" },
  ecclesiastes: { code: "ECC", name: "Ecclesiastes" },
  eccl: { code: "ECC", name: "Ecclesiastes" },
  ecc: { code: "ECC", name: "Ecclesiastes" },
  "song of solomon": { code: "SNG", name: "Song of Solomon" },
  "song of songs": { code: "SNG", name: "Song of Solomon" },
  "songs": { code: "SNG", name: "Song of Solomon" },
  isaiah: { code: "ISA", name: "Isaiah" },
  isa: { code: "ISA", name: "Isaiah" },
  jeremiah: { code: "JER", name: "Jeremiah" },
  jer: { code: "JER", name: "Jeremiah" },
  lamentations: { code: "LAM", name: "Lamentations" },
  lam: { code: "LAM", name: "Lamentations" },
  ezekiel: { code: "EZK", name: "Ezekiel" },
  ezek: { code: "EZK", name: "Ezekiel" },
  daniel: { code: "DAN", name: "Daniel" },
  dan: { code: "DAN", name: "Daniel" },
  hosea: { code: "HOS", name: "Hosea" },
  hos: { code: "HOS", name: "Hosea" },
  joel: { code: "JOL", name: "Joel" },
  amos: { code: "AMO", name: "Amos" },
  obadiah: { code: "OBA", name: "Obadiah" },
  obad: { code: "OBA", name: "Obadiah" },
  jonah: { code: "JON", name: "Jonah" },
  micah: { code: "MIC", name: "Micah" },
  mic: { code: "MIC", name: "Micah" },
  nahum: { code: "NAM", name: "Nahum" },
  nah: { code: "NAM", name: "Nahum" },
  habakkuk: { code: "HAB", name: "Habakkuk" },
  hab: { code: "HAB", name: "Habakkuk" },
  zephaniah: { code: "ZEP", name: "Zephaniah" },
  zeph: { code: "ZEP", name: "Zephaniah" },
  haggai: { code: "HAG", name: "Haggai" },
  hag: { code: "HAG", name: "Haggai" },
  zechariah: { code: "ZEC", name: "Zechariah" },
  zech: { code: "ZEC", name: "Zechariah" },
  malachi: { code: "MAL", name: "Malachi" },
  mal: { code: "MAL", name: "Malachi" },
  // New Testament
  matthew: { code: "MAT", name: "Matthew" },
  matt: { code: "MAT", name: "Matthew" },
  mat: { code: "MAT", name: "Matthew" },
  mark: { code: "MRK", name: "Mark" },
  mrk: { code: "MRK", name: "Mark" },
  luke: { code: "LUK", name: "Luke" },
  luk: { code: "LUK", name: "Luke" },
  john: { code: "JHN", name: "John" },
  jhn: { code: "JHN", name: "John" },
  acts: { code: "ACT", name: "Acts" },
  romans: { code: "ROM", name: "Romans" },
  rom: { code: "ROM", name: "Romans" },
  "1 corinthians": { code: "1CO", name: "1 Corinthians" },
  "1corinthians": { code: "1CO", name: "1 Corinthians" },
  "1 cor": { code: "1CO", name: "1 Corinthians" },
  "1cor": { code: "1CO", name: "1 Corinthians" },
  "2 corinthians": { code: "2CO", name: "2 Corinthians" },
  "2corinthians": { code: "2CO", name: "2 Corinthians" },
  "2 cor": { code: "2CO", name: "2 Corinthians" },
  "2cor": { code: "2CO", name: "2 Corinthians" },
  galatians: { code: "GAL", name: "Galatians" },
  gal: { code: "GAL", name: "Galatians" },
  ephesians: { code: "EPH", name: "Ephesians" },
  eph: { code: "EPH", name: "Ephesians" },
  philippians: { code: "PHP", name: "Philippians" },
  phil: { code: "PHP", name: "Philippians" },
  colossians: { code: "COL", name: "Colossians" },
  col: { code: "COL", name: "Colossians" },
  "1 thessalonians": { code: "1TH", name: "1 Thessalonians" },
  "1thessalonians": { code: "1TH", name: "1 Thessalonians" },
  "1 thess": { code: "1TH", name: "1 Thessalonians" },
  "1thess": { code: "1TH", name: "1 Thessalonians" },
  "2 thessalonians": { code: "2TH", name: "2 Thessalonians" },
  "2thessalonians": { code: "2TH", name: "2 Thessalonians" },
  "2 thess": { code: "2TH", name: "2 Thessalonians" },
  "2thess": { code: "2TH", name: "2 Thessalonians" },
  "1 timothy": { code: "1TI", name: "1 Timothy" },
  "1timothy": { code: "1TI", name: "1 Timothy" },
  "1 tim": { code: "1TI", name: "1 Timothy" },
  "1tim": { code: "1TI", name: "1 Timothy" },
  "2 timothy": { code: "2TI", name: "2 Timothy" },
  "2timothy": { code: "2TI", name: "2 Timothy" },
  "2 tim": { code: "2TI", name: "2 Timothy" },
  "2tim": { code: "2TI", name: "2 Timothy" },
  titus: { code: "TIT", name: "Titus" },
  philemon: { code: "PHM", name: "Philemon" },
  phlm: { code: "PHM", name: "Philemon" },
  hebrews: { code: "HEB", name: "Hebrews" },
  heb: { code: "HEB", name: "Hebrews" },
  james: { code: "JAS", name: "James" },
  jas: { code: "JAS", name: "James" },
  "1 peter": { code: "1PE", name: "1 Peter" },
  "1peter": { code: "1PE", name: "1 Peter" },
  "1 pet": { code: "1PE", name: "1 Peter" },
  "1pet": { code: "1PE", name: "1 Peter" },
  "2 peter": { code: "2PE", name: "2 Peter" },
  "2peter": { code: "2PE", name: "2 Peter" },
  "2 pet": { code: "2PE", name: "2 Peter" },
  "2pet": { code: "2PE", name: "2 Peter" },
  "1 john": { code: "1JN", name: "1 John" },
  "1john": { code: "1JN", name: "1 John" },
  "1 jn": { code: "1JN", name: "1 John" },
  "2 john": { code: "2JN", name: "2 John" },
  "2john": { code: "2JN", name: "2 John" },
  "2 jn": { code: "2JN", name: "2 John" },
  "3 john": { code: "3JN", name: "3 John" },
  "3john": { code: "3JN", name: "3 John" },
  "3 jn": { code: "3JN", name: "3 John" },
  jude: { code: "JUD", name: "Jude" },
  revelation: { code: "REV", name: "Revelation" },
  rev: { code: "REV", name: "Revelation" },
};

interface ParsedRef {
  bookCode: string;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

function parseReference(query: string): ParsedRef | null {
  // Match patterns like "John 3:16", "1 Cor 13:4-7", "Genesis 1", "Ps 23:1"
  const match = query
    .trim()
    .match(/^(\d?\s*[a-zA-Z\s]+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/);

  if (!match) return null;

  const bookInput = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verseStart = match[3] ? parseInt(match[3], 10) : undefined;
  const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

  const book = BOOK_MAP[bookInput];
  if (!book) return null;

  return {
    bookCode: book.code,
    bookName: book.name,
    chapter,
    verseStart,
    verseEnd,
  };
}

// Extract plain text from HelloAO chapter content array
function extractVerseText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any[],
  verseStart?: number,
  verseEnd?: number
): { number: number; text: string }[] {
  const verses: Map<number, string[]> = new Map();

  for (const item of content) {
    if (item.type === "verse" && item.number !== undefined) {
      // Each verse content item has a number and text
      const vNum = typeof item.number === "string" ? parseInt(item.number, 10) : item.number;
      if (verseStart !== undefined) {
        const end = verseEnd ?? verseStart;
        if (vNum < verseStart || vNum > end) continue;
      }
      if (!verses.has(vNum)) verses.set(vNum, []);
      if (item.text) {
        verses.get(vNum)!.push(item.text);
      }
    }
    // Also handle content that has verse as a number field directly
    if (item.verse !== undefined && item.text) {
      const vNum = typeof item.verse === "string" ? parseInt(item.verse, 10) : item.verse;
      if (verseStart !== undefined) {
        const end = verseEnd ?? verseStart;
        if (vNum < verseStart || vNum > end) continue;
      }
      if (!verses.has(vNum)) verses.set(vNum, []);
      verses.get(vNum)!.push(item.text);
    }
  }

  return Array.from(verses.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, parts]) => ({
      number,
      text: parts.join(" ").replace(/\s+/g, " ").trim(),
    }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const translationName = searchParams.get("translation") || "KJV";

  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  // Find translation ID for HelloAO
  const translation = TRANSLATIONS.find((t) => t.name === translationName);
  const translationId = translation?.id || TRANSLATIONS[0].id;

  // Parse the reference
  const parsed = parseReference(query);

  if (!parsed) {
    return NextResponse.json({
      error: "Please enter a verse reference like \"John 3:16\" or \"Psalm 23:1-6\". Free-text search is not supported.",
      results: [],
    });
  }

  try {
    const url = `${BIBLE_API_BASE}/${translationId}/${parsed.bookCode}/${parsed.chapter}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          error: `Could not find ${parsed.bookName} ${parsed.chapter} in ${translationName}. Check the reference and try again.`,
          results: [],
        });
      }
      throw new Error(`Bible API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.chapter?.content || data.content || [];
    const verses = extractVerseText(content, parsed.verseStart, parsed.verseEnd);

    if (verses.length === 0) {
      return NextResponse.json({
        error: `No verses found for that reference. Try adding the verse manually.`,
        results: [],
      });
    }

    // If a specific verse or range was requested, combine into one result
    if (parsed.verseStart !== undefined) {
      const combinedText = verses.map((v) => v.text).join(" ");
      const endVerse = parsed.verseEnd ?? parsed.verseStart;
      const ref =
        parsed.verseStart === endVerse
          ? `${parsed.bookName} ${parsed.chapter}:${parsed.verseStart}`
          : `${parsed.bookName} ${parsed.chapter}:${parsed.verseStart}-${endVerse}`;

      return NextResponse.json({
        results: [
          {
            reference: ref,
            text: combinedText,
            translation: translationName,
          },
        ],
      });
    }

    // If only a chapter was requested, return first 5 verses as preview
    const preview = verses.slice(0, 5);
    return NextResponse.json({
      results: preview.map((v) => ({
        reference: `${parsed.bookName} ${parsed.chapter}:${v.number}`,
        text: v.text,
        translation: translationName,
      })),
    });
  } catch (error) {
    console.error("Bible API error:", error);
    return NextResponse.json({
      error: "Search failed. Try adding the verse manually.",
      results: [],
    });
  }
}
