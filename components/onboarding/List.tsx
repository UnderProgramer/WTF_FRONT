import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl, // ✅ 추가
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Medication {
  instance_idx: number;
  schedule_idx: number;
  taker_idx: number;
  schedule_title: string;
  taker_name: string;
  scheduled_time: string;
  is_taken: number;
  scheduled_datetime: string;
}

interface ApiResponse {
  status: number;
  data: {
    date: string;
    medications: Medication[];
  };
}

const List: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ 새로고침 상태
  const [date, setDate] = useState<string>('');

  const fetchMedications = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) throw new Error('deviceId가 없습니다.');
      const url = `https://capstone-be-oasis.onrender.com/takers/data/meds?user=${deviceId}`;
      const response = await fetch(url, {
        method: 'GET',
      });
      console.log('응답 상태코드:', response.status);
      const json: ApiResponse = await response.json();
      console.log('JSON 전체 응답:', JSON.stringify(json, null, 2));
      if (response.ok) {
        setMedications(json.data.medications);
        setDate(json.data.date);
      } else {
        Alert.alert('오류', `서버 오류: ${json.status}`);
      }
    } catch (err) {
      console.log('fetchMedications 실패:', err);
      Alert.alert('오류', '약 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false); // ✅ 새로고침 완료 처리
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedications();
  };

  const toggleMedication = (instance_idx: number) => {
    setMedications(prev =>
      prev.map(med =>
        med.instance_idx === instance_idx
          ? {...med, is_taken: med.is_taken === 1 ? 0 : 1}
          : med,
      ),
    );
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const minute = time.split(':')[1];
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}:${minute}`;
  };

  const currentDate = new Date(date || new Date()).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{marginTop: 40}}
        />
      </SafeAreaView>
    );
  }

  if (medications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={{flex: 1, justifyContent: 'center'}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <Text style={{textAlign: 'center', fontSize: 16}}>
            오늘 복용할 약이 없습니다.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>오늘의 복용약</Text>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {medications.map(medication => (
          <TouchableOpacity
            key={medication.instance_idx}
            style={[
              styles.medicationCard,
              medication.is_taken === 1 && styles.medicationCardTaken,
            ]}
            onPress={() => toggleMedication(medication.instance_idx)}
            activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.medicationName,
                  medication.is_taken === 1 && styles.medicationNameTaken,
                ]}>
                {medication.schedule_title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  medication.is_taken === 1
                    ? styles.statusBadgeTaken
                    : styles.statusBadgePending,
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    medication.is_taken === 1
                      ? styles.statusTextTaken
                      : styles.statusTextPending,
                  ]}>
                  {medication.is_taken === 1 ? '복용완료' : '복용예정'}
                </Text>
              </View>
            </View>

            <View style={styles.medicationDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>복용자</Text>
                <Text style={styles.detailValue}>{medication.taker_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>복용시간</Text>
                <Text style={styles.detailValue}>
                  {formatTime(medication.scheduled_time)}
                </Text>
              </View>
            </View>

            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  medication.is_taken === 1 && styles.checkboxChecked,
                ]}>
                {medication.is_taken === 1 && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                {medication.is_taken === 1 ? '복용했습니다' : '복용확인'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  medicationCardTaken: {
    backgroundColor: '#f8f9fa',
    borderColor: '#28a745',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  medicationNameTaken: {
    color: '#6c757d',
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusBadgePending: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  statusBadgeTaken: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#856404',
  },
  statusTextTaken: {
    color: '#155724',
  },
  medicationDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '500',
  },
});

export default List;
