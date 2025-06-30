'use client';

import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {styles} from './styles';
import {generate7DigitCodeFromDeviceId} from './utils/deviceCode';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../components/guardians/types/type';
interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function MeLogin({onClose}: LoginFormProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      <TouchableOpacity
        style={[styles.closeButton, {marginTop: 10}]}
        onPress={() => navigation.navigate('List')}>
        <Text style={styles.closeButtonText}>약 목록으로 이동</Text>
      </TouchableOpacity>
    </View>
  );
}
