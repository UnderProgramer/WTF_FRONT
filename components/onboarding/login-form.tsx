'use client';

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../guardians/types/type';

interface LoginFormProps {
  roleType: string;
  onToggleAuthMode: () => void;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginForm({
  roleType: _roleType,
  onToggleAuthMode,
  onClose,
  onLoginSuccess,
}: LoginFormProps) {
  const [guardianId, setguardianId] = useState('');
  const [guardianPassword, setguardianPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          params: { screen: 'GuardiansHome' },
        },
      ],
    });
  };
  const handleLogin = async () => {
    if (guardianId.trim() === '' || guardianPassword.trim() === '') {
      Alert.alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (guardianId === 'admin' && guardianPassword === '1234') {
      Alert.alert('임시 로그인 성공');
      onClose();
      onLoginSuccess();
      navigateToHome();
      return;
    }

    try {
      const response = await fetch('https://capstone-be-oasis.onrender.com/guardians/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guardianId,
          guardianPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.data?.token?.accessToken && result.data?.token?.refreshToken) {
        const { accessToken, refreshToken } = result.data.token;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('guardianId', guardianId);
        Alert.alert(result.message || '로그인 완료');
        onClose();
        onLoginSuccess();
        navigateToHome();
      } else {
        Alert.alert('아이디 또는 비밀번호가 틀렸습니다.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>아이디</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="아이디 입력"
            placeholderTextColor="#aaa"
            value={guardianId}
            onChangeText={setguardianId}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>비밀번호</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            placeholderTextColor="#aaa"
            value={guardianPassword}
            onChangeText={setguardianPassword}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.authButton, styles.loginButton]}
        activeOpacity={0.7}
        onPress={handleLogin}
      >
        <Text style={styles.authButtonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggleAuthMode} style={styles.switchAuthMode}>
        <Text style={styles.switchAuthModeText}>아직 계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
}

