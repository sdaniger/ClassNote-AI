import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, shadow } from "./design";

export function GlassCard({ children, style, solid = false }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[]; solid?: boolean }>) {
  return <View style={[styles.card, solid && styles.solid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: colors.whiteGlass,
    ...shadow,
  },
  solid: {
    backgroundColor: colors.whiteSoft,
  },
});
