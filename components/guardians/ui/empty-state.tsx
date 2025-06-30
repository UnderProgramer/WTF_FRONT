import type React from "react"
import { View, Text, StyleSheet } from "react-native"

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.emptyStateContainer}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyStateText}>{title}</Text>
      <Text style={styles.emptyStateSubText}>{description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 60,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    minHeight: 280,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyStateSubText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
})
