import "server-only";

import { getAdminDb, FieldValue } from "@/lib/server/firebase-admin";
import { askGemini, GEMINI_MODEL, GEMINI_EMPTY_ANSWER_FALLBACK } from "@/lib/server/gemini";
import { getCachedResponse, setCachedResponse } from "@/lib/server/ai-cache";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AIProviderName = "deepseek" | "gemini" | "mock";

export interface AIProviderParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  feature: string; // for logging and cache key
  useCache?: boolean;
  modelTier?: "fast" | "pro";
  provider?: AIProviderName;
  responseFormat?: { type: "json_object" };
}

export interface AIProviderResult {
  text: string;
  provider: AIProviderName;
  model: string;
  inputChars: number;
  outputChars: number;
  estimatedTokens: number;
  cacheHit: boolean;
}

// ─── Config Helpers ──────────────────────────────────────────────────────────

function getProvider(): AIProviderName {
  const val = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (val === "deepseek") return "deepseek";
  if (val === "mock") return "mock";
  return "gemini";
}

function getDeepSeekConfig(tier: "fast" | "pro" = "fast") {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    model: tier === "pro"
      ? (process.env.DEEPSEEK_MODEL_PRO || "deepseek-chat")
      : (process.env.DEEPSEEK_MODEL_FAST || "deepseek-chat"),
    maxTokens: tier === "pro"
      ? parseInt(process.env.DEEPSEEK_MAX_TOKENS_PRO || "1000", 10)
      : parseInt(process.env.DEEPSEEK_MAX_TOKENS_FAST || "400", 10),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || "0.2"),
  };
}

function getMaxContextChars(): number {
  return parseInt(process.env.AI_MAX_CONTEXT_CHARS || "8000", 10);
}

function truncateContext(text: string): string {
  const max = getMaxContextChars();
  if (text.length <= max) return text;
  return text.substring(0, max) + "\n\n[...context truncated...]";
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for mixed-language content
  return Math.ceil(text.length / 4);
}

// ─── DeepSeek Provider ───────────────────────────────────────────────────────

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
  };
}

async function callDeepSeek(params: AIProviderParams): Promise<AIProviderResult> {
  const config = getDeepSeekConfig(params.modelTier || "fast");

  if (!config.apiKey) {
    throw new Error("DEEPSEEK_API_KEY belum dikonfigurasi.");
  }

  const truncatedPrompt = truncateContext(params.prompt);
  const maxTokens = params.maxTokens ?? config.maxTokens;
  const temperature = params.temperature ?? config.temperature;

  const messages: Array<{ role: string; content: string }> = [];

  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }

  messages.push({ role: "user", content: truncatedPrompt });

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
      response_format: params.responseFormat,
    }),
  });

  const data = (await response.json()) as DeepSeekResponse;

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || `DeepSeek API error (${response.status})`;
    throw new Error(errorMsg);
  }

  const text = data.choices?.[0]?.message?.content?.trim() || "";

  return {
    text: text || GEMINI_EMPTY_ANSWER_FALLBACK,
    provider: "deepseek",
    model: config.model,
    inputChars: truncatedPrompt.length + (params.systemPrompt?.length || 0),
    outputChars: text.length,
    estimatedTokens: data.usage?.total_tokens ?? estimateTokens(truncatedPrompt + text),
    cacheHit: false,
  };
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

async function callGemini(params: AIProviderParams): Promise<AIProviderResult> {
  const truncatedPrompt = truncateContext(params.prompt);

  const text = await askGemini({
    systemPrompt: params.systemPrompt || "",
    prompt: truncatedPrompt,
  });

  return {
    text,
    provider: "gemini",
    model: GEMINI_MODEL,
    inputChars: truncatedPrompt.length + (params.systemPrompt?.length || 0),
    outputChars: text.length,
    estimatedTokens: estimateTokens(truncatedPrompt + text),
    cacheHit: false,
  };
}

// ─── Mock Provider ───────────────────────────────────────────────────────────

function callMock(params: AIProviderParams): AIProviderResult {
  const text = `[AI Mock Response] Feature: ${params.feature}. Prompt received (${params.prompt.length} chars). No AI provider configured.`;

  return {
    text,
    provider: "mock",
    model: "mock-v1",
    inputChars: params.prompt.length,
    outputChars: text.length,
    estimatedTokens: 0,
    cacheHit: false,
  };
}

