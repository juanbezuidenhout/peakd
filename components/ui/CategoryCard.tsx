import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { ProgressBar } from "./ProgressBar";
import { Colors } from "@/constants/colors";

interface CategoryCardProps {
  name: string;
  score: number;
  summary: string;
  index?: number;
}

export function CategoryCard({
  name,
  score,
  summary,
  index = 0,
}: CategoryCardProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <ProgressBar total={10} current={Math.round(score / 10)} />
      <Text style={styles.summary}>{summary}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  score: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.accent,
  },
  summary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
  },
});
