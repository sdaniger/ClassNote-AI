import { StyleSheet, Text, View } from "react-native";
import { colors } from "../design";

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  miniStat: { flex: 1, minWidth: 92, borderRadius: 20, padding: 12, backgroundColor: "rgba(255,255,255,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.7)" },
  miniLabel: { fontSize: 10, fontWeight: "800", color: "#94a3b8" },
  miniValue: { marginTop: 4, fontSize: 12, fontWeight: "900", color: colors.slate950 },
});
