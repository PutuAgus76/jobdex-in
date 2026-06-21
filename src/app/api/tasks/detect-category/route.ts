import { NextResponse, type NextRequest } from "next/server";
import { getServerAuthContext } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import {
  runRuleBasedDetection,
  runReferenceSimilarityDetection,
  type DetectJobdeskCategoryResult,
} from "@/lib/jobdesk-category-detection";
import { MAIN_CATEGORIES, CATEGORY_RULES } from "@/lib/jobdesk-categories";
import { generateText } from "@/lib/server/ai-provider";
import type { ReferenceListItem } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    await getServerAuthContext(request);
    
    // 2. Parse request body
    const body = await request.json();
    const { title, description, eventName } = body;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Judul jobdesk wajib diisi." }, { status: 400 });
    }

    // 3. Try Rule-based keyword detection
    let result = runRuleBasedDetection(title, description || "");
    if (result) {
      return NextResponse.json(result);
    }

    // 4. Try Reference similarity detection
    const db = getAdminDb();
    
    // Fetch manual references (non-archived)
    const referencesSnap = await db
      .collection("design_references")
      .where("is_archived", "==", false)
      .get();
    
    const manualReferences: ReferenceListItem[] = [];
    referencesSnap.forEach((doc) => {
      const data = doc.data();
      manualReferences.push({
        id: doc.id,
        source_type: "manual_reference",
        title: data.title || "",
        event_name: data.event_name || "",
        year: data.year || 0,
        visual_type: data.design_type || "",
        category_label: data.category || "",
        subcategory_label: data.subcategory || "",
        created_by: data.created_by || "",
      });
    });

    // Fetch approved tasks
    const tasksSnap = await db
      .collection("tasks")
      .where("status", "==", "approved")
      .get();
    
    const approvedTasks: ReferenceListItem[] = [];
    tasksSnap.forEach((doc) => {
      const data = doc.data();
      approvedTasks.push({
        id: `task_${doc.id}`,
        source_type: "approved_task",
        title: data.name || "",
        event_name: "", // eventName matching is optional
        visual_type: data.subcategory_key || "",
        category_label: data.category_key || "",
        subcategory_label: data.subcategory_key || "",
        created_by: data.pic_id || "",
      });
    });

    const allReferences = [...manualReferences, ...approvedTasks];
    result = runReferenceSimilarityDetection(title, allReferences, eventName);
    if (result) {
      return NextResponse.json(result);
    }

    // 5. AI Fallback (using generateText helper)
    try {
      const validCategoryKeys = MAIN_CATEGORIES.map(c => c.key);
      const validCombinations = CATEGORY_RULES.map(r => ({
        category_key: r.categoryKey,
        subcategory_key: r.subcategoryKey,
        label: r.subcategoryLabel,
      }));

      const systemPrompt = `You are a precise AI category classifier for JobDex.in task management.
Classify the jobdesk task based on its title and description.
You MUST choose ONLY from the following valid category keys and their valid subcategory keys.

VALID CATEGORIES:
${JSON.stringify(validCategoryKeys, null, 2)}

VALID CATEGORY-SUBCATEGORY COMBINATIONS:
${JSON.stringify(validCombinations, null, 2)}

Rules for Output fields:
1. If the category produces visual/design assets (like poster, banner, feed, nametag, cert, logo, twibbon), set archive_enabled = true and reference_candidate_enabled = true.
2. If the category is for important documents (like RAB, LPJ, proposal, rundown), set archive_enabled = true and reference_candidate_enabled = false.
3. If the category is for coordination/briefing/activities without file outputs, set archive_enabled = false and reference_candidate_enabled = false.
4. If the task contains sensitive data (money, personal participant data, phone numbers, payments, receipts), set data_sensitivity = "sensitive" or "limited". Otherwise set "public_internal".

You MUST return a JSON object in this format:
{
  "category_key": "<key_or_null>",
  "subcategory_key": "<key_or_null>",
  "archive_enabled": <boolean>,
  "reference_candidate_enabled": <boolean>,
  "data_sensitivity": "public_internal" | "limited" | "sensitive",
  "confidence": <0.0 to 1.0>,
  "reason": "<explanation in Indonesian>",
  "source": "ai_fallback"
}

If you are not confident or cannot find a match, set "source" = "manual_required" and return null/default values.`;

      const userPrompt = `Task Title: "${title}"
Task Description: "${description || ""}"
Event Name: "${eventName || ""}"`;

      const aiResult = await generateText({
        systemPrompt,
        prompt: userPrompt,
        feature: "task_category_detection",
        provider: "gemini",
        useCache: true,
        responseFormat: { type: "json_object" },
        temperature: 0.1,
      });

      const parsed = JSON.parse(aiResult.text.trim());
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed.source === "ai_fallback" || parsed.source === "manual_required")
      ) {
        return NextResponse.json(parsed);
      }
    } catch (aiErr) {
      console.warn("AI Fallback failed or returned invalid JSON:", aiErr);
    }

    // Default Fallback
    const fallbackResult: DetectJobdeskCategoryResult = {
      category_key: null,
      subcategory_key: null,
      archive_enabled: true,
      reference_candidate_enabled: false,
      data_sensitivity: "public_internal",
      confidence: 0,
      source: "manual_required",
      reason: "Belum bisa mendeteksi kategori dengan yakin. Silakan pilih kategori manual.",
    };
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error("[Category Detection API] Failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mendeteksi kategori." },
      { status: 500 }
    );
  }
}
