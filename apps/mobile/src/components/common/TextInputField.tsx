import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../design";

export function TextInputField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor="#94a3b8" />
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: { borderRadius: 20, padding: 12, backgroundColor: "#f8fafc" },
  inputLabel: { fontSize: 11, fontWeight: "800", color: colors.slate500 },
  input: { marginTop: 4, fontSize: 15, fontWeight: "700", color: colors.slate950, padding: 0 },
});
