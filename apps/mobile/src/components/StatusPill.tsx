import { StyleSheet, Text, View } from "react-native";

export function StatusPill({ label, tone = "slate" }: { label: string; tone?: "slate" | "blue" | "green" | "amber" | "rose" | "violet" }) {
  return <View style={[styles.pill, styles[tone]]}><Text style={[styles.text, styles[`${tone}Text`]]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  text: { fontSize: 11, fontWeight: "800" },
  slate: { backgroundColor: "#f1f5f9" }, slateText: { color: "#475569" },
  blue: { backgroundColor: "#e0f2fe" }, blueText: { color: "#0369a1" },
  green: { backgroundColor: "#d1fae5" }, greenText: { color: "#047857" },
  amber: { backgroundColor: "#fef3c7" }, amberText: { color: "#92400e" },
  rose: { backgroundColor: "#ffe4e6" }, roseText: { color: "#be123c" },
  violet: { backgroundColor: "#ede9fe" }, violetText: { color: "#6d28d9" },
});
