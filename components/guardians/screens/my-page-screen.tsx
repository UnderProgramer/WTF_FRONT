"use client"

import { useState } from "react"
import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet, ActivityIndicator, Platform, Alert, Text } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/type"
import PageHeader from "../ui/page-header"
import MenuItem, { type MenuItem as MenuItemType } from "../profile/menu-item"
import FooterNav from "../navigation/footer-nav"

export default function MyPageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [isLoading, setIsLoading] = useState(false)
  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: performLogout,
      },
    ])
  }

  const performLogout = async () => {
    try {
      setIsLoading(true)
      await AsyncStorage.removeItem("accessToken")
      await AsyncStorage.removeItem("refreshToken")
      await AsyncStorage.removeItem("userData")
      setTimeout(() => {
        setIsLoading(false)
        Alert.alert("로그아웃 되었습니다")
        navigation.reset({
          index: 0,
          routes: [{ name: "Onboarding" }],
        })
      }, 500)
    } catch (error) {
      console.error("Logout Error:", error)
      setIsLoading(false)
      Alert.alert("로그아웃 실패", "다시 시도해주세요.")
    }
  }

  const menuItems: MenuItemType[] = [
    {
      title: "로그아웃",
      icon: "ArrowLeftOnRectangleIcon",
      onPress: handleLogout,
      danger: true,
    },
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        <PageHeader title="마이페이지" />
         
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <MenuItem key={item.title} item={item} isLast={index === menuItems.length - 1} />
            ))}
          </View>
        </ScrollView>
         
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>처리 중...</Text>
            </View>
          </View>
        )}
      </View>
       
      <FooterNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    marginTop: 24,
    flex: 1,
    paddingBottom: 100,
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});