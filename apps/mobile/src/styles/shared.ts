import { StyleSheet } from "react-native";

export const sharedStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7fbff" },
  shell: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 112 },
  stack: { gap: 16 },
  bgCircleTop: { position: "absolute", top: -80, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(125,211,252,0.34)" },
  bgCircleBottom: { position: "absolute", bottom: -100, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(196,181,253,0.32)" },
});
