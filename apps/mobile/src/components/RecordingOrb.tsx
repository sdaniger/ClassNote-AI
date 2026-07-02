import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { colors } from "./design";

export function RecordingOrb({ active }: { active: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, pulse]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]} />
      <View style={styles.orb}>
        <Text style={styles.mic}>●</Text>
        <Text style={styles.label}>{active ? "REC" : "READY"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 176, height: 176, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 156, height: 156, borderRadius: 78, backgroundColor: "rgba(244,63,94,0.20)", borderWidth: 1, borderColor: "rgba(254,205,211,0.75)" },
  orb: { width: 128, height: 128, borderRadius: 64, alignItems: "center", justifyContent: "center", backgroundColor: colors.rose, shadowColor: colors.rose, shadowOpacity: 0.42, shadowRadius: 34, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
  mic: { color: "white", fontSize: 26, marginBottom: 8 },
  label: { color: "white", fontSize: 12, fontWeight: "900", letterSpacing: 3 },
});
