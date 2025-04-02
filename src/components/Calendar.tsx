import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { Calendar as CalendarComponent, LocaleConfig } from 'react-native-calendars';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

moment.locale('ja');

LocaleConfig.locales['ja'] = {
  monthNames: [
    '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月',
  ],
  monthNamesShort: [
    '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月',
  ],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
};
LocaleConfig.defaultLocale = 'ja';

interface CustomCalendarProps {
  availableDates?: { date: string; allDay: boolean; startTime: string | null; endTime: string | null }[];
}

const Calendar: React.FC<CustomCalendarProps> = ({ availableDates }) => {
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [notes, setNotes] = useState<{ [key: string]: { startTime: string; endTime: string } }>({});
  const [userId, setUserId] = useState<string | null>(null); // ユーザーIDの状態管理
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserCalendarEvents = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('supabase_user_id');
        if (!storedUserId) {
          Alert.alert('エラー', 'ログインが必要です。');
          return;
        }
        setUserId(storedUserId);

        const { data, error } = await supabase
          .from('user_calendar_events')
          .select('date, startTime, endTime')
          .eq('user_id', storedUserId);

        if (error) {
          console.error('データ取得エラー:', error);
          return;
        }

        if (data) {
          const notesFromDb: { [key: string]: { startTime: string; endTime: string } } = {};
          const markedDatesFromDb: { [key: string]: any } = {};

          data.forEach(event => {
            const { date, startTime, endTime } = event;
            notesFromDb[date] = { startTime, endTime };

            const startHour = parseInt(startTime.split(':')[0], 10);
            const backgroundColor =
              startHour >= 6 && startHour <= 12
                ? '#f29b7e'
                : startHour >= 12 && startHour <= 18
                ? '#83ccd2'
                : '#b0a7d1';

            markedDatesFromDb[date] = {
              selected: true,
              selectedColor: backgroundColor,
              marked: true,
              dotColor: '#003933',
            };
          });

          setNotes(notesFromDb);
          setMarkedDates(markedDatesFromDb);
        }
      } catch (err) {
        console.error('スケジュール取得エラー:', err);
      }
    };

    fetchUserCalendarEvents();
  }, []);

  const handleDayPress = (day: { dateString: string }) => {
    if (userId) {
      navigation.navigate('ScheduleDetail', {
        date: day.dateString,
        userId, // 必ず userId を渡す
      });
    } else {
      Alert.alert('エラー', 'ユーザーIDが存在しません。');
    }
  };

  return (
    <View>
      <CalendarComponent
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
        }}
        locale="ja"
      />
    </View>
  );
};

export default Calendar;
