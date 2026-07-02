import * as FileSystem from "expo-file-system/legacy";
import type { AudioMode } from "@/types/lecture";
import { estimateAudioSizeMb } from "./audioModes";

export type PreparedAudio = {
  uri: string;
  fileName: string;
  sizeMb: number;
};

export async function prepareAudioForStorage(inputUri: string, audioMode: AudioMode, lectureId: string, durationSec: number): Promise<PreparedAudio> {
  const lectureDir = `${FileSystem.documentDirectory ?? ""}lectures/${lectureId}/audio/`;
  const fileName = "lecture.m4a";
  const outputUri = `${lectureDir}${fileName}`;

  await FileSystem.makeDirectoryAsync(lectureDir, { intermediates: true });
  await FileSystem.copyAsync({ from: inputUri, to: outputUri });

  const info = await FileSystem.getInfoAsync(outputUri);
  const actualSizeMb = info.exists && "size" in info && typeof info.size === "number" ? Number((info.size / 1024 / 1024).toFixed(1)) : undefined;

  return {
    uri: outputUri,
    fileName,
    sizeMb: actualSizeMb ?? estimateAudioSizeMb(durationSec, audioMode),
  };
}
