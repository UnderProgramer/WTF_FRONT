import React, {useState, useCallback, useEffect} from 'react';
import styles, {scheduleModalStyles} from '../styles/GuardiansHomeScreen';
import {
  View,
  ScrollView,
  SafeAreaView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PageHeader from '../ui/page-header';
import FooterNav from '../navigation/footer-nav';
import AddPatientModal from './AddPaition';
import AddScheduleModal from './ScheduleAdd';
import {PencilIcon, PlusIcon, LinkIcon} from 'react-native-heroicons/outline';
import EditScheduleModal from './fixSchedule';
import InputId from './InputId';
const API_BASE_URL = 'https://capstone-be-oasis.onrender.com';
import {Patient} from '../types/type';
import {Link} from '@react-navigation/native';

export default function GuardiansHomeScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [isInputIdModalVisible, setInputIdModalVisible] =
    useState<boolean>(false);
  const [isScheduleModalVisible, setScheduleModalVisible] =
    useState<boolean>(false);
  const [isEditModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSchedule, _setSelectedSchedule] = useState<{
    scheduleIdx: number;
  } | null>(null);
  const [isScheduleSelectVisible, setScheduleSelectVisible] = useState(false);
  type ScheduleItem = {
    scheduleIdx: number;
    title?: string;
    startTime?: string;
    endTime?: string;
    noticeTime?: string[];
    displayPeriod?: string;
    schedule?: {
      title?: string;
      startTime?: string;
      endTime?: string;
      noticeTime?: string[];
    }[];
  };

  const formatSchedulePeriod = (
    startISO: string | null,
    endISO: string | null,
  ) => {
    if (!startISO || !endISO) return '기간 정보 없음';
    try {
      const startDate = new Date(startISO);
      const endDate = new Date(endISO);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return '유효하지 않은 날짜';
      }
      const startStr = `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${(endDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
      return `${startStr} ~ ${endStr}`;
    } catch (error) {
      console.error('Error formatting date period:', error);
      return '날짜 포맷 오류';
    }
  };

  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);

  const loadStoredData = useCallback(async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedGuardianId] =
        await Promise.all([
          AsyncStorage.getItem('accessToken'),
          AsyncStorage.getItem('refreshToken'),
          AsyncStorage.getItem('guardianId'),
        ]);
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setGuardianId(storedGuardianId);
      return {
        accessToken: storedAccessToken,
        refreshToken: storedRefreshToken,
        guardianId: storedGuardianId,
      };
    } catch (err) {
      return {accessToken: null, refreshToken: null, guardianId: null};
    }
  }, []);

  const refreshAccessToken = useCallback(async (rToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/guardians/auth/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rToken}`,
        },
      });
      if (!res.ok) throw new Error(`Refresh failed ${res.status}`);
      const json = await res.json();
      const newAccess = json.accessToken;
      const newRefresh = json.refreshToken;
      if (!newAccess || !newRefresh)
        throw new Error('Invalid token response structure');
      await AsyncStorage.setItem('accessToken', newAccess);
      await AsyncStorage.setItem('refreshToken', newRefresh);
      setAccessToken(newAccess);
      setRefreshToken(newRefresh);
      return newAccess;
    } catch (err) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setAccessToken(null);
      setRefreshToken(null);
      return null;
    }
  }, []);

  const fetchWithAuth = useCallback(
    async (url: string, opts: RequestInit = {}) => {
      let token = accessToken;
      if (!token) token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('Authentication required');
      let response = await fetch(url, {
        ...opts,
        headers: {...(opts.headers || {}), Authorization: `Bearer ${token}`},
      });
      if (response.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        if (newToken) {
          token = newToken;
          response = await fetch(url, {
            ...opts,
            headers: {
              ...(opts.headers || {}),
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
      return response;
    },
    [accessToken, refreshToken, refreshAccessToken],
  );

  const fetchPatients = useCallback(
    async (token: string, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const url = `${API_BASE_URL}/guardians/data/taker-list`;
        const res = await fetchWithAuth(url, {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        const json = await res.json();
        let list: Patient[] = [];
        if (Array.isArray(json)) {
          list = json.map((item: any) => ({
            takerIdx: item.takerIdx,
            takerName: item.takerName,
          }));
        } else if (json.data && Array.isArray(json.data)) {
          list = json.data.map((item: any) => ({
            takerIdx: item.takerIdx,
            takerName: item.takerName,
          }));
        }
        setPatients(list);
      } catch (err) {
        console.error('fetchPatients error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchWithAuth],
  );

  useEffect(() => {
    const initializeData = async () => {
      const {accessToken: storedToken, guardianId: storedGuardianId} =
        await loadStoredData();
      if (storedToken && storedGuardianId) {
        await fetchPatients(storedToken);
      } else {
        setLoading(false);
      }
    };
    initializeData();
  }, [loadStoredData, fetchPatients]);

  const onRefresh = useCallback(() => {
    if (accessToken) fetchPatients(accessToken, true);
    else Alert.alert('로그인 필요', '다시 로그인해주세요.');
  }, [accessToken, fetchPatients]);

  const handleAddPatient = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleInputIdModal = () => setInputIdModalVisible(true);
  const handleCloseInputIdModal = () => setInputIdModalVisible(false);

  const handlePatientSubmit = async (_patient: Patient) => {
    setModalVisible(false);
    await new Promise(r => setTimeout(r, 300));
    if (accessToken) await fetchPatients(accessToken);
  };

  const handleInputIdSuccess = async (_data: any) => {
    setInputIdModalVisible(false);
    Alert.alert('성공', '기기 연결이 완료되었습니다.');
    if (accessToken) await fetchPatients(accessToken);
  };

  const handleAddSchedule = (patient: Patient) => {
    setSelectedPatient(patient);
    setScheduleModalVisible(true);
  };

  const handleConnect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setInputIdModalVisible(true);
  };

  // 선택환자 설정
  const handleEditSchedule = async (patient: Patient) => {
    setSelectedPatient(patient);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/guardians/data/schedule?user=${patient.takerIdx}`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch schedules: ${res.status}`);
      }
      const json = await res.json();
      let schedulesResponse: any[] = [];
      if (Array.isArray(json.data)) {
        schedulesResponse = json.data;
      } else if (Array.isArray(json)) {
        schedulesResponse = json;
      }

      const filteredData = schedulesResponse
        .filter((item: any) => item.takerIdx === patient.takerIdx)
        .map((item: any) => ({
          scheduleIdx: item.scheduleIdx,
          title: item.title || '제목 없음',
          displayPeriod: formatSchedulePeriod(item.startTime, item.endTime),
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          noticeTime: item.noticeTime || [],
        }));
      setScheduleList(filteredData);
      setTimeout(() => {
        setScheduleSelectVisible(true);
      }, 0);
    } catch (e) {
      Alert.alert('오류', '스케줄 목록을 불러오는 데 실패했습니다.');
      console.error('Error fetching schedule list for edit:', e);
    }
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalVisible(false);
    setSelectedPatient(null);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedPatient(null);
    _setSelectedSchedule(null);
  };

  const handleScheduleUpdated = () => {
    if (accessToken) {
      fetchPatients(accessToken);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#f5576c',
      '#4facfe',
      '#43e97b',
      '#fa709a',
      '#fee140',
      '#a8edea',
      '#fed6e3',
      '#d299c2',
      '#ffecd2',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <PageHeader title="복용자 관리" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea', '#764ba2']}
            tintColor="#667eea"
          />
        }>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>
                복용자 정보를 불러오는 중...
              </Text>
            </View>
          </View>
        ) : patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>복용자가 없습니다</Text>
              <Text style={styles.emptyDescription}>
                새로운 복용자를 추가하세요
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.patientListContainer}>
            {patients.map((p, idx) => (
              <TouchableOpacity
                key={`${p.takerIdx}-${idx}`}
                style={styles.patientCard}
                onPress={() => handleAddSchedule(p)}
                activeOpacity={0.7}>
                <View style={styles.patientCardContent}>
                  <View style={styles.patientMainInfo}>
                    <View
                      style={[
                        styles.avatarContainer,
                        {
                          backgroundColor: getAvatarColor(
                            p.takerName || p.takerIdx || 'default',
                          ),
                        },
                      ]}>
                      <Text style={styles.avatarText}>
                        {p.takerName && p.takerName.trim().length > 0
                          ? p.takerName.charAt(0)
                          : p.takerIdx && p.takerIdx.trim().length > 0
                          ? p.takerIdx.charAt(0)
                          : '?'}
                      </Text>
                    </View>
                    <View style={styles.patientTextInfo}>
                      <Text style={styles.patientName}>
                        {p.takerName || p.takerIdx || '이름 없음'}
                      </Text>
                      <Text style={styles.patientId}>ID: {p.takerIdx}</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleConnect(p)}
                      style={styles.editButton}
                      activeOpacity={0.8}>
                      <LinkIcon size={18} color="#667eea" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEditSchedule(p)}
                      style={styles.editButton}
                      activeOpacity={0.8}>
                      <PencilIcon size={18} color="#667eea" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAddSchedule(p)}
                      style={styles.addButton}
                      activeOpacity={0.8}>
                      <PlusIcon size={18} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {isScheduleSelectVisible && (
        <Modal
          visible={isScheduleSelectVisible}
          onRequestClose={() => setScheduleSelectVisible(false)}
          transparent>
          <View style={scheduleModalStyles.modalBackground}>
            <View style={scheduleModalStyles.modalContainer}>
              <Text style={scheduleModalStyles.modalTitle}>
                수정할 스케줄을 선택하세요
              </Text>
              <ScrollView>
                {scheduleList.length === 0 ? (
                  <Text
                    style={{color: '#999', textAlign: 'center', marginTop: 16}}>
                    등록된 스케줄이 없습니다.
                  </Text>
                ) : (
                  scheduleList.map((item, idx) => (
                    <TouchableOpacity
                      key={item.scheduleIdx || idx}
                      onPress={() => {
                        _setSelectedSchedule({scheduleIdx: item.scheduleIdx});
                        setScheduleSelectVisible(false);
                        setEditModalVisible(true);
                      }}
                      style={scheduleModalStyles.scheduleButton}>
                      <Text style={scheduleModalStyles.scheduleTitle}>
                        {item.title}
                      </Text>
                      <Text style={scheduleModalStyles.scheduleTime}>
                        {item.displayPeriod}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setScheduleSelectVisible(false)}
                style={scheduleModalStyles.cancelButton}>
                <Text style={scheduleModalStyles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.addPatientButton, styles.halfWidthButton]}
            onPress={handleAddPatient}
            activeOpacity={0.8}>
            <View style={styles.addButtonGradient}>
              <View style={styles.addButtonContent}>
                <PlusIcon size={20} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.addPatientText}>복용자 추가</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.connectDeviceButton, styles.halfWidthButton]}
            onPress={handleInputIdModal}
            activeOpacity={0.8}>
            <View style={styles.connectButtonGradient}>
              <View style={styles.addButtonContent}>
                <LinkIcon size={20} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.addPatientText}>기기 연결</Text>
              </View>
            </View>
          </TouchableOpacity> */}
        </View>
      </View>

      <FooterNav />

      <EditScheduleModal
        visible={isEditModalVisible}
        onClose={handleCloseEditModal}
        scheduleId={
          selectedSchedule?.scheduleIdx
            ? Number(selectedSchedule.scheduleIdx)
            : 0
        }
        takerIdx={selectedPatient?.takerIdx || ''}
        authToken={accessToken || ''}
        refreshToken={refreshToken || ''}
        onTokenUpdate={(newAccess, newRefresh) => {
          setAccessToken(newAccess);
          setRefreshToken(newRefresh);
        }}
        onScheduleUpdated={handleScheduleUpdated}
      />

      <AddPatientModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handlePatientSubmit}
        token={accessToken || ''}
        guardianId={guardianId || ''}
      />

      {patients.length > 0 && (
        <InputId
          visible={isInputIdModalVisible}
          onClose={handleCloseInputIdModal}
          onSuccess={handleInputIdSuccess}
          token={accessToken || ''}
          takerIdx={selectedPatient?.takerIdx || ''}
          takerName={selectedPatient?.takerName || '알 수 없음'}
        />
      )}

      <AddScheduleModal
        visible={isScheduleModalVisible}
        onClose={handleCloseScheduleModal}
        guardianId={guardianId || ''}
        takerIdx={
          selectedPatient?.takerIdx ? Number(selectedPatient.takerIdx) : 0
        }
        authToken={accessToken || ''}
        refreshToken={refreshToken || ''}
        onTokenUpdate={(newAccessToken, newRefreshToken) => {
          setAccessToken(newAccessToken);
          setRefreshToken(newRefreshToken);
        }}
      />
    </SafeAreaView>
  );
}
