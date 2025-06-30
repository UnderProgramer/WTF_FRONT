import { View, Text, StyleSheet } from "react-native"

type StatsCardProps = {
  total: number
  completed: number
  remaining: number
}

export default function StatsCard({ total, completed, remaining }: StatsCardProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{total}</Text>
        <Text style={styles.statLabel}>총 일정</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, styles.completedStat]}>{completed}</Text>
        <Text style={styles.statLabel}>완료</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, styles.remainingStat]}>{remaining}</Text>
        <Text style={styles.statLabel}>남은 일정</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    marginVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  completedStat: {
    color: "#10B981",
  },
  remainingStat: {
    color: "#EF4444",
  },
  statLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
})
