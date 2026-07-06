import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

const withAudioRouteFixIos: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "ios",
    async (iosConfig) => {
      const projectRoot = iosConfig.modRequest.projectRoot;
      const paths = [
        path.join(projectRoot, "node_modules", "expo-av", "ios", "EXAV", "EXAV.m"),
        path.join(projectRoot, "..", "node_modules", "expo-av", "ios", "EXAV", "EXAV.m"),
      ];
      const filePath = paths.find((p) => fs.existsSync(p));

      if (!filePath) {
        throw new Error(
          `expo-av EXAV.m not found. Is expo-av installed?`
        );
      }

      let source = fs.readFileSync(filePath, "utf-8");
      const oldCode =
        "AVAudioSessionCategoryOptionAllowBluetooth";
      const newCode =
        "AVAudioSessionCategoryOptionAllowBluetoothA2DP";

      if (source.includes(oldCode) && !source.includes(newCode)) {
        source = source.replace(oldCode, newCode);
        fs.writeFileSync(filePath, source, "utf-8");
        console.log(
          "[withAudioRouteFix] Patched EXAV.m: AllowBluetooth → AllowBluetoothA2DP"
        );
      } else if (source.includes(newCode)) {
        console.log(
          "[withAudioRouteFix] EXAV.m already patched, skipping"
        );
      } else {
        console.warn(
          "[withAudioRouteFix] Could not find AllowBluetooth in EXAV.m"
        );
      }

      return iosConfig;
    },
  ]);

const withAudioRouteFixAndroid: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    async (androidConfig) => {
      const projectRoot = androidConfig.modRequest.projectRoot;
      const paths = [
        path.join(projectRoot, "node_modules", "expo-av", "android", "src", "main", "java", "expo", "modules", "av", "AVManager.java"),
        path.join(projectRoot, "..", "node_modules", "expo-av", "android", "src", "main", "java", "expo", "modules", "av", "AVManager.java"),
      ];
      const filePath = paths.find((p) => fs.existsSync(p));

      if (!filePath) {
        throw new Error(
          `expo-av AVManager.java not found. Is expo-av installed?`
        );
      }

      let source = fs.readFileSync(filePath, "utf-8");

      // Prevent Bluetooth SCO from being activated during recording
      // by replacing setAudioSource(DEFAULT) with setAudioSource(VOICE_RECOGNITION).
      // VOICE_RECOGNITION avoids HFP routing and disables AGC/post-processing,
      // which is ideal for lecture transcription.
      const oldAudioSource = "MediaRecorder.AudioSource.DEFAULT";
      const newAudioSource = "MediaRecorder.AudioSource.VOICE_RECOGNITION";

      if (source.includes(oldAudioSource) && !source.includes("// " + oldAudioSource)) {
        source = source.replace(oldAudioSource, newAudioSource);
        fs.writeFileSync(filePath, source, "utf-8");
        console.log(
          "[withAudioRouteFix] Patched AVManager.java: AudioSource.DEFAULT → AudioSource.VOICE_RECOGNITION"
        );
      } else {
        console.log(
          "[withAudioRouteFix] AVManager.java already patched or not found, skipping"
        );
      }

      return androidConfig;
    },
  ]);

const withAudioRouteFix: ConfigPlugin = (config) => {
  config = withAudioRouteFixIos(config);
  config = withAudioRouteFixAndroid(config);
  return config;
};

export default withAudioRouteFix;
