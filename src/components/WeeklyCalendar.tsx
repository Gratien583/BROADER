import React, { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Text ,Alert, Image} from 'react-native';
import { Calendar as CalendarComponent, CalendarProps, LocaleConfig } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'moment/locale/ja';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

moment.locale('ja');

LocaleConfig.locales['ja'] = {
  monthNames: [
    '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'
  ],
  monthNamesShort: [
    '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'
  ],
  dayNames: [
    '日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'
  ],
  dayNamesShort: [
    '日', '月', '火', '水', '木', '金', '土'
  ],
};
LocaleConfig.defaultLocale = 'ja';

interface CustomCalendarProps extends Omit<CalendarProps, 'onDayPress'> {
  markedDates?: { [key: string]: any };
  availableDates?: { date: string; allDay: boolean; startTime: string | null; endTime: string | null }[];
}

const Calendar: React.FC<CustomCalendarProps> = ({ availableDates, ...props }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: { marked: boolean; dotColor?: string; selectedColor?: string } }>({
    '2025-01-21': { marked: true, dotColor: '#00adf5' },
  });
  const [notes, setNotes] = useState<{ [key: string]: { startTime: string; endTime: string } }>({});
  const [friendNotes, setFriendNotes] = useState<{
    [key: string]: { startTime: string; endTime: string; username: string; icon: string }[];
  }>({});
   // フレンドデータ
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('supabase_user_id');

        if (storedUserId) {
          setUserId(storedUserId);
          fetchUserCalendarEvents(storedUserId);
          fetchFriendsCalendarEvents(storedUserId); // フレンドのスケジュールを取得
        } else {
          Alert.alert('ログインが必要です', 'この操作を行うにはログインしてください。');
        }
      } catch (err) {
        console.error('ユーザーIDの取得に失敗:', err);
      }
    };

    
    fetchUserId();
  }, []);

  const fetchUserCalendarEvents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_calendar_events')
        .select('date, startTime, endTime')
        .eq('user_id', userId);

      if (error) throw error;

      if (data) {
        const notesFromDb = data.reduce((acc, event) => {
          acc[event.date] = { startTime: event.startTime, endTime: event.endTime };
          return acc;
        }, {} as { [key: string]: { startTime: string; endTime: string } });

        setNotes(notesFromDb);
      }
    } catch (err) {
      console.error('ユーザースケジュールの取得エラー:', err);
    }
  };

  const fetchFriendsCalendarEvents = async (userId: string) => {
    try {
      // 自分が`user_id`または`friend_id`として保存されているエントリを取得
      const { data: friendEntries, error: friendEntriesError } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  
      if (friendEntriesError) throw friendEntriesError;
  
      // フレンドIDを抽出
      const friendIds = friendEntries.map(entry =>
        entry.user_id === userId ? entry.friend_id : entry.user_id
      );
  
      if (friendIds.length > 0) {
        // フレンドのスケジュールを取得
        const { data: friendEvents, error: eventsError } = await supabase
          .from('user_calendar_events')
          .select('user_id, date, startTime, endTime')
          .in('user_id', friendIds);
  
        if (eventsError) throw eventsError;

        if (friendEvents) {
          // フレンドの情報（名前とアイコン）を取得
          const { data: friendUsers, error: userError } = await supabase
            .from('users')
            .select('id, username, icon')
            .in('id', friendIds);
  
          if (userError) throw userError;
  
          // フレンドの予定とユーザー情報を結合
          const friendNotesFromDb = friendEvents.reduce((acc, event) => {
            const friendUser = friendUsers?.find(user => user.id === event.user_id);
  
            if (friendUser) {
              acc[event.date] = acc[event.date] || [];
              acc[event.date].push({
                startTime: event.startTime,
                endTime: event.endTime,
                username: friendUser.username,
                icon: friendUser.icon,
              });
            }
  
                    return acc;
          }, {} as { [key: string]: { startTime: string; endTime: string; username: string; icon: string }[] });
  
          setFriendNotes(friendNotesFromDb);
  
          // フレンドスケジュールを markedDates に反映
          const friendMarkedDates = friendEvents.reduce((acc, event) => {
            const startHour = moment(event.startTime, 'HH:mm').hours();
            let backgroundColor = '';
  
            // if (startHour >= 6 && startHour < 12) {
            //   backgroundColor = '#f29b7e'; // オレンジ: 6時～12時
            // } else if (startHour >= 12 && startHour < 18) {
            //   backgroundColor = '#83ccd2'; // 薄水色: 12時～18時
            // } else if (startHour >= 18 && startHour <= 24) {
            //   backgroundColor = '#b0a7d1'; // 紫: 18時～24時
            // }
  
            acc[event.date] = {
              ...acc[event.date],
              marked: true,
              selected: true,
              selectedColor: backgroundColor,
              dotColor: '#00adf5',
            };
  
            return acc;
          }, {} as { [key: string]: any });
  
          setMarkedDates(prev => ({ ...prev, ...friendMarkedDates }));
        }
      }
    } catch (err) {
      console.error('フレンドスケジュールの取得エラー:', err);
    }
  };
  

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  return (
    <View>
      <CalendarComponent
        {...(props as CalendarProps)}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#00adf5',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: 'gray',
          monthTextColor: 'black',
          indicatorColor: 'blue',
          textDayFontFamily: 'monospace',
          textMonthFontFamily: 'monospace',
          textDayHeaderFontFamily: 'monospace',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
        locale={'ja'}
      />

<Modal visible={modalVisible} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      <Text style={styles.modalTitle}>スケジュール詳細</Text>

      {/* フレンドの予定 */}
      {selectedDate && friendNotes[selectedDate]?.length > 0 ? (
        friendNotes[selectedDate].map((note, index) => (
          <View key={index} style={styles.noteContainer}>
            {/* 左側: ユーザー情報 */}
            <View style={styles.userInfo}>
                {note.icon ? (
                  <Image
                    source={{ uri: `${note.icon}?t=${new Date().getTime()}` }}
                    style={styles.userIcon}
                  />
                ) : (
                  <Image
                    source={require('../../assets/user_default_icon.png')}
                    style={styles.userIcon}
                  />
                )}
                <Text style={styles.userName}>{note.username}</Text>
              </View>

            {/* 右側: スケジュール情報 */}
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleText}>開始: {note.startTime}</Text>
              <Text style={styles.scheduleText}>終了: {note.endTime}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 10 }}>予定がありません</Text>
      )}
    </View>
  </View>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -5,
    right: 5,
    padding: 5,
  },
  closeButtonText: {
    color: '#333333',
    fontWeight: 'bold',
    fontSize: 30,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  noteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleInfo: {
    alignItems: 'flex-end',
    flex: 2,
  },
  scheduleText: {
    fontSize: 14,
    color: '#555',
  },
});


export default Calendar;
