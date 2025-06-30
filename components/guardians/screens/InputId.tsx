import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {XMarkIcon, LinkIcon} from 'react-native-heroicons/outline';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {get} from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

const API_BASE_URL = 'https://capstone-be-oasis.onrender.com';

interface TakerConnectData {
  takerIdx: string;
  takerName: string;
  deviceId: string;
}

interface TakerConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: TakerConnectData) => void;
  token: string;
  takerIdx: string;
  takerName: string;
}

export default function TakerConnectModal({
  visible,
  onClose,
  onSuccess,
  token,
  takerIdx,
  takerName,
}: TakerConnectModalProps) {
  const [deviceId, setDeviceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_isLoadingDeviceId, setIsLoadingDeviceId] = useState(true);
  const [aleadyConn, setAleadyConn] = useState(false);
  //dviceId 가져오기
  // const getDeviceId = async () => {
  //   let FCMToken = await AsyncStorage.getItem('fcmToken');
  //   console.log('FCMToken:', FCMToken);
  //   let storedDeviceId = await AsyncStorage.getItem('deviceId');
  //   console.log(storedDeviceId);

  //   if (FCMToken) {
  //     const response = await fetch(`${API_BASE_URL}/takers/auth/init`, {
  //       method: 'POST',
  //       headers: {'Content-Type': 'application/json'},
  //       body: JSON.stringify({FCMToken}),
  //     });
  //     const responseData = await response.json();
  //     storedDeviceId = responseData.data.deviceId;
  //     if (storedDeviceId) {
  //       await AsyncStorage.setItem('deviceId', storedDeviceId);
  //       setDeviceId(storedDeviceId);
  //     }
  //   } else {
  //     Alert.alert('ERROR', 'FCMToken is not found');
  //     return null;
  //   }
  //   return storedDeviceId;
  // };

  const loadDeviceId = useCallback(async () => {
    setIsLoadingDeviceId(true);
  }, []);

  useEffect(() => {
    if (visible) {
      loadDeviceId();
    }
  }, [visible, loadDeviceId]);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  //diviceId 가져오기

  const handleSubmit = useCallback(async () => {
    if (!deviceId) {
      Alert.alert('오류', '기기 ID가 없습니다.');
      return;
    } else if (deviceId.length < 5) {
      Alert.alert('오류', '복용자 id는 5글자 여야합니다');
      return;
    }
    //기기연결
    setIsSubmitting(true);
    if (!deviceId || !takerIdx) {
      Alert.alert(
        `EERROR : { "message" : "takerIdx : ${takerIdx}", "deviceId" : ${deviceId}}`,
      );
    }

    try {
      const connRes = await fetch(
        `${API_BASE_URL}/guardians/auth/taker-connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            takerIdx: takerIdx,
            deviceId: deviceId,
          }),
        },
      );

      if (!connRes.ok) {
        console.log(
          `연결 실패 ${await connRes.statusText}\nauth : ${token}\ntakeridx: ${takerIdx}\ndeviceId: ${deviceId}`,
        );
        throw new Error('연결 실패');
      }
      console.log('연결 성공:', await connRes.text());

      Alert.alert('연결 완료', '복용자와 기기 연결이 완료되었습니다.');
      onSuccess({
        takerIdx,
        takerName,
        deviceId,
      });
      setAleadyConn(true);
      console.log(String(aleadyConn));

      reset();
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : '연결 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [takerIdx, deviceId, token, onSuccess, takerName, reset, aleadyConn]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={reset} style={styles.closeButton}>
        <XMarkIcon size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>기기 연결</Text>
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
            <Text style={styles.sectionTitle}>기기 연결</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>복용자</Text>
              <Text style={styles.infoValue}>{takerName}</Text>
              <Text>ID : {takerIdx}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>기기 ID</Text>
              <TextInput
                style={styles.writeId}
                maxLength={5}
                placeholder="복용자 ID를 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={deviceId}
                onChangeText={text => setDeviceId(text)}></TextInput>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (isSubmitting || !deviceId) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !deviceId}>
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>연결 중...</Text>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  {aleadyConn ? (
                    <>
                      <Text style={styles.primaryButtonText}>이미 연결 됨</Text>
                      <LinkIcon size={20} color="#fff" />
                    </>
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>기기 연결</Text>
                      <LinkIcon size={20} color="#fff" />
                    </>
                  )}
                </View>
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  writeId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
