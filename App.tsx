import React, {useEffect} from 'react';
import {Alert, LogBox} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import OnboardingScreen from './app/page';
import MainScreenLayout from './components/guardians/screens/main-screen-layout';
import type {RootStackParamList} from './components/guardians/types/type';
// import DebugFCMToken from './DebugFCMToken';
const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  useEffect(() => {
    const requestPermission = async (): Promise<boolean> => {
      try {
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      } catch (err) {
        console.error('권한 요청 실패:', err);
        return false;
      }
    };

    const getFCMToken = async (): Promise<string | null> => {
      try {
        const token = await messaging().getToken();
        if (token) {
          console.log('FCM Token:', token);
          await AsyncStorage.setItem('fcmToken', token);
          return token;
        }
        return null;
      } catch (err) {
        console.error('FCM 토큰 에러:', err);
        return null;
      }
    };

    const sendTokenToBackend = async () => {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          '알림 권한 필요',
          '푸시 알림을 받으려면 권한을 허용해주세요.',
        );
        return;
      }
      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        return;
      }
      try {
        // const currentDevice = await AsyncStorage.getItem('deviceId');
        // if (currentDevice) {
        //   return;
        // }
        const res = await axios.post(
          'https://capstone-be-oasis.onrender.com/takers/auth/init',
          {
            FCMToken: fcmToken,
          },
        );
        await AsyncStorage.setItem('fcmToken', fcmToken);
        const deviceId = res.data?.data?.deviceId;
        await AsyncStorage.setItem('deviceId', deviceId);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log('deviceId 전송 실패:', error.response?.data || error);
        } else {
          console.log('deviceId 전송 실패:', error);
        }
      }
    };

    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || '알림',
          remoteMessage.notification.body ||
            'helloworldTesttestetesttsetstse!!!!!!',
        );
      }
    });
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      console.log('FCM 토큰 갱신:', token);
      try {
        const res = await axios.post(
          'https://capstone-be-oasis.onrender.com/takers/auth/init',
          {
            FCMToken: token,
            timestamp: new Date().toISOString(),
          },
        );
        await AsyncStorage.setItem('fcmToken', token);
        const deviceId = res.data?.data?.deviceId;
        if (deviceId) {
          await AsyncStorage.setItem('deviceId', deviceId);
        }
      } catch (e) {
        console.error('토큰 갱신 전송 실패:', e);
      }
    });

    sendTokenToBackend();

    LogBox.ignoreLogs(['Remote debugger']);
    return () => {
      unsubscribeMessage();
      unsubscribeTokenRefresh();
    };
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{headerShown: false}}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainScreenLayout} />
        </Stack.Navigator>
      </NavigationContainer>
      {/* <DebugFCMToken /> */}
    </>
  );
};

export default App;

// export default App;

// import React, { useEffect, useState } from 'react';
// import { SafeAreaView, Text, ScrollView, StyleSheet } from 'react-native';
// import messaging from '@react-native-firebase/messaging';

// const App = () => {
//   const [fcmToken, setFcmToken] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchToken = async () => {
//       try {
//         const permission = await messaging().requestPermission();
//         const enabled =
//           permission === messaging.AuthorizationStatus.AUTHORIZED ||
//           permission === messaging.AuthorizationStatus.PROVISIONAL;

//         if (!enabled) {
//           setFcmToken('❌ 푸시 권한이 거부되었습니다.');
//           return;
//         }

//         const token = await messaging().getToken();
//         console.log('📱 FCM Token:', token);
//         setFcmToken(token || '❌ 토큰 없음');
//       } catch (e) {
//         console.error('🔥 FCM 토큰 가져오기 실패:', e);
//         setFcmToken('❌ 오류 발생: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
//       }
//     };

//     fetchToken();
//   }, []);

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scroll}>
//         <Text style={styles.title}>🔥 FCM 토큰</Text>
//         <Text selectable style={styles.token}>
//           {fcmToken ?? '토큰 로딩 중...'}
//         </Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
//   title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   token: { fontSize: 12, color: '#333', textAlign: 'center' },
// });

// export default App;
