import { TouchableOpacity, Text, StyleSheet } from "react-native"

type ActionButtonProps = {
  label: string
  onPress: () => void
  variant?: "primary" | "success" | "danger"
  fullWidth?: boolean
}

export default function ActionButton({ label, onPress, variant = "primary", fullWidth = false }: ActionButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === "success" && styles.successButton,
    variant === "danger" && styles.dangerButton,
    fullWidth && styles.fullWidthButton,
  ]

  const textStyle = [
    styles.buttonText,
    variant === "success" && styles.successButtonText,
    variant === "danger" && styles.dangerButtonText,
  ]

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.7}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  successButton: {
    backgroundColor: "#10B981",
  },
  dangerButton: {
    backgroundColor: "#EF4444",
  },
  fullWidthButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  successButtonText: {
    color: "#FFFFFF",
  },
  dangerButtonText: {
    color: "#FFFFFF",
  },
})
