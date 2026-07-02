import { StyleSheet, View } from "react-native";

const bars = [30, 52, 42, 76, 36, 64, 88, 48, 68, 34, 58, 78, 44, 62, 92, 54, 38, 70];

export function WaveformPreview() {
  return (
    <View style={styles.wrap}>
      {bars.map((height, index) => <View key={`${height}-${index}`} style={[styles.bar, { height: `${height}%` }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 78, borderRadius: 26, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.56)", borderWidth: 1, borderColor: "rgba(255,255,255,0.7)" },
  bar: { width: 5, borderRadius: 999, backgroundColor: "#38bdf8" },
});
