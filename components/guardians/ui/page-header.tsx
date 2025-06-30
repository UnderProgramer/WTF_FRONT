import type React from "react"
import { View, Text, StyleSheet } from "react-native"

type PageHeaderProps = {
  title: string
  rightElement?: React.ReactNode
}

export default function PageHeader({ title, rightElement }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      {rightElement ? (
        <View style={styles.headerWithAction}>
          <Text style={styles.h1}>{title}</Text>
          {rightElement}
        </View>
      ) : (
        <Text style={styles.h1}>{title}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerWithAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    letterSpacing: -0.5,
  },
})
