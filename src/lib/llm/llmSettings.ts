export type LlmProvider = "openai" | "groq" | "gemini" | "openrouter" | "ollama" | "local" | "mock";

export type LlmSettings = {
  provider: LlmProvider;
  apiKey: string;
  endpoint: string;
  model: string;
};

const STORAGE_KEY = "classnote-ai:llm-settings:v1";

export const defaultLlmSettings: LlmSettings = {
  provider: "mock",
  apiKey: "",
  endpoint: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

export const providerDefaults: Record<Exclude<LlmProvider, "mock">, { endpoint: string; model: string; needsKey: boolean }> = {
  openai:     { endpoint: "https://api.openai.com/v1",                model: "gpt-4o-mini",              needsKey: true },
  groq:       { endpoint: "https://api.groq.com/openai/v1",           model: "llama-3.3-70b-versatile",  needsKey: true },
  gemini:     { endpoint: "https://generativelanguage.googleapis.com", model: "gemini-2.0-flash",         needsKey: true },
  openrouter: { endpoint: "https://openrouter.ai/api/v1",             model: "gpt-4o-mini",              needsKey: true },
  ollama:     { endpoint: "http://localhost:11434/v1",                model: "llama3",                   needsKey: false },
  local:      { endpoint: "http://localhost:1234/v1",                 model: "local-model",              needsKey: false },
};

function getEnvApiKey(provider: LlmProvider): string {
  if (typeof process === "undefined" || !process.env) return "";
  const key = `NEXT_PUBLIC_${provider.toUpperCase()}_API_KEY`;
  return (process.env as Record<string, string | undefined>)[key] ?? "";
}

export function loadLlmSettings(): LlmSettings {
  if (typeof window === "undefined") return defaultLlmSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) as LlmSettings : null;
    if (!saved) {
      const groqKey = getEnvApiKey("groq");
      if (groqKey) {
        return { provider: "groq", apiKey: groqKey, ...providerDefaults.groq };
      }
      return defaultLlmSettings;
    }
    if (!saved.apiKey) {
      const envKey = getEnvApiKey(saved.provider);
      if (envKey) saved.apiKey = envKey;
    }
    return saved;
  } catch {
    return defaultLlmSettings;
  }
}

export function saveLlmSettings(settings: LlmSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
