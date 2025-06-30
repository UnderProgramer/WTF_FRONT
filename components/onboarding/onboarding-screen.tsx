'use client';

import { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import { RoleSelectionModal } from './role-selection-modal';
import { AuthModal } from './auth-modal';
import { StartSection, BulletPoint, OnboardingSlide } from './onboarding-slide';
import { styles } from './styles';

const { width } = Dimensions.get('window');


export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModal, setRoleModal] = useState<'guardian' | 'taker' | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }): void => {
    const slideIndex: number = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleCloseModal = useCallback(() => {
    setRoleModal(null);
  }, []);

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const slides = [
    {
      id: '1',
      image: require('../../assets/pa.png'),
      title: 'PILL TIME',
      subtitle: '약 복용, 이제는 안심하세요\n',
      description: '소중한 가족의 약 복용을 체계적으로\n관리해주는 스마트한 복약 관리 서비스입니다.',
    },
    {
      id: '3',
      image: require('../../assets/check.png'),
      title: '양방향 케어 시스템',
      subtitle: '',
      renderCustom: () => (
        <View style={styles.bulletContainer}>
          <Text style={styles.description}>
            복용자와 보호자를 실시간으로 연결하여{'\n'}더 안전하고 확실한 복약 관리가 가능합니다.{'\n\n'}
          </Text>
          <View style={styles.description2}>
          <BulletPoint text="보호자는 실시간으로 복용 상태 확인" highlight={['실시간으로 복용 상태']} />
          <BulletPoint text="미복용 시 즉시 알림 전송" highlight={['즉시 알림 전송']} />
          <BulletPoint text="복용자별 맞춤 약품 관리 기능" highlight={['맞춤 약품 관리']} />
          <BulletPoint text="약 복용 통계 및 기록 제공" highlight={['통계 및 기록']} />
          </View>
        </View>
      ),
    },
    {
      id: '4',
      image: require('../../assets/start.png'),
      title: '',
      subtitle: '',
      renderCustom: () => <StartSection onStartPress={() => setModalVisible(true)} />,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={slides}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        ref={flatListRef}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.dotContainer}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
          ))}
        </View>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={goToNextSlide}>
            <Text style={styles.nextButtonText}>다음으로</Text>
          </TouchableOpacity>
        )}
      </View>

      <RoleSelectionModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onSelectRole={(role) => {
    setModalVisible(false);
    setRoleModal(role);
    setIsSignup(false);
  }}
/>
      <AuthModal
        visible={roleModal !== null}
        roleType={roleModal}
        isSignup={isSignup}
        onClose={handleCloseModal}
        onToggleAuthMode={() => setIsSignup(!isSignup)}
      />
    </SafeAreaView>
  );
}
