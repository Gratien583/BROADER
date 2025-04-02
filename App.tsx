import { useState, useEffect, useRef } from 'react';
import { Text,  Button, Platform,TouchableOpacity,useColorScheme } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet, StatusBar} from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import * as Notifications from 'expo-notifications';
import { Notification } from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import * as SplashScreen from 'expo-splash-screen';
import Welcome from './src/screens/Welcome';
import TermsOfServiceModal from './src/screens/TermsOfServiceModal';
import ProfileSetup from './src/screens/ProfileSetup';
import Signin from './src/screens/Signin';
import EventlistTab from './src/screens/EventlistTab';
import Top from './src/screens/Top';
import AdminPage from './src/Admin/AdminPage';
import ChatList from './src/components/ChatList';
import Home from './src/screens/Home';
import alert from './src/components/alert';
import ChatRoom from './src/components/ChatRoom';
import Social from './src/components/Social';
import QRCodeComponent from './src/components/QRCodeComponent';
import SearchUser from './src/components/SearchUser';
import UserPage from './src/components/UserPage';
import ScheduleDetail from './src/components/ScheduleDetail';
import ReportPage from './src/components/ReportPage';
import ProfileEdit from './src/screens/ProfileEdit';
import ImageUploadPage from './src/components/ImageUploadPage';
import CreateAccount from './src/screens/CreateAccount';
import CreateArticleScreen from './src/screens/CreateArticleScreen';
import AttributeSettings from './src/components/AttributeSettings';
import AccountCreated from './src/screens/AccountCreated';
import Confirmation from './src/screens/Confirmation';
import SetHobbies from './src/components/SetHobbies';
import Calendar from './src/components/Calendar';
import ArticleDetail from './src/components/ArticleDetail';
import TabNavigator from './src/components/TabNavigator';
import { RootStackParamList } from './src/types';
import { getToken } from './src/utils/tokenUtils';
import {  registerForPushNotificationsAsync as registerForPushNotifications  } from './src/utils/getExpoPushToken';
import { supabase } from './src/supabaseClient';
import 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { EXPO_PUSH_ENDPOINT } from '@env';

const Stack = createStackNavigator<RootStackParamList>();


const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: 'white',
  },
  headerTintColor: '#000',
  headerTitle: '',
  headerBackTitleVisible: false,
  gestureEnabled: false,
};


//通知の動作を制御するハンドラー
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});


//プッシュ通知送信の関数　トークン引数に （デバック用　後で消す）
async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'BROADER',
    body: 'ようこそ！！',
    data: {
      type: 'welcome',
      senderUserId: '12345',
      someData: 'goes here',
    },
  };
  
  await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  }); 
}



