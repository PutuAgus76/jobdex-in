import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import type { DesignReference } from "@/types";

export const dynamic = "force-dynamic";

function expandKeywords(question: string): string[] {
  const clean = question.toLowerCase();
  const words = clean
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const expanded = new Set<string>(words);

  const synonymGroups = [
    ["poster", "pamflet", "flyer", "feed", "publikasi"],
    ["nametag", "name tag", "id card", "tanda pengenal"],
    ["audio", "sound", "senam", "mp3", "audio/mpeg"],
    ["video", "mp4", "reels", "animasi"],
    ["perlengkapan", "aset", "peralatan"],
  ];

  for (const word of words) {
    for (const group of synonymGroups) {
      if (group.includes(word)) {
        group.forEach((syn) => expanded.add(syn));
      }
    }
  }

  if (clean.includes("name tag")) {
    expanded.add("nametag");
    expanded.add("name tag");
    expanded.add("id card");
    expanded.add("tanda pengenal");
  }
  if (clean.includes("id card")) {
    expanded.add("nametag");
    expanded.add("name tag");
    expanded.add("tanda pengenal");
  }
  if (clean.includes("tanda pengenal")) {
    expanded.add("nametag");
    expanded.add("name tag");
    expanded.add("id card");
  }

  return Array.from(expanded);
}

function calculateScore(ref: DesignReference, cleanQuestion: string, keywords: string[]): number {
  let score = 0;

  if (ref.title.toLowerCase().trim() === cleanQuestion) {
    score += 8;
  }

  for (const keyword of keywords) {
    if (ref.title.toLowerCase().includes(keyword)) {
      score += 5;
    }
  }

  if (ref.file_inventory && Array.isArray(ref.file_inventory)) {
    for (const file of ref.file_inventory) {
      if (file.name) {
        for (const keyword of keywords) {
          if (file.name.toLowerCase().includes(keyword)) {
            score += 5;
            break;
          }
        }
      }
    }
  }

  if (ref.event_name) {
    for (const keyword of keywords) {
      if (ref.event_name.toLowerCase().includes(keyword)) {
        score += 4;
      }
    }
  }

  const yearMatch = cleanQuestion.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const yearAsked = parseInt(yearMatch[1], 10);
    if (ref.year === yearAsked) {
      score += 4;
    }
  }

  for (const keyword of keywords) {
    if (
      (ref.category && ref.category.toLowerCase().includes(keyword)) ||
      (ref.design_type && ref.design_type.toLowerCase().includes(keyword))
    ) {
      score += 3;
    }
  }

  for (const keyword of keywords) {
    if (
      (ref.summary_notes && ref.summary_notes.toLowerCase().includes(keyword)) ||
      (ref.notes && ref.notes.toLowerCase().includes(keyword)) ||
      (ref.style_notes && ref.style_notes.toLowerCase().includes(keyword))
    ) {
      score += 2;
    }
  }

  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryText = searchParams.get("q") || "";

  if (!queryText.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const cleanQuestion = queryText.toLowerCase().trim();
    const keywords = expandKeywords(cleanQuestion);

    const db = getAdminDb();
    const snapshot = await db
      .collection("design_references")
      .where("is_archived", "==", false)
      .get();

    const allReferences: DesignReference[] = [];
    snapshot.forEach((doc) => {
      allReferences.push({ id: doc.id, ...doc.data() } as DesignReference);
    });

    const scored = allReferences
      .map((ref) => ({
        ref,
        score: calculateScore(ref, cleanQuestion, keywords),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.ref);

    return NextResponse.json({ results: scored });
  } catch (error: unknown) {
    console.error("[Search References API] Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
