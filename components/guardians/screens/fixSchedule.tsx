import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  XMarkIcon,
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from 'react-native-heroicons/outline';

const API_BASE_URL = 'https://capstone-be-oasis.onrender.com';

interface EditScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  scheduleId: number;
  takerIdx: string;
  authToken: string;
  refreshToken: string;
  onTokenUpdate: (accessToken: string, refreshToken: string) => void;
  onScheduleUpdated: () => void;
}

export default function EditScheduleModal({
  visible,
  onClose,
  scheduleId,
  takerIdx,
  authToken,
  refreshToken,
  onTokenUpdate,
  onScheduleUpdated,
}: EditScheduleModalProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [times, setTimes] = useState<Date[]>([]);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | 'time' | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  const validateForm = useCallback(() => {
    const e: Record<string, string> = {};
    if (!title.trim()) {
      e.title = '약 이름을 입력하세요';
    }
    if (startDate > endDate) {
      e.range = '종료일이 시작일보다 늦어야 합니다';
    }
    if (times.length === 0) {
      e.times = '알람 시간을 하나 이상 추가하세요';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [title, startDate, endDate, times]);
  const handleDateChange = useCallback(
    (_: any, date?: Date) => {
      if (!date) {
        return setShowPicker(null);
      }
      if (showPicker === 'start') {
        setStartDate(date);
      } else if (showPicker === 'end') {
        setEndDate(date);
      } else if (showPicker === 'time') {
        setTimes(prev => [...prev, date]);
      }
      setShowPicker(null);
      setErrors(prev => ({...prev, range: '', times: ''}));
    },
    [showPicker],
  );

  const removeTime = useCallback(
    (index: number) => {
      setTimes(prev => prev.filter((_, i) => i !== index));
      if (times.length <= 1) {
        setErrors(prev => ({...prev, times: ''}));
      }
    },
    [times.length],
  );
  const refreshAccessToken = useCallback(
    async (rToken: string) => {
      const res = await fetch(`${API_BASE_URL}/guardians/auth/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rToken}`,
        },
      });
      if (!res.ok) {
        throw new Error('Token refresh failed');
      }
      const json = await res.json();
      const {accessToken: newAccessToken, refreshToken: newRefreshToken} = json;
      await AsyncStorage.setItem('accessToken', newAccessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      onTokenUpdate(newAccessToken, newRefreshToken);
      return newAccessToken;
    },
    [onTokenUpdate],
  );

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit) => {
      let response = await fetch(url, {
        ...options,
        headers: {...options.headers, Authorization: `Bearer ${authToken}`},
      });
      if (response.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        response = await fetch(url, {
          ...options,
          headers: {...options.headers, Authorization: `Bearer ${newToken}`},
        });
      }
      return response;
    },
    [authToken, refreshToken, refreshAccessToken],
  );

  const loadScheduleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await makeAuthenticatedRequest(
        `${API_BASE_URL}/guardians/data/schedule?user=${takerIdx}`,
        {method: 'GET', headers: {'Content-Type': 'application/json'}},
      );
      if (!res.ok) {
        throw new Error(`Load failed with status:${res.status}`);
      }
      const data = await res.json();
      let schedulesArray: any[] = [];

      if (Array.isArray(data.data)) {
        schedulesArray = data.data;
      } else if (Array.isArray(data)) {
        schedulesArray = data;
      }

      const matched = schedulesArray.find(
        (s: any) => s.scheduleIdx === scheduleId,
      );

      if (!matched) {
        throw new Error(
          '스케줄이 없습니다:ID에 해당하는 스케줄을 찾을 수 없습니다.',
        );
      }
      setTitle(matched.title || '');
      setStartDate(
        matched.startTime ? new Date(matched.startTime) : new Date(),
      );
      setEndDate(matched.endTime ? new Date(matched.endTime) : new Date());

      setTimes(
        (matched.noticeTime || []).map((t: string) => {
          const [h, m] = t.split(':');
          const d = new Date();
          d.setHours(Number(h), Number(m), 0, 0);
          return d;
        }),
      );
      setErrors({});
    } catch (e) {
      console.error('Error loading schedule data:', e);
      Alert.alert(
        '오류',
        '스케줄 정보를 불러오지 못했습니다.' +
          (e instanceof Error ? e.message : ''),
      );
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId, takerIdx, makeAuthenticatedRequest]);
  useEffect(() => {
    if (visible && scheduleId > 0) {
      loadScheduleData();
    }
  }, [visible, scheduleId, loadScheduleData]);

  const handleUpdate = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        scheduleIdx: scheduleId,
        takerIdx,
        schedule: {
          title,
          description: `${title} 복용 알람`,
          startTime: formatDate(startDate.toISOString()),
          endTime: formatDate(endDate.toISOString()),
          noticeTime: times.map(
            d =>
              d.toLocaleTimeString('ko-KR', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              }) + ':00',
          ),
        },
      };
      const res = await makeAuthenticatedRequest(
        `${API_BASE_URL}/guardians/data/schedule`,
        {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        throw new Error('Update failed');
      }
      Alert.alert('완료', '스케줄이 수정되었습니다', [
        {
          text: '확인',
          onPress: () => {
            onScheduleUpdated();
            onClose();
          },
        },
      ]);
    } catch {
      Alert.alert('오류', '수정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    scheduleId,
    takerIdx,
    title,
    startDate,
    endDate,
    times,
    validateForm,
    makeAuthenticatedRequest,
    onScheduleUpdated,
    onClose,
  ]);

  const handleDelete = useCallback(() => {
    Alert.alert('삭제', '정말 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (scheduleId <= 0) {
            Alert.alert('오류', '잘못된 ID');
            return;
          }
          setIsDeleting(true);
          try {
            const res = await makeAuthenticatedRequest(
              `${API_BASE_URL}/guardians/data/schedule`,
              {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({scheduleIdx: scheduleId}),
              },
            );
            if (!res.ok) {
              throw new Error('Delete failed');
            }
            Alert.alert('완료', '삭제되었습니다', [
              {
                text: '확인',
                onPress: () => {
                  onScheduleUpdated();
                  onClose();
                },
              },
            ]);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [scheduleId, makeAuthenticatedRequest, onScheduleUpdated, onClose]);

  if (isLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>스케줄 정보를 불러오는 중...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <XMarkIcon size={22} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>스케줄 수정</Text>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
              disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <TrashIcon size={22} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>약 이름 *</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={title}
                  onChangeText={text => {
                    setTitle(text);
                    if (errors.title) {
                      setErrors(prev => ({...prev, title: ''}));
                    }
                  }}
                  placeholder="약 이름을 입력하세요"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>복용 기간</Text>

              <View style={styles.dateRow}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateLabel}>시작일</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      errors.range && styles.inputError,
                    ]}
                    onPress={() => setShowPicker('start')}>
                    <Text style={styles.dateButtonText}>
                      {startDate.toLocaleDateString('ko-KR')}
                    </Text>
                    <CalendarDaysIcon size={18} color="#4A90E2" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateContainer}>
                  <Text style={styles.dateLabel}>종료일</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      errors.range && styles.inputError,
                    ]}
                    onPress={() => setShowPicker('end')}>
                    <Text style={styles.dateButtonText}>
                      {endDate.toLocaleDateString('ko-KR')}
                    </Text>
                    <CalendarDaysIcon size={18} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.range && (
                <Text style={styles.errorText}>{errors.range}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>알람 시간</Text>
              <TouchableOpacity
                style={styles.timeAddButton}
                onPress={() => setShowPicker('time')}>
                <PlusIcon size={16} color="#4A90E2" />
                <Text style={styles.timeAddButtonText}>시간 추가</Text>
              </TouchableOpacity>

              {errors.times && (
                <Text style={styles.errorText}>{errors.times}</Text>
              )}

              <View style={styles.timeList}>
                {times.map((time, index) => (
                  <View key={index} style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>
                      {time.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeTime(index)}
                      style={styles.timeRemoveButton}>
                      <XMarkIcon size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {showPicker && (
            <DateTimePicker
              value={
                showPicker === 'time'
                  ? new Date()
                  : showPicker === 'start'
                  ? startDate
                  : endDate
              }
              mode={showPicker === 'time' ? 'time' : 'date'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={showPicker === 'end' ? startDate : undefined}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.updateButton,
                (isSubmitting || !title.trim() || times.length === 0) &&
                  styles.disabledButton,
              ]}
              onPress={handleUpdate}
              disabled={isSubmitting || !title.trim() || times.length === 0}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <PencilIcon size={18} color="#ffffff" />
                  <Text style={styles.updateButtonText}>수정 완료</Text>
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  timeAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 10,
    marginBottom: 16,
  },
  timeAddButtonText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontWeight: '500',
    fontSize: 15,
  },
  timeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
    marginRight: 8,
  },
  timeRemoveButton: {
    padding: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});
