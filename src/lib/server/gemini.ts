import "server-only";

export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_EMPTY_ANSWER_FALLBACK =
  "Maaf, AI belum bisa menjawab pertanyaan itu. Coba tanyakan tentang progress task, acara, atau status anggota.";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
  }

  return apiKey;
}

export async function askGemini({
  systemPrompt,
  prompt,
}: {
  systemPrompt: string;
  prompt: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGeminiApiKey(),
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
        },
      }),
    },
  );
  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message
        ? `Gemini gagal menjawab: ${data.error.message}`
        : `Gemini gagal menjawab (${response.status}).`,
    );
  }

  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  return answer || GEMINI_EMPTY_ANSWER_FALLBACK;
}
