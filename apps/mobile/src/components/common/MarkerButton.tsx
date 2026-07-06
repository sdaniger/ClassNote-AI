import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../design";

export function MarkerButton({ label, tone, onPress }: { label: string; tone: "rose" | "amber" | "blue"; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessible accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.markerButton, styles[`${tone}Marker`], pressed && styles.pressed]}>
      <Text style={styles.markerText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  markerButton: { flex: 1, minHeight: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.72)" },
  roseMarker: { backgroundColor: "rgba(255,228,230,0.86)" },
  amberMarker: { backgroundColor: "rgba(254,243,199,0.90)" },
  blueMarker: { backgroundColor: "rgba(224,242,254,0.90)" },
  markerText: { fontSize: 14, fontWeight: "900", color: colors.slate950 },
  pressed: { transform: [{ scale: 0.96 }] },
});
