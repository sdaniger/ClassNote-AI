import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../design";

export function SettingToggle({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessible accessibilityRole="switch" accessibilityState={{ checked }} style={styles.toggleRow}>
      <Text style={styles.cardTitle}>{label}</Text>
      <View style={[styles.toggle, checked && styles.toggleOn]}>
        <View style={[styles.toggleKnob, checked && styles.toggleKnobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  toggleRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggle: { width: 48, height: 28, borderRadius: 999, backgroundColor: "#cbd5e1", padding: 3 },
  toggleOn: { backgroundColor: colors.sky },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "white" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
});
