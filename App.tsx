import React, {useEffect, useState} from 'react';
import {Alert, LogBox, PermissionsAndroid, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import OnboardingScreen from './app/page';
import MainScreenLayout from './components/guardians/screens/main-screen-layout';
import type {RootStackParamList} from './components/guardians/types/type';
import List from './components/onboarding/List';
const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    const requestNotificationPermission = async (): Promise<boolean> => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: '알림 권한 필요',
              message: '중요한 알림을 받기 위해 알림 권한이 필요합니다.',
              buttonNeutral: '나중에',
              buttonNegative: '거절',
              buttonPositive: '허용',
            },
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Android 알림 권한이 거부되었습니다.');
            return false;
          }
        }
        const authStatus = await messaging().requestPermission({
          sound: true,
          announcement: true,
          badge: true,
          alert: true,
        });

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Alert.alert(
            '알림 권한 필요',
            '앱의 중요한 기능을 사용하려면 알림 권한이 필요합니다. 설정에서 직접 허용해주세요.',
            [{text: '확인', style: 'default'}],
          );
          return false;
        }

        return true;
      } catch (err) {
        console.error('알림 권한 요청 실패:', err);
        Alert.alert('오류', '알림 권한 요청 중 오류가 발생했습니다.', [
          {text: '확인', style: 'default'},
        ]);
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
        console.log('FCM 토큰 에러:', err);
        return null;
      }
    };

    const sendTokenToBackend = async () => {
      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        console.log('FCM 토큰을 가져올 수 없습니다.');
        return;
      }

      try {
        const res = await axios.post(
          'https://capstone-be-oasis.onrender.com/takers/auth/init',
          {
            FCMToken: fcmToken,
          },
        );
        await AsyncStorage.setItem('fcmToken', fcmToken);
        const deviceId = res.data?.data?.deviceId;
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('백엔드에 토큰 전송 완료');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log('deviceId 전송 실패:', error.response?.data || error);
        } else {
          console.log('deviceId 전송 실패:', error);
        }
      }
    };

    const initializeNotifications = async () => {
      if (permissionRequested) return;

      setPermissionRequested(true);

      setTimeout(async () => {
        const permissionGranted = await requestNotificationPermission();

        if (permissionGranted) {
          await sendTokenToBackend();
        }
      }, 1000);
    };

    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || '알림',
          remoteMessage.notification.body || '새로운 알림이 도착했습니다.',
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
        console.log('토큰 갱신 전송 실패:', e);
      }
    });

    initializeNotifications();
    LogBox.ignoreLogs(['Remote debugger']);

    return () => {
      unsubscribeMessage();
      unsubscribeTokenRefresh();
    };
  }, [permissionRequested]);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{headerShown: false}}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainScreenLayout} />
          <Stack.Screen name="List" component={List} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;
