export type ChatProvider = "mock" | "openai" | "ollama" | "local";

export type LectureContextSnippet = {
  source: "transcript" | "summary" | "marker" | "timeline" | "quiz";
  text: string;
  timestamp?: number;
};
