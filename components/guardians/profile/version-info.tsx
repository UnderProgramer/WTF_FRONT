import { View, Text, StyleSheet } from "react-native"

type VersionInfoProps = {
  version: string
}

export default function VersionInfo({ version }: VersionInfoProps) {
  return (
    <View style={styles.versionContainer}>
      <Text style={styles.versionText}>앱 버전 {version}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  versionContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#999999",
  },
})
