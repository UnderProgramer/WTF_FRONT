import { View, StyleSheet } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import GuardiansHomeScreen from "./guardians-home-screen"
import MyPageScreen from "./my-page-screen"
import ScheduleScreen from "./schedule-screen"
const Tab = createBottomTabNavigator()

export default function MainScreenLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
          <Tab.Screen name="GuardiansHome" component={GuardiansHomeScreen} />
          <Tab.Screen name="MyPage" component={MyPageScreen} />
          <Tab.Screen name="Schedule" component={ScheduleScreen} />
        </Tab.Navigator>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
