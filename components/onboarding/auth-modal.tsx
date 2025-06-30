'use client';

import React from 'react';
import { View, Text, Modal } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { MeLogin } from './MeLogin';
import { styles } from './styles';

type RootStackParamList = {
  GuardiansHome: undefined;
  TakersHome: undefined;
  MeLogin: undefined;
};

interface AuthModalProps {
  visible: boolean;
  roleType: 'guardian' | 'taker' | null;
  isSignup: boolean;
  onClose: () => void;
  onToggleAuthMode: () => void;
}

interface HandleLoginSuccess {
  (): void;
}

interface TitleLogic {
  (): string;
}

export const AuthModal = ({
  visible,
  roleType,
  isSignup,
  onClose,
  onToggleAuthMode,
}: AuthModalProps) =>{
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (!roleType) {return null;}

  const handleLoginSuccess: HandleLoginSuccess = () => {
    onClose();
    if (roleType === 'guardian') {
      navigation.navigate('GuardiansHome');
    } else {
      navigation.navigate('TakersHome');
    }
  };

  const title: TitleLogic = () =>
    roleType === 'guardian'
      ? isSignup
        ? '보호자 회원가입'
        : '보호자 로그인'
      : isSignup
      ? '복용자 회원가입'
      : '복용자 로그인';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.authModalContent]}>
          <Text style={styles.modalTitle}>{title()}</Text>

          {isSignup ? (
            roleType === 'guardian' ? (
              <SignupForm
                onToggleAuthMode={onToggleAuthMode}
                onClose={onClose}
              />
            ) : (
              <SignupForm
                onToggleAuthMode={onToggleAuthMode}
                onClose={onClose}
              />
            )
          ) : roleType === 'guardian' ? (
            <LoginForm
              roleType={roleType}
              onToggleAuthMode={onToggleAuthMode}
              onClose={onClose}
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <MeLogin onClose={onClose} onLoginSuccess={handleLoginSuccess} />
          )}
        </View>
      </View>
    </Modal>
  );
};
