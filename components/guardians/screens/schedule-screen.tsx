'use client';
import styles from '../styles/schedule-screen.styles';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PageHeader from '../ui/page-header';
import EmptyState from '../ui/empty-state';
import StatsCard from '../schedule/stats-card';
import FooterNav from '../navigation/footer-nav';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/type';

const API = 'https://capstone-be-oasis.onrender.com';
// const API = 'https://3605-14-46-116-209.ngrok-free.app';
interface ScheduleItem {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  noticeTime: string[];
}

interface ScheduleData {
  schedulIdx: number;
  takerId: string;
  schedule: ScheduleItem[];
}


interface TokenRefreshResponse {
  status?: number;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: {
      accessToken: string;
      refreshToken: string;
    };
  };
  accessToken?: string;
  refreshToken?: string;
}

export default function ScheduleScreen() {
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      console.log('토큰 갱신 시작...');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('RefreshToken이 없습니다');
        Alert.alert('인증 오류', '다시 로그인해주세요.', [
          {
            text: '확인',
            onPress: async () => {
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'guardianId']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            },
          },
        ]);
        return null;
      }

      console.log('RefreshToken 존재, API 호출 중...');
      console.log('RefreshToken 앞 10자리:', refreshToken.substring(0, 10));
      const response = await fetch(`${API}/guardians/auth/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      console.log('토큰 갱신 응답 상태:', response.status);
      const responseText = await response.text();
      console.log('토큰 갱신 응답 원본:', responseText);
      if (!responseText) {
        console.error('토큰 갱신 응답이 비어있습니다.');
        throw new Error('서버로부터 유효한 토큰 갱신 응답을 받지 못했습니다.');
      }

      let json: TokenRefreshResponse;
      try {
        json = JSON.parse(responseText);
        console.log('파싱된 응답:', JSON.stringify(json, null, 2));
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('응답 형식이 올바르지 않습니다');
      }
      let newAccessToken: string | null = null;
      let newRefreshToken: string | null = null;
      if (json.data?.token?.accessToken && json.data?.token?.refreshToken) {
        newAccessToken = json.data.token.accessToken;
        newRefreshToken = json.data.token.refreshToken;
        console.log('토큰 추출 방법: data.token 구조');
      }
      else if (json.data?.accessToken && json.data?.refreshToken) {
        newAccessToken = json.data.accessToken;
        newRefreshToken = json.data.refreshToken;
        console.log('토큰 추출 방법: data 구조');
      }
      else if (json.accessToken && json.refreshToken) {
        newAccessToken = json.accessToken;
        newRefreshToken = json.refreshToken;
        console.log('토큰 추출 방법: 직접 구조');
      }
      else if (json.data && typeof json.data === 'string') {
        newAccessToken = json.data;
        newRefreshToken = refreshToken;
        console.log('토큰 추출 방법: data가 accessToken');
      }

      if (!newAccessToken) {
        console.error('응답에서 accessToken을 찾을 수 없습니다:', json);
        throw new Error('새로운 AccessToken을 받지 못했습니다');
      }

      await AsyncStorage.setItem('accessToken', newAccessToken);
      setAccessToken(newAccessToken);
      if (newRefreshToken && newRefreshToken !== refreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        console.log('새로운 RefreshToken도 저장됨');
      }

      console.log('AccessToken이 성공적으로 갱신되었습니다');
      console.log('새 AccessToken 앞 10자리:', newAccessToken.substring(0, 10));
      return newAccessToken;
    } catch (error) {
      console.error('토큰 갱신 중 오류 발생:', error);
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('AccessToken을 받지 못했습니다')) {
          Alert.alert('세션 만료', '다시 로그인해주세요.', [
            {
              text: '확인',
              onPress: async () => {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'guardianId']);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                });
              },
            },
          ]);
        } else {
          Alert.alert('오류', '토큰 갱신에 실패했습니다.');
        }
      }
      return null;
    }
  }, [navigation]);

  const fetchWithTokenRefresh = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = accessToken;
    if (!token) {
      token = await AsyncStorage.getItem('accessToken');
    }
    if (!token) {
      throw new Error('AccessToken이 없습니다. 로그인이 필요합니다.');
    }

    console.log('API 호출 시작:', url);
    console.log('사용 중인 AccessToken 앞 10자리:', token.substring(0, 10));

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('첫 번째 API 응답 상태:', response.status);

    if (response.status === 401) {
      console.log('AccessToken 만료 감지, 토큰 갱신 시도...');

      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw new Error('토큰 갱신에 실패하여 API 요청을 계속할 수 없습니다.');
      }

      console.log('새 토큰으로 재시도...');
      console.log('새 토큰 앞 10자리:', newToken.substring(0, 10));

      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
      });

      console.log('토큰 갱신 후 API 응답 상태:', response.status);
    }

    return response;
  }, [accessToken, refreshAccessToken]);

  const loadSchedules = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      if (storedToken && !accessToken) {
        setAccessToken(storedToken);
      }

      if (!storedToken && !accessToken) {
        console.log('토큰이 없어서 스케줄 로드를 건너뜀 (로그인 필요)');
        Alert.alert('로그인 필요', '세션이 만료되었거나 로그인되지 않았습니다. 다시 로그인해주세요.', [
          {
            text: '확인',
            onPress: async () => {
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'guardianId']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            },
          },
        ]);
        return;
      }

      const response = await fetchWithTokenRefresh(`${API}/guardians/data/schedule`);
      console.log('스케줄 로드 응답 상태:', response);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('스케줄 로드 응답 오류:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('스케줄 로드 응답:', responseText);
      if (!responseText) {
        console.log('스케줄 데이터 응답이 비어있습니다.');
        setScheduleData([]);
        return;
      }

      const json = JSON.parse(responseText);
      const data: ScheduleData[] = json.data.map((item: any, _idx: number) => ({
        schedulIdx: item.scheduleIdx,
        takerId: item.takerId,
        schedule: [
          {
            title: item.title,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            noticeTime: item.noticeTime,
          },
        ],
      }));
      setScheduleData(data);

      console.log('스케줄 데이터 로드 성공:', data.length, '개 항목');
    } catch (err) {
      console.error('스케줄 로드 실패:', err);
      if (err instanceof Error) {
        if (err.message.includes('토큰') || err.message.includes('AccessToken이 없습니다')) {
          console.log('토큰 문제로 인한 로그인 필요');
          Alert.alert('인증 오류', '세션이 만료되었습니다. 다시 로그인해주세요.', [
            {
              text: '확인',
              onPress: async () => {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'guardianId']);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                });
              },
            },
          ]);
        } else {
          Alert.alert('오류', '스케줄을 불러오는데 실패했습니다.');
        }
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [accessToken, fetchWithTokenRefresh, navigation]);
  const onRefresh = useCallback(() => {
    loadSchedules(true);
  }, [loadSchedules]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const formatTime = (start: string, end: string, noticeTime?: any) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    let times = '';
    if (Array.isArray(noticeTime)) {
      times = noticeTime.map((t: string) => t?.slice(0, 5)).join(', ');
    }

    return {
      period: `${startDateString} ~ ${endDateString}`,
      alarmTimes: times,
    };
  };
  // const allScheduleItems = scheduleData.flatMap((data, dataIndex) =>
  //   (data.schedule || []).map((item, itemIndex) => ({
  //     ...item,
  //     takerId: data.takerId,
  //     scheduleIdx: data.schedulIdx,
  //     uniqueId: `${dataIndex}-${itemIndex}`,
  //     id: `${dataIndex}-${itemIndex}`,
  //   }))
  // );
  const allScheduleItems = scheduleData.flatMap((group, groupIdx) => {
    if (!Array.isArray(group.schedule)) {return [];}
    return group.schedule.map((item, itemIdx) => ({
      ...item,
      takerId: group.takerId,
      scheduleIdx: group.schedulIdx,
      uniqueId: `${groupIdx}-${itemIdx}`,
      id: `${groupIdx}-${itemIdx}`,
    }));
  });



  const handleConfirmMedication = (id: string) => {
    console.log('Confirming medication for schedule ID:', id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title="일정 관리" />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>일정을 불러오는 중...</Text>
          </View>
        ) : allScheduleItems.length === 0 ? (
          <EmptyState
            title="일정이 없습니다"
            description="일정을 추가하여 관리를 시작해보세요"
          />
        ) : (
          <View style={styles.scheduleListContainer}>
            {allScheduleItems.map((item) => {
              const { period, alarmTimes } = formatTime(item.startTime, item.endTime, item.noticeTime);
              return (
                <TouchableOpacity
                  key={item.uniqueId}
                  style={styles.scheduleCard}
                  onPress={() => handleConfirmMedication(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.timeIndicator}>
                      <Text style={styles.timeIndicatorText}>{period}</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.mainInfo}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.dateText}>알림시간: {alarmTimes}</Text>
                    </View>
                    <View style={styles.footerInfo}>
                      <View style={styles.managerInfo}>
                        <View style={styles.managerIcon}>
                          <Text style={styles.managerIconText}>복용자</Text>
                        </View>
                        <Text style={styles.managerText}>{item.takerId}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        )}
        <View style={styles.statsContainer}>
          <StatsCard
            total={allScheduleItems.length}
            completed={0}
            remaining={allScheduleItems.length}
          />
        </View>
      </ScrollView>
      <FooterNav />
    </SafeAreaView>
  );
}
