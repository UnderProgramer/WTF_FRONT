# 오아시스 프론트

**복약 관리 및 보호자 연동을 위한 모바일 앱**  
복용자가 약을 제때 먹을 수 있도록 디바이스 코드 기반으로 보호자와 연결하고,  
복용 알림, 스케줄 등록, 복용 체크 기능을 제공하는 React Native 기반의 모바일 애플리케이션입니다.

---

## 주요 기능

- 복용자 기기에서 5자리 디바이스 코드 생성
- 보호자가 해당 코드로 복용자와 연동
- 약 스케줄 등록 / 수정 / 삭제
- 복용 체크 및 상태 확인
- 복용자에게 푸시 알림 발송 (FCM)

---

## 기술 스택

### Frontend

- React Native
- TypeScript
- React Navigation (Stack, Bottom Tabs)
- Firebase Cloud Messaging (FCM)
- AsyncStorage
- Axios
- Date-fns

### 주요 라이브러리

- `@react-native-firebase/app`, `@react-native-firebase/messaging`
- `@react-navigation/native`, `native-stack`, `bottom-tabs`
- `react-native-device-info`, `react-native-svg`
- `react-native-modal-datetime-picker`, `react-native-mask-text`, `react-native-vector-icons`

---

## 주요 폴더 구조

```

FE-main/
├── app/                  # 앱 화면 관련 컴포넌트
├── components/           # UI 구성 요소들
├── styles/               # 전역 스타일 파일
├── assets/               # 이미지, 아이콘 등 정적 파일
├── App.tsx               # 앱 진입점
├── index.js              # 앱 루트
└── README.md             # 프로젝트 설명 파일

```

---

3. 앱 실행

```bash
npx react-native run-android
# 또는
npx react-native run-ios
```

---
