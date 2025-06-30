import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {XMarkIcon, CheckIcon} from 'react-native-heroicons/outline';
import {Patient} from '../types/type';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FeBlend} from 'react-native-svg';
const API_BASE_URL = 'https://capstone-be-oasis.onrender.com';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (patient: Patient) => Promise<void>;
  token: string;
  guardianId: string;
}

export default function AddPatientModal({
  visible,
  onClose,
  onSubmit,
  token,
}: AddPatientModalProps) {
  const [takerName, setTakerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!takerName.trim()) {
      newErrors.takerName = '이름을 입력해주세요';
    } else if (takerName.trim().length < 2) {
      newErrors.takerName = '이름은 2글자 이상 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [takerName]);

  const reset = useCallback(() => {
    setTakerName('');
    setErrors({});
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/guardians/auth/taker-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({takerName: takerName.trim()}),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const created = await res.json();
      console.log('API Response:', created);

      Alert.alert('등록 완료', '복용자 등록이 완료되었습니다.');
      await onSubmit({
        takerName: takerName.trim(),
      });
      reset();
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage =
        err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [takerName, onSubmit, validateForm, token, reset]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={reset} style={styles.closeButton}>
        <XMarkIcon size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>복용자 등록</Text>
      <View style={styles.placeholder} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={reset}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}>
          {renderHeader()}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름 *</Text>
              <TextInput
                value={takerName}
                onChangeText={text => {
                  setTakerName(text);
                  if (errors.takerName) {
                    setErrors(prev => ({...prev, takerName: ''}));
                  }
                }}
                style={[styles.input, errors.takerName && styles.inputError]}
                placeholder="복용자 이름을 입력하세요"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
              {errors.takerName && (
                <Text style={styles.errorText}>{errors.takerName}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>등록 중...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>등록하기</Text>
                  <CheckIcon size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    minHeight: 56,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
