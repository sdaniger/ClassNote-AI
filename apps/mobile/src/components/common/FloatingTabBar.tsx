import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../design";
import type { MobileScreen } from "../../types/lecture";

export function FloatingTabBar({ active, onChange }: { active: MobileScreen; onChange: (screen: MobileScreen) => void }) {
  const items: { id: MobileScreen; label: string }[] = [
    { id: "home", label: "ホーム" },
    { id: "recording", label: "録音" },
    { id: "detail", label: "講義" },
    { id: "sync", label: "同期" },
    { id: "settings", label: "設定" },
  ];
  return (
    <View style={styles.tabBar} accessible accessibilityRole="tablist">
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onChange(item.id)}
          accessible
          accessibilityRole="tab"
          accessibilityState={{ selected: active === item.id }}
          style={[styles.tabItem, active === item.id && styles.tabActive]}
        >
          <Text style={[styles.tabText, active === item.id && styles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 20,
    minHeight: 64,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 7,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  tabItem: { flex: 1, height: 50, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: colors.slate950 },
  tabText: { fontSize: 11, fontWeight: "900", color: colors.slate500 },
  tabTextActive: { color: "white" },
});
