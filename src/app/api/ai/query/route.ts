import { NextResponse, type NextRequest } from "next/server";
import { AI_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { canAccessAI } from "@/lib/permissions";
import { buildAIContext } from "@/lib/server/ai-context";
import { generateText } from "@/lib/server/ai-provider";
import { getServerAuthContext } from "@/lib/server/auth";
import { FieldValue, getAdminDb } from "@/lib/server/firebase-admin";
import {
  isReferenceSearchQuestion,
  searchDesignReferencesFromQuestion,
} from "@/lib/server/reference-search";

export const runtime = "nodejs";

const DEFAULT_DAILY_LIMIT = 20;

function getDailyLimit() {
  const rawValue = process.env.AI_DAILY_LIMIT;

  if (!rawValue) {
    return DEFAULT_DAILY_LIMIT;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return DEFAULT_DAILY_LIMIT;
  }

  return parsedValue;
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function countQuestionsToday(userId: string) {
  const snapshot = await getAdminDb()
    .collection("ai_logs")
    .where("asked_by", "==", userId)
    .get();
  const startOfToday = getStartOfToday().getTime();

  return snapshot.docs.filter((item) => {
    const createdAt = item.data().created_at;

    if (!createdAt || typeof createdAt !== "object" || !("toDate" in createdAt)) {
      return false;
    }

    return (createdAt as { toDate: () => Date }).toDate().getTime() >= startOfToday;
  }).length;
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getServerAuthContext(request);

    if (!canAccessAI(profile)) {
      return NextResponse.json(
        { error: "Anda tidak punya akses ke AI Assistant." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      question?: string;
      eventId?: string;
    };
    const question = body.question?.trim() ?? "";

    if (!question) {
      return NextResponse.json(
        { error: "Pertanyaan wajib diisi." },
        { status: 400 },
      );
    }

    if (question.length > 1000) {
      return NextResponse.json(
        { error: "Pertanyaan terlalu panjang. Maksimal 1000 karakter." },
        { status: 400 },
      );
    }

    const questionsToday = await countQuestionsToday(profile.id);

    const dailyLimit = getDailyLimit();

    if (questionsToday >= dailyLimit) {
      return NextResponse.json(
        { error: `Batas ${dailyLimit} pertanyaan hari ini sudah tercapai.` },
        { status: 429 },
      );
    }

    // --- Reference Search Intent Detection ---
    if (isReferenceSearchQuestion(question)) {
      const searchResult = await searchDesignReferencesFromQuestion(question);

      const logRef = getAdminDb().collection("ai_logs").doc();
      await logRef.set({
        id: logRef.id,
        organization_id: profile.organization_id || "main_org",
        asked_by: profile.id,
        question,
        context_summary: "Reference search query - Firestore collection matched directly.",
        answer: searchResult,
        model_used: "firestore-reference-search",
        source: "web",
        created_at: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        answer: searchResult,
        context_summary: "Reference search query - Firestore collection matched directly.",
      });
    }

    const { contextSummary } = await buildAIContext({
      profile,
      eventId: body.eventId,
    });
    const prompt = [
      "CONTEXT JOBDEX.IN:",
      contextSummary,
      "",
      "PERTANYAAN USER:",
      question,
      "",
      "Instruksi jawaban: jawab ringkas, gunakan bullet bila membantu, dan jangan memakai data di luar context.",
    ].join("\n");
    const aiResult = await generateText({
      systemPrompt: AI_SYSTEM_PROMPT,
      prompt,
      feature: "web_assistant",
      modelTier: "pro",
    });
    const answer = aiResult.text;
    const logRef = getAdminDb().collection("ai_logs").doc();

    await logRef.set({
      id: logRef.id,
      organization_id: profile.organization_id || "main_org",
      asked_by: profile.id,
      question,
      context_summary: contextSummary.slice(0, 12000),
      answer,
      model_used: aiResult.model,
      source: "web",
      created_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      answer,
      context_summary: contextSummary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI Assistant gagal menjawab.",
      },
      { status: 500 },
    );
  }
}
