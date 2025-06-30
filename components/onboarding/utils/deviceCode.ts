import AsyncStorage from '@react-native-async-storage/async-storage';

export const generate7DigitCodeFromDeviceId = async (): Promise<string> => {
  const deviceId = await AsyncStorage.getItem('deviceId');
  return deviceId ?? '코드 없음';
};
