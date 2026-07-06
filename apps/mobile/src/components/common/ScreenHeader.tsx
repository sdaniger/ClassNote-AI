import { StyleSheet, Text, View } from "react-native";
import { colors } from "../design";

export function ScreenHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 2.4, color: "#0369a1", textTransform: "uppercase" },
  title: { marginTop: 8, fontSize: 34, lineHeight: 39, fontWeight: "800", color: colors.slate950, letterSpacing: -0.8 },
  description: { marginTop: 8, fontSize: 15, lineHeight: 24, color: colors.slate500 },
});
