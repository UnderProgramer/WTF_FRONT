// components/DebugFCMToken.tsx
import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DebugFCMToken = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const loadTokens = async () => {
      const token = await AsyncStorage.getItem('fcmToken');
      const id = await AsyncStorage.getItem('deviceId');
      setFcmToken(token);
      setDeviceId(id);
    };
    loadTokens();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔥 디버그용 FCM 토큰</Text>
      <Text selectable style={styles.text}>{fcmToken ?? '토큰 없음'}</Text>

      <Text style={styles.title}>🆔 디바이스 ID</Text>
      <Text selectable style={styles.text}>{deviceId ?? '디바이스 ID 없음'}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 12, color: '#333', marginTop: 5 },
});

export default DebugFCMToken;
