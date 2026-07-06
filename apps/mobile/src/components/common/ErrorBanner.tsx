import { Pressable, StyleSheet, Text, View } from "react-native";

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <View style={styles.errorBanner} accessible accessibilityRole="alert">
      <Text style={styles.errorText}>{message}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} style={styles.dismissBtn} accessibilityLabel="閉じる" accessibilityRole="button">
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: { borderRadius: 22, padding: 14, backgroundColor: "#ffe4e6", flexDirection: "row", alignItems: "flex-start" },
  errorText: { flex: 1, color: "#be123c", fontSize: 13, lineHeight: 20, fontWeight: "700" },
  dismissBtn: { paddingLeft: 10, paddingVertical: 2 },
  dismissText: { fontSize: 16, fontWeight: "700", color: "#be123c" },
});
