'use client';

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from './styles';
import { useNavigation } from '@react-navigation/native';

interface LoginFormProps {
  roleType: string;
  onToggleAuthMode: () => void;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginForm({ roleType: _roleType, onToggleAuthMode, onClose, onLoginSuccess, }: LoginFormProps) {
  const [userId, setUserId] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (userId.trim() === '' || userPassword.trim() === '') {
      Alert.alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    // 임시 로그인 처리 (테스트용)
    if (userId === 'admin' && userPassword === '1234') {
      Alert.alert('임시 로그인 성공');
      onClose(); // 모달 닫기
      onLoginSuccess();
      navigation.reset({
        index: 0,
        routes: [{ name: 'GuardiansHome' as never }],
      });
    }
    
    // 실제 백엔드 연동 부분 (현재는 주석 처리)
    /*
    try {
      const response = await fetch('http://172.28.2.170:3000/guardians/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          userPassword: userPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(data.message || '로그인 성공');
        onClose();
        navigation.navigate('GuardiansHome');
      } else {
        Alert.alert(data.message || '로그인 실패');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('서버 오류가 발생했습니다.');
    }
    */
    // Alert.alert('아이디 또는 비밀번호가 틀렸습니다.');
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
            value={userId}
            onChangeText={setUserId}
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
            value={userPassword}
            onChangeText={setUserPassword}
            secureTextEntry
          />
        </View>
      </View>
      <TouchableOpacity style={[styles.authButton, styles.loginButton]} activeOpacity={0.7} onPress={handleLogin}>
        <Text style={styles.authButtonText}>로그인하기</Text>
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