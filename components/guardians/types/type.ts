export type RootStackParamList = {
  Onboarding: undefined;
  MyPage: undefined;
  GuardiansHome: undefined;
  Schedule: undefined;
  Main: {screen: 'Schedule' | 'GuardiansHome' | 'MyPage'};
  AddPatient: undefined;
  MeLogin: undefined;
  List: undefined;
};
export interface Patient {
  takerIdx?: string;
  deviceId?: string;
  takerName?: string;
}
