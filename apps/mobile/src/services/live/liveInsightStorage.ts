import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import type { LiveInsightSettings, LiveLectureInsight } from "@/types/lecture";

const LIVE_SETTINGS_KEY = "classnote-mobile:live-insight-settings:v1";
const LIVE_INSIGHTS_KEY = "classnote-mobile:live-insights:v1";

export const defaultLiveInsightSettings: LiveInsightSettings = {
  enabled: true,
  updateIntervalSec: 30,
  windowSec: 90,
  showSummary: true,
  showSimpleExplanation: true,
  showKeyTerms: true,
  showExamLikely: true,
  showAssignmentLikely: true,
  lightweightOnMobile: true,
  highAccuracyWhenWindowsConnected: true,
};

export async function loadLiveInsightSettings(): Promise<LiveInsightSettings> {
  try {
    const raw = await AsyncStorage.getItem(LIVE_SETTINGS_KEY);
    return raw ? { ...defaultLiveInsightSettings, ...JSON.parse(raw) } : defaultLiveInsightSettings;
  } catch {
    return defaultLiveInsightSettings;
  }
}

export async function saveLiveInsightSettings(settings: LiveInsightSettings) {
  await AsyncStorage.setItem(LIVE_SETTINGS_KEY, JSON.stringify(settings));
}

export async function saveLiveInsights(lectureId: string, insights: LiveLectureInsight[]) {
  const liveDir = `${FileSystem.documentDirectory ?? ""}lectures/${lectureId}/live/`;
  await FileSystem.makeDirectoryAsync(liveDir, { intermediates: true });
  await FileSystem.writeAsStringAsync(`${liveDir}live-insights.json`, JSON.stringify(insights, null, 2));
  const index = await loadLiveInsightIndex();
  index[lectureId] = insights;
  await AsyncStorage.setItem(LIVE_INSIGHTS_KEY, JSON.stringify(index));
}

export async function loadLiveInsightIndex(): Promise<Record<string, LiveLectureInsight[]>> {
  try {
    return JSON.parse(await AsyncStorage.getItem(LIVE_INSIGHTS_KEY) ?? "{}") as Record<string, LiveLectureInsight[]>;
  } catch {
    return {};
  }
}
