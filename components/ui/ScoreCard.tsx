import { Text, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Colors } from "@/constants/colors";

interface ScoreCardProps {
  score: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return Colors.scoreHigh;
  if (score >= 60) return Colors.scoreMid;
  return Colors.scoreLow;
}

export function ScoreCard({ score, label = "Overall Score" }: ScoreCardProps) {
  return (
    <Animated.View entering={FadeInUp.duration(600)} style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.score, { color: getScoreColor(score) }]}>
        {score}
      </Text>
      <Text style={styles.subtitle}>out of 100</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    padding: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  score: {
    fontSize: 64,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
