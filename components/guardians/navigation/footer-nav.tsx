/* eslint-disable semi */
/* eslint-disable quotes */
import type React from "react"
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { HomeIcon, UserIcon, CalendarIcon } from "react-native-heroicons/outline"
import type { RootStackParamList } from "../types/type"

type NavItemProps = {
  icon: React.ReactNode
  onPress: () => void
  isActive?: boolean
}

const NavItem = ({ icon, onPress, isActive = false }: NavItemProps) => (
  <TouchableOpacity 
    style={[styles.button, isActive && styles.activeButton]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
      {icon}
    </View>
  </TouchableOpacity>
)

export default function FooterNav() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <NavItem
          icon={<CalendarIcon size={24} color="#6b7280" />}
          onPress={() => navigation.navigate("Main", { screen: "Schedule" })}
        />
        <NavItem
          icon={<HomeIcon size={24} color="#667eea" />}
          onPress={() => navigation.navigate("Main", { screen: "GuardiansHome" })}
          isActive={true}
        />
        <NavItem
          icon={<UserIcon size={24} color="#6b7280" />}
          onPress={() => navigation.navigate("Main", { screen: "MyPage" })}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  bar: {
    height: 70,
    backgroundColor: "#ffffff",
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: Platform.OS === 'android' ? '#e5e7eb' : 'transparent',
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  activeButton: {
  },
  activeIconContainer: {
    backgroundColor: "#f0f4ff",
    ...Platform.select({
      ios: {
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
})