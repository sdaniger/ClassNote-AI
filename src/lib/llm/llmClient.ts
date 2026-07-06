import type { LlmSettings } from "./llmSettings";

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmCompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
};

export async function completeChat(
  settings: LlmSettings,
  messages: LlmMessage[],
  options: LlmCompletionOptions = {},
): Promise<string> {
  if (settings.provider === "gemini") {
    return completeGeminiChat(settings, messages, options);
  }
  return completeOpenAiCompatibleChat(settings, messages, options);
}

async function completeOpenAiCompatibleChat(
  settings: LlmSettings,
  messages: LlmMessage[],
  options: LlmCompletionOptions = {},
): Promise<string> {
  const { temperature = 0.3, maxTokens = 4096, responseFormat } = options;

  const baseUrl = settings.endpoint.replace(/\/+$/, "");
  const url = `${baseUrl}/chat/completions`;

  const body: Record<string, unknown> = {
    model: settings.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiKey) {
    if (settings.provider === "openrouter") {
      headers["Authorization"] = `Bearer ${settings.apiKey}`;
      headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "classnote-ai";
    } else {
      headers["Authorization"] = `Bearer ${settings.apiKey}`;
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `LLM API error (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }
  return content;
}

async function completeGeminiChat(
  settings: LlmSettings,
  messages: LlmMessage[],
  options: LlmCompletionOptions = {},
): Promise<string> {
  const { temperature = 0.3, maxTokens = 4096, responseFormat } = options;

  const baseUrl = settings.endpoint.replace(/\/+$/, "");
  const url = `${baseUrl}/v1beta/models/${settings.model}:generateContent`;

  const systemMessages = messages.filter((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    contents: chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (responseFormat) {
    (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
  }

  if (systemMessages.length > 0) {
    body.systemInstruction = {
      parts: [{ text: systemMessages.map((m) => m.content).join("\n") }],
    };
  }

  const queryParam = settings.apiKey ? `?key=${encodeURIComponent(settings.apiKey)}` : "";

  const response = await fetch(`${url}${queryParam}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Gemini API error (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }
  return text;
}
