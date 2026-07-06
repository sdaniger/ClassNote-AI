import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useToast } from "../../hooks/useToast";
import type { ToastType } from "../../hooks/useToast";

const BG_COLORS: Record<ToastType, string> = {
  success: "#bbf7d0",
  error: "#ffe4e6",
  info: "#dbeafe",
};

const TEXT_COLORS: Record<ToastType, string> = {
  success: "#166534",
  error: "#be123c",
  info: "#1e40af",
};

function ToastItem({ id, message, type, onDismiss }: { id: string; message: string; type: ToastType; onDismiss: (id: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }], backgroundColor: BG_COLORS[type] }]}
      accessible
      accessibilityRole="alert"
    >
      <Text style={[styles.toastText, { color: TEXT_COLORS[type] }]}>{message}</Text>
      <Pressable onPress={() => onDismiss(id)} style={styles.dismissBtn} accessibilityLabel="閉じる" accessibilityRole="button">
        <Text style={[styles.dismissText, { color: TEXT_COLORS[type] }]}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={removeToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 60, left: 16, right: 16, zIndex: 9999, gap: 8 },
  toast: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  toastText: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 20 },
  dismissBtn: { paddingLeft: 10, paddingVertical: 2 },
  dismissText: { fontSize: 16, fontWeight: "700" },
});