// ─── Usage Logging ───────────────────────────────────────────────────────────

async function logAIUsage(result: AIProviderResult, feature: string, status: "success" | "error" | "cache_hit", errorMessage?: string) {
  try {
    const db = getAdminDb();
    const logRef = db.collection("ai_usage_logs").doc();
    await logRef.set({
      id: logRef.id,
      provider: result.provider,
      model: result.model,
      feature,
      input_chars: result.inputChars,
      output_chars: result.outputChars,
      estimated_tokens: result.estimatedTokens,
      cache_hit: result.cacheHit,
      status,
      error_message: errorMessage || null,
      created_at: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[AI Usage Log] Failed:", err);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate text using the configured AI provider.
 * Supports caching, fallback, and usage logging.
 */
export async function generateText(params: AIProviderParams): Promise<AIProviderResult> {
  const useCache = params.useCache !== false;
  const resolvedProvider = params.provider ?? getProvider();

  // Check cache first
  if (useCache) {
    const cached = await getCachedResponse(params.prompt, params.feature);
    if (cached) {
      const result: AIProviderResult = {
        text: cached,
        provider: resolvedProvider,
        model: "cache",
        inputChars: params.prompt.length,
        outputChars: cached.length,
        estimatedTokens: 0,
        cacheHit: true,
      };
      await logAIUsage(result, params.feature, "cache_hit");
      return result;
    }
  }

  const provider = resolvedProvider;
  let result: AIProviderResult;

  try {
    switch (provider) {
      case "deepseek":
        try {
          result = await callDeepSeek(params);
        } catch (deepseekErr) {
          console.warn("[AI Provider] DeepSeek failed, falling back to Gemini:", deepseekErr);
          // Fallback to Gemini
          try {
            result = await callGemini(params);
          } catch {
            // Both failed, use mock
            result = callMock(params);
          }
        }
        break;

      case "gemini":
        result = await callGemini(params);
        break;

      case "mock":
      default:
        result = callMock(params);
        break;
    }

    // Cache the result
    if (useCache && result.text && !result.cacheHit) {
      await setCachedResponse(params.prompt, params.feature, result.text);
    }

    await logAIUsage(result, params.feature, "success");
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown AI error";
    console.error(`[AI Provider] Error (${provider}):`, errorMessage);

    // Return a safe fallback
    const fallbackResult: AIProviderResult = {
      text: GEMINI_EMPTY_ANSWER_FALLBACK,
      provider: "mock",
      model: "fallback",
      inputChars: params.prompt.length,
      outputChars: GEMINI_EMPTY_ANSWER_FALLBACK.length,
      estimatedTokens: 0,
      cacheHit: false,
    };

    await logAIUsage(fallbackResult, params.feature, "error", errorMessage);
    return fallbackResult;
  }
}

/**
 * Generate a short summary of text using AI (with small token budget)
 */
export async function summarize(text: string, maxLength = 300, feature = "summarize"): Promise<AIProviderResult> {
  const truncated = text.substring(0, 2000);
  return generateText({
    prompt: `Ringkas teks berikut dalam ${maxLength} karakter atau kurang, dalam Bahasa Indonesia:\n\n${truncated}`,
    systemPrompt: "Kamu adalah asisten ringkasan. Jawab singkat dan padat.",
    maxTokens: 200,
    feature,
    modelTier: "fast",
  });
}

/**
 * Get the currently configured provider name for display
 */
export function getActiveProvider(): AIProviderName {
  return getProvider();
}

/**
 * Get provider display info
 */
export function getProviderInfo(): { name: AIProviderName; model: string; available: boolean } {
  const provider = getProvider();

  switch (provider) {
    case "deepseek":
      return {
        name: "deepseek",
        model: process.env.DEEPSEEK_MODEL_FAST || "deepseek-chat",
        available: !!process.env.DEEPSEEK_API_KEY,
      };
    case "gemini":
      return {
        name: "gemini",
        model: GEMINI_MODEL,
        available: !!process.env.GEMINI_API_KEY,
      };
    default:
      return { name: "mock", model: "mock-v1", available: true };
  }
}