export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const [isAdmin, setIsAdmin] = useState(false);

  const checkBanStatus = async () => {
    const userId = await AsyncStorage.getItem('supabase_user_id');
    if (!userId) return false;
  
    const { data: user, error } = await supabase
      .from('users')
      .select('banned_until')
      .eq('id', userId)
      .single();
  
    if (error || !user) return false;
  
    const bannedUntil = new Date(user.banned_until);
    return bannedUntil > new Date(); // 現在日時がbanned_untilより前か確認
  };
  
  const checkAdminStatus = async () => {
    const userId = await AsyncStorage.getItem('supabase_user_id');
    if (!userId) return;
  
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();
  
    if (error) {
      console.error("Error fetching admin status:", error);
      return;
    }
  
    // Webなら Top、スマホなら EventlistTab に遷移
    if (Platform.OS === 'web') {
      setInitialRoute('Top');
    } else {
      setInitialRoute('EventlistTab');
    }
  };
  
  useEffect(() => {

     SplashScreen.preventAutoHideAsync(); // スプラッシュスクリーンの非表示を遅らせる


         //関数を呼び出し、Expoのプッシュ通知トークンを取得
         registerForPushNotifications()
           .then(token => setExpoPushToken(token ?? ''))
           .catch((error: any) => setExpoPushToken(`${error}`));

      

    //ここはこの部分は、プッシュ通知がデバイスに届いたときに呼び出されるリスナー（通知イベントリスナー）を設定しています。

// 通知リスナー
notificationListener.current = Notifications.addNotificationReceivedListener(
  async (notification: Notification) => {
    setNotification(notification); // 状態に保存（オプション）
    await saveNotification(notification); // 通知を保存
  }
);
//AsyncStorageに通知を保存する関数
const saveNotification = async (notification: Notification) => {
  try {
    const existingData = await AsyncStorage.getItem('notifications');
    const notifications = existingData ? JSON.parse(existingData) : [];

    const newNotification = {
      id: notification.request.identifier, // 通知ID
      title: notification.request.content.title || 'タイトルなし',
      body: notification.request.content.body || '内容なし',
      receivedAt: new Date().toISOString(), // 受信時刻
      senderUserId: notification.request.content.data?.senderUserId || '未設定',
      type: notification.request.content.data?.type || '',
    };

    notifications.push(newNotification);
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    console.log('通知が保存されました:', newNotification);
  } catch (error) {
    console.error('通知の保存中にエラーが発生:', error);
  }
};



    //デバック用　この部分は、ユーザーが通知に対して何らかの操作（クリックやタップなど）を行ったときに呼び出されるリスナーを設定しています。
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    //useEffectフックがクリーンアップフェーズに入ったとき（例：コンポーネントがアンマウントされるとき）、登録されたリスナーを削除するための処理がここに書かれています。
    // return () => {
    //   notificationListener.current &&
    //     Notifications.removeNotificationSubscription(notificationListener.current);
    //   responseListener.current &&
    //     Notifications.removeNotificationSubscription(responseListener.current);
    // };

    
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userId = await AsyncStorage.getItem('supabase_user_id');
        


        if (token && userId) {
          const isBanned = await checkBanStatus();
          if (isBanned) {
          //console.log('Token and User ID found:', token, userId);
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('supabase_user_id');
          setInitialRoute('Welcome');
          }else{
          await checkAdminStatus();
          }
        } else {
          //console.warn('No token or user ID found');
          setInitialRoute('Welcome');
        }
      } catch (error) {
       // console.error('Error checking login status:', error);
        setInitialRoute('Welcome'); // エラーが発生した場合はWelcome画面に遷移
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync(); // スプラッシュスクリーンを非表示
      }
    };


    checkLoginStatus();




    
  }, []);

  if (loading) {
    return (
      <View >
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }



  return (
    <>
     <StatusBar barStyle="light-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute || 'Welcome'} screenOptions={defaultScreenOptions}>
        <Stack.Screen 
            name="TermsOfServiceModal" 
            // @ts-ignore
            component={TermsOfServiceModal} 
            options={({ navigation }) => ({
              presentation: 'modal',
              gestureEnabled: true,
              headerTitle: () => (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                    利用規約
                  </Text>
                </View>
              ),
              headerLeft: () => null,
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginRight: 16 }}
                >
                   <Text style={{ color: '#000', fontSize: 40 }}>×</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
          <Stack.Screen 
            name="Signin" 
            component={Signin}
            initialParams={{ expoPushToken: expoPushToken ?? '' }}
            options={({ navigation }) => ({
              headerLeft: () => (
                <HeaderBackButton onPress={() => navigation.navigate('Welcome')} labelVisible={false} />
              ),
            })}
          />
          <Stack.Screen name="CreateAccount" component={CreateAccount} />
          <Stack.Screen name="ImageUploadPage" component={ImageUploadPage} />
          <Stack.Screen name="AccountCreated" component={AccountCreated} />
          <Stack.Screen name="EventlistTab" component={Platform.OS === 'web' ? EventlistTab : TabNavigator} options={{ headerShown: false }}/>
          <Stack.Screen name="Top" component={Top} options={{ headerShown: false }}/>
          <Stack.Screen
            name="AdminPage"
            component={AdminPage}
            options={({ navigation }) => ({
              title: '管理者ページ',
              headerLeft: () => (
                <HeaderBackButton
                onPress={() =>
                  navigation.navigate(Platform.OS === 'web' ? 'Top' : 'EventlistTab')
                }
                labelVisible={false}
              />              
              ),
            })}
          />
          <Stack.Screen name="ChatList" component={ChatList} options={{ headerShown: false }} />
          <Stack.Screen name="ChatRoom" component={ChatRoom}/>
          <Stack.Screen name="Social" component={Social} options={{ headerShown: false }}/>
          <Stack.Screen
              name="AttributeSettings"
              // @ts-ignore
              component={AttributeSettings}
              options={({ navigation }) => ({
                presentation: 'modal',
                headerTitle: () => (
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                      属性適用
                    </Text>
                  </View>
                ),
                headerLeft: () => null,
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginRight: 16 }}
                  >
                     <Text style={{ color: '#000', fontSize: 40 }}>×</Text>
                  </TouchableOpacity>
                ),
                gestureEnabled: true,
              })}
            />
          <Stack.Screen name="Home" component={Home}/>
          <Stack.Screen name="alert" component={alert} />
          <Stack.Screen 
            name="QRCodeComponent" 
            // @ts-ignore
            component={QRCodeComponent} 
            options={{
              presentation: 'transparentModal',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="SearchUser" 
            // @ts-ignore
            component={SearchUser} 
            options={{
              presentation: 'modal',
              headerShown: false,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="UserPage"
            component={UserPage}
            options={{
              headerShown: Platform.OS !== 'web',
            }}
          />
          <Stack.Screen name="ScheduleDetail" component={ScheduleDetail} options={({ navigation }) => ({
              gestureEnabled: true,
              headerLeft: () => null,
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginRight: 16 }}
                >
                   <Text style={{ color: '#000', fontSize: 40 }}>×</Text>
                </TouchableOpacity>
              ),
            })}/>
          <Stack.Screen 
            name="ReportPage" 
            // @ts-ignore
            component={ReportPage} 
            options={({ navigation }) => ({
              presentation: 'modal',
              gestureEnabled: true,
              headerTitle: () => (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                    報告
                  </Text>
                </View>
              ),
              headerLeft: () => null,
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginRight: 16 }}
                >
                   <Text style={{ color: '#000', fontSize: 40 }}>×</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="CreateArticleScreen"
            component={CreateArticleScreen}
            options={({ navigation }) => ({
              headerLeft: () => 
                Platform.OS === 'web' ? null : (
                  <HeaderBackButton onPress={() => navigation.navigate('EventlistTab')} />
                ),
              headerShown: Platform.OS === 'web' ? false : true,
            })}
          />
          <Stack.Screen name="ProfileSetup" component={ProfileSetup} options={{ headerLeft: () => null }} />
          <Stack.Screen 
            name="ProfileEdit" 
            // @ts-ignore
            component={ProfileEdit} 
            options={({ navigation }) => ({
              presentation: 'modal',
              gestureEnabled: true,
              headerLeft: () => null,
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginRight: 16 }}
                >
                   <Text style={{ color: '#000', fontSize: 40 }}>×</Text>
                </TouchableOpacity>
              ),
            })}
          />
         <Stack.Screen 
            name="ArticleDetail" 
            component={ArticleDetail} 
            options={({ navigation }) => ({
              headerShown: Platform.OS !== 'web',
              headerLeft: Platform.OS !== 'web' ? () => (
                <HeaderBackButton onPress={() => navigation.goBack()} labelVisible={false} />
              ) : undefined,
              headerBackTitleVisible: false,
            })}
          />
          <Stack.Screen name="SetHobbies" component={SetHobbies} options={({ navigation }) => ({
              headerLeft: () => (
                <HeaderBackButton onPress={() => navigation.navigate('ProfileEdit')} labelVisible={false} />
              ),
            })} />
        </Stack.Navigator>
      </NavigationContainer>

     {/* ↓これはデバック用　後ほど消す */}
      {/* <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      /> */}
      {/* ↑これはデバック用　後ほど消す */}
    </>
  );
}
