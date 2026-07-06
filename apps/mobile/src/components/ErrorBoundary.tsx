import { Component, type ReactNode } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { colors } from "./design";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View style={styles.root}>
            <View style={styles.card}>
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>!</Text>
              </View>
              <Text style={styles.title}>アプリでエラーが発生しました</Text>
              <Text style={styles.message}>{this.state.error?.message ?? "不明なエラーです。"}</Text>
              <Pressable
                onPress={() => this.setState({ hasError: false, error: null })}
                accessible
                accessibilityRole="button"
                accessibilityLabel="再試行"
                style={styles.button}
              >
                <Text style={styles.buttonText}>再試行</Text>
              </Pressable>
            </View>
          </View>
        )
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7fbff", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 400, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.68)", padding: 32, alignItems: "center", shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  iconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 24, fontWeight: "800", color: colors.rose },
  title: { marginTop: 16, fontSize: 20, fontWeight: "800", color: colors.slate950, textAlign: "center" },
  message: { marginTop: 8, fontSize: 14, lineHeight: 22, color: colors.slate500, textAlign: "center" },
  button: { marginTop: 24, borderRadius: 999, backgroundColor: "#0f172a", paddingHorizontal: 24, paddingVertical: 12, shadowColor: "#0f172a", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  buttonText: { fontSize: 14, fontWeight: "800", color: "#ffffff" },
});
