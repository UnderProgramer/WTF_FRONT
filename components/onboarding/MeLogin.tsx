'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { styles } from './styles';
import { generate7DigitCodeFromDeviceId } from './utils/deviceCode';

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function MeLogin({ onClose }: LoginFormProps) {
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  useEffect(() => {
    const fetchCode = async () => {
      const code = await generate7DigitCodeFromDeviceId();
      setDeviceCode(code);
    };
    fetchCode();
  }, []);

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>복용자 디바이스 코드</Text>
        <View style={styles.inputWrapper}>
          {deviceCode ? (
            <Text style={[styles.input, styles.deviceCodeText]}>
              {deviceCode}
            </Text>
          ) : (
            <ActivityIndicator size="large" />
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
}
