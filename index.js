import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('백그라운드 메시지 수신:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
