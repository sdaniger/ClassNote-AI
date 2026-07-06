import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, shadow } from "./design";

type GlassButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}>;

export function GlassButton({ children, onPress, variant = "secondary", disabled = false, style }: GlassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, styles[variant], disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}
    >
      <Text style={[styles.text, variant === "primary" || variant === "danger" ? styles.textLight : styles.textDark]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    ...shadow,
  },
  primary: { backgroundColor: colors.slate950 },
  secondary: { backgroundColor: "rgba(255,255,255,0.74)", borderWidth: 1, borderColor: "rgba(255,255,255,0.78)" },
  danger: { backgroundColor: colors.rose },
  disabled: { opacity: 0.48 },
  pressed: { transform: [{ scale: 0.97 }] },
  text: { fontSize: 14, fontWeight: "800" },
  textLight: { color: "white" },
  textDark: { color: colors.slate950 },
});
