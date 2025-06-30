import { Text, StyleSheet } from "react-native"

type SectionTitleProps = {
  title: string
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return <Text style={styles.sectionTitle}>{title}</Text>
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginTop: 32,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
})
