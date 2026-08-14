import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { normalizeFonnteWebhookPayload } from "@/lib/server/fonnte-webhook-parser";
import { parseWhatsAppCommand, isTaskCommandLike } from "@/lib/server/whatsapp-command-parser";
import { isReferenceSearchQuestion, searchDesignReferencesDetailed } from "@/lib/server/reference-search";
import { buildAIContext } from "@/lib/server/ai-context";
import { generateText } from "@/lib/server/ai-provider";
import { AI_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { executeWhatsAppWebhook } from "@/lib/server/whatsapp/command-handler";
import type { NormalizedIncomingWhatsAppMessage, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook simulation endpoint is active. Send a POST request with { message, sender, groupId, dryRun } to test.",
    examplePayload: {
      message: "!jobdex tugas saya",
      sender: "6287798799068",
      senderName: "Test User",
      groupId: "120363406824082148@g.us",
      isGroup: true,
      provider: "fonnte",
      dryRun: true,
    },
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const rawBody = await request.json().catch(() => ({}));
    
    // Normalize payload
    let incoming: NormalizedIncomingWhatsAppMessage | null = null;

    if (rawBody.message && typeof rawBody.message === "string") {
      incoming = {
        provider: rawBody.provider === "wablas" ? "wablas" : "fonnte",
        message: rawBody.message.trim(),
        sender: (rawBody.sender || "6287798799068").replace(/[^\d]/g, "").replace(/^0/, "62"),
        senderName: rawBody.senderName || "Tester",
        groupId: rawBody.groupId || "120363406824082148@g.us",
        isGroup: rawBody.isGroup !== false,
        timestamp: Date.now(),
      };
    } else {
      incoming = normalizeFonnteWebhookPayload(rawBody);
    }

    if (!incoming || !incoming.message) {
      return NextResponse.json(
        { ok: false, error: "Pesan tidak ditemukan dalam payload simulasi." },
        { status: 400 }
      );
    }

    const dryRun = rawBody.dryRun !== false; // Default true for safe testing

    // Live Execution mode
    if (!dryRun) {
      const response = await executeWhatsAppWebhook(incoming, rawBody);
      const resJson = await response.json().catch(() => ({ ok: response.ok }));
      return NextResponse.json({
        ok: response.ok,
        mode: "live_execution",
        incoming,
        response: resJson,
        durationMs: Date.now() - startTime,
      });
    }

    // Dry Run Simulation Mode: Inspect and simulate step-by-step
    const db = getAdminDb();
    
    // 1. Resolve Sender
    const senderClean = incoming.sender.replace(/[^\d]/g, "").replace(/^0/, "62");
    let matchedUser: UserProfile | null = null;
    const usersSnap = await db.collection("users").get();
    
    usersSnap.forEach((doc) => {
      const data = doc.data() as UserProfile;
      const dbPhone = (data.whatsapp_number || "").replace(/[^\d]/g, "").replace(/^0/, "62");
      if (dbPhone && (dbPhone === senderClean || senderClean.endsWith(dbPhone) || dbPhone.endsWith(senderClean))) {
        matchedUser = { ...data, id: doc.id };
      }
    });

    // 2. Parse Command
    const parsedCommand = parseWhatsAppCommand(incoming.message);
    const isTaskLike = isTaskCommandLike(incoming.message);
    const isRefSearch = isReferenceSearchQuestion(incoming.message);

    let simulationResult: {
      category: "task_command" | "preview_command" | "reference_search" | "ai_qa";
      intent: string;
      simulatedReply: string;
      details?: Record<string, unknown>;
    };

    if (isRefSearch) {
      const searchRes = await searchDesignReferencesDetailed(incoming.message);
      simulationResult = {
        category: "reference_search",
        intent: "search_reference",
        simulatedReply: searchRes.answer,
        details: {
          rerankerProvider: searchRes.rerankerProvider,
          finalResultCount: searchRes.finalResultCount,
          candidateCount: searchRes.candidateCount,
          fallbackUsed: searchRes.fallbackUsed,
        },
      };
    } else if (parsedCommand.intent !== "unknown" && parsedCommand.intent !== "progress_question") {
      simulationResult = {
        category: "task_command",
        intent: parsedCommand.intent,
        simulatedReply: `[Simulation] Perintah "${parsedCommand.intent}" terdeteksi dengan parameter: ${JSON.stringify(parsedCommand.fields)}`,
        details: {
          parsedFields: parsedCommand.fields,
          items: parsedCommand.items,
        },
      };
    } else {
      // AI Q&A Fallback Simulation
      const { contextSummary, taskCount } = await buildAIContext({
        profile: matchedUser || {
          id: "simulated_user",
          organization_id: "main_org",
          name: incoming.senderName || "Simulated User",
          email: "tester@jobdesk.in",
          whatsapp_number: incoming.sender,
          role: "super_admin",
          division_id: "humas_media_kreatif",
          avatar_url: "",
          is_active: true,
        },
      });

      const prompt = [
        "CONTEXT JOBDEXIN:",
        contextSummary,
        "",
        "PERTANYAAN DARI WHATSAPP:",
        incoming.message,
        "",
        "Instruksi jawaban: jawab ringkas, siap dibaca di WhatsApp group, dan jangan memakai data di luar context.",
      ].join("\n");

      const aiResult = await generateText({
        systemPrompt: AI_SYSTEM_PROMPT,
        prompt,
        feature: "whatsapp_assistant_simulation",
        modelTier: "fast",
      });

      simulationResult = {
        category: "ai_qa",
        intent: "gemini_ai_response",
        simulatedReply: aiResult.text,
        details: {
          provider: aiResult.provider,
          model: aiResult.model,
          contextTaskCount: taskCount,
          inputChars: aiResult.inputChars,
          outputChars: aiResult.outputChars,
        },
      };
    }

    return NextResponse.json({
      ok: true,
      mode: "dry_run_simulation",
      incoming,
      matchedUser: matchedUser
        ? {
            id: (matchedUser as UserProfile).id,
            name: (matchedUser as UserProfile).name,
            role: (matchedUser as UserProfile).role,
            whatsapp_number: (matchedUser as UserProfile).whatsapp_number,
          }
        : null,
      parsing: {
        intent: parsedCommand.intent,
        isTaskLike,
        isRefSearch,
        fields: parsedCommand.fields,
      },
      simulation: simulationResult,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `Simulation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
