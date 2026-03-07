import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

const getAnthropic = () => new Anthropic();

const PROMPTS: Record<string, (ref: string, text: string, translation: string) => string> = {
  explain: (ref, text, translation) =>
    `You are a biblical scholar. Explain this verse in depth:

Reference: ${ref} (${translation})
Text: "${text}"

Provide:
1. Historical context — who wrote it, when, to whom, and why
2. Meaning — what it meant to the original audience and what it means today
3. Original language notes — key Hebrew/Greek words and their nuances
4. Application — how a believer might apply this today

Keep it clear, educational, and respectful of diverse Christian traditions. About 300 words.`,

  remember: (ref, text) =>
    `You are a memory coach specializing in Scripture memorization. Create a vivid mnemonic device for this verse:

Reference: ${ref}
Text: "${text}"

Provide ONE of these (whichever fits best):
1. A vivid, imaginative memory palace story that walks through each phrase of the verse in a memorable scene
2. An acronym or acrostic using the first letters of key words
3. A visual association linking each phrase to a striking image

Make it creative, vivid, and memorable. The goal is to help someone recall every word. About 200 words.`,

  quiz: (ref, text) =>
    `You are a Bible study leader. Create comprehension questions for this verse:

Reference: ${ref}
Text: "${text}"

Generate 5 questions:
1. A factual recall question about what the verse says
2. A context question about the surrounding passage
3. A meaning question about key words or phrases
4. An application question about how to live this out
5. A connection question linking this to other Scripture

Format each with the question followed by a brief suggested answer. About 300 words.`,

  connect: (ref, text) =>
    `You are a Bible cross-reference expert. For this verse:

Reference: ${ref}
Text: "${text}"

Find 3 thematically related verses from different parts of the Bible. For each:
1. Give the full reference and text
2. Explain the thematic connection in 1-2 sentences
3. Note whether it's from the same testament or different

Choose verses that genuinely deepen understanding of the theme, not just surface-level word matches. About 250 words.`,
};

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription tier
    const { data: user } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", session.user.id)
      .single();

    if (!user || user.subscription_tier === "free") {
      return NextResponse.json(
        { error: "AI features require a Pro subscription" },
        { status: 403 }
      );
    }

    const { feature, reference, text, translation } = await request.json();

    const promptFn = PROMPTS[feature];
    if (!promptFn) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: promptFn(reference, text, translation),
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: "AI request failed. Please try again." },
      { status: 500 }
    );
  }
}
