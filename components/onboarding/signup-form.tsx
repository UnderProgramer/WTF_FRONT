'use client';

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from './styles';

interface SignupFormProps {
  onToggleAuthMode: () => void;
  onClose: () => void;
}

export function SignupForm({ onToggleAuthMode, onClose }: SignupFormProps) {
  const [guardianId, setguardianId] = useState('');
  const [guardianPassword, setguardianPassword] = useState('');
  const [guardianPasswordConfirm, setguardianPasswordConfirm] = useState('');
  const [guardianName, setguardianName] = useState('');
  const handleSignup = async () => {
    if (guardianPassword !== guardianPasswordConfirm) {
      Alert.alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('https://capstone-be-oasis.onrender.com/guardians/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guardianId,
          guardianPassword,
          guardianPasswordConfirm,
          guardianName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(data.message || '회원가입 완료');
        onClose();
      } else {
        Alert.alert(data.message || '회원가입 실패');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.sformContainer}>
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
        <Text style={styles.inputLabel}>이름</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="이름 입력"
            placeholderTextColor="#aaa"
            value={guardianName}
            onChangeText={setguardianName}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>비밀번호</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#aaa"
            value={guardianPassword}
            onChangeText={setguardianPassword}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>비밀번호 확인</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#aaa"
            value={guardianPasswordConfirm}
            onChangeText={setguardianPasswordConfirm}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.authButton]} activeOpacity={0.7} onPress={handleSignup}>
        <Text style={styles.authButtonText}>가입하기</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggleAuthMode} style={styles.switchAuthMode}>
        <Text style={styles.switchAuthModeText}>이미 계정이 있으신가요? 로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton1} onPress={onClose}>
        <Text style={styles.closeButtonText1}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
}
