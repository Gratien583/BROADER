import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../supabaseClient';

// 型定義
type Report = {
  id: number;
  report_reason: string;
  reported_user_id: string;
  users: { username: string; id: string };
  reportCount: number;
};

type UserInfo = {
  id: string;
  username: string;
  bio: string;
};

type Message = {
  id: number;
  message: string;
  time: string;
};

type Event = {
  id: number;
  title: string;
};

const AdminPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // useEffectで報告情報を取得
  useEffect(() => {
    const fetchReports = async () => {
        // 累計数を計算するために全ての報告データを取得
        const reportCounts: { [key: string]: number } = {};
      
        const { data, error } = await supabase
          .from('user_reports')
          .select('id, report_reason, reported_user_id, is_confirmed, users!user_reports_reported_user_id_fkey(username, id)')
          .order('created_at', { ascending: false });
      
        if (error) {
          console.error('報告情報取得エラー:', error);
        } else {
          // 累計数を計算（確認済みも含む）
          data.forEach((report: any) => {
            reportCounts[report.reported_user_id] = (reportCounts[report.reported_user_id] || 0) + 1;
          });
      
          // 各報告に累計数を追加
          const reportsWithCount = data.map((report: any) => ({
            ...report,
            reportCount: reportCounts[report.reported_user_id],
          }));
      
          // 未確認の報告のみ表示に設定
          setReports(reportsWithCount.filter((report) => !report.is_confirmed) as Report[]);
        }
      };
      

    fetchReports();
  }, []);

  // ユーザー情報を取得
  const fetchUserDetails = async (userId: string) => {
    try {
      if (selectedUser === userId) {
        // すでに選択されているユーザーがクリックされた場合、詳細を隠す
        setSelectedUser(null);
        setUserInfo(null);
        setChatHistory([]);
        setEvents([]);
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(); // 単一のユーザー情報を取得
      if (userError) {
        console.error("ユーザー情報取得エラー:", userError);
        return;
      }
      setUserInfo(user as UserInfo);
      setSelectedUser(userId);

      // メッセージ履歴を取得
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error("メッセージ履歴取得エラー:", messagesError);
        return;
      }

      // メッセージを整形して時間も追加
      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        message: msg.content,
        time: new Date(msg.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) + 
              ' ' + 
              new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }));
      setChatHistory(formattedMessages as Message[]);

      // イベント情報を取得
      const { data: eventsData, error: eventsError } = await supabase
        .from('articles')
        .select('*')
        .eq('host_user_id', userId)
        .order('event_date', { ascending: false });
      if (eventsError) throw eventsError;
      setEvents(eventsData as Event[]);

    } catch (error) {
      console.error('ユーザー詳細取得エラー:', error);
    }
  };

  // ユーザーをBANする処理
  const banUser = async (userId: string, duration: string) => {
    let bannedUntil: Date;

    // BANの期間を設定
    switch (duration) {
      case '1_week':
        bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1週間
        break;
      case '1_month':
        bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1ヶ月
        break;
      case '6_months':
        bannedUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6ヶ月
        break;
      case 'permanent':
        bannedUntil = new Date(9999, 11, 31); // 永久BAN
        break;
      default:
        console.error('無効なBAN期間');
        return;
    }

    // Web用にwindow.confirm()に変更
    const confirmation = window.confirm(
      `${duration === 'permanent' ? '永久BAN' : `${duration}の期間でユーザーをBANしますか？`}`
    );

    if (!confirmation) {
      console.log("BAN操作がキャンセルされました");
      return; // キャンセルされた場合、処理を中止
    }

    // ここでDBの更新を行う
    const { error } = await supabase
      .from('users')
      .update({ banned_until: bannedUntil.toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('BANエラー:', error);
      //@ts-ignore
      window.alert('エラー', 'ユーザーのBANに失敗しました。');
    } else {
      //@ts-ignore
      window.alert('BAN完了', `${duration === 'permanent' ? '永久BAN' : `${duration}の期間でユーザーをBAN`} しました。`);
    }
  };

// 報告を確認済みにする処理
const confirmReport = async (reportId: number) => {
    // Web用の確認ダイアログを表示
    const confirmation = window.confirm("この報告を確認済みにしますか？");
  
    if (!confirmation) {
      console.log("確認操作がキャンセルされました");
      return; // キャンセルされた場合、処理を中止
    }
  
    const { error } = await supabase
      .from('user_reports')
      .update({ is_confirmed: true }) // 確認済みを示すカラムを更新
      .eq('id', reportId);
  
    if (error) {
      console.error('確認エラー:', error);
    } else {
      setReports(reports.filter((report) => report.id !== reportId)); // 確認済みの報告を一覧から削除
      window.alert("確認完了しました"); // 確認完了のメッセージ
    }
  };
  
  
  

  return (
    <View style={styles.backgroundContainer}>
    <View style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.header}>管理者ページ</Text>
      <FlatList
            data={reports}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.reportContainer}>
                <Text style={styles.reportText}>報告対象: {item.users.username}</Text>
                <Text style={styles.reasonText}>理由: {item.report_reason}</Text>
                <Text style={styles.reportCount}>累計 {item.reportCount} 回</Text> 
                <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => fetchUserDetails(item.reported_user_id)}
                >
                    <Text style={styles.buttonText}>
                    {selectedUser === item.reported_user_id ? '詳細を隠す' : '詳細を見る'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => confirmReport(item.id)}
      >
        <Text style={styles.buttonText}>確認完了</Text>
      </TouchableOpacity>
                </View>
            )}
            />
      {selectedUser && userInfo ? (
        <View style={styles.userDetails}>
          <Text style={styles.userHeader}>ユーザー情報</Text>
          <Text style={styles.infoText}>名前: {userInfo.username}</Text>
          <Text style={styles.infoText}>プロフィール: {userInfo.bio || "プロフィール情報なし"}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.banButton}
              onPress={() => banUser(selectedUser, '1_week')}
            >
              <Text style={styles.buttonText}>1週間Ban</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.banButton}
              onPress={() => banUser(selectedUser, '1_month')}
            >
              <Text style={styles.buttonText}>1ヶ月Ban</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.banButton}
              onPress={() => banUser(selectedUser, '6_months')}
            >
              <Text style={styles.buttonText}>半年Ban</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.banButton}
              onPress={() => banUser(selectedUser, 'permanent')}
            >
              <Text style={styles.buttonText}>永久Ban</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userHeader}>チャット履歴</Text>
          <FlatList
            data={chatHistory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.messageTime}>{item.time}</Text>
                </View>
            )}
            />
          <Text style={styles.userHeader}>投稿イベント</Text>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Text style={styles.eventText}>{item.title}</Text>}
          />
        </View>
) : null}
    </View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
    backgroundContainer: {
        flex: 1,
        backgroundColor: '#f0f4f8',
        //@ts-ignore
        minHeight: '100vh',
      },
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
      },
      content: {
        width: '100%',
        maxWidth: 1200,
      },
    header: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#3e3e3e',
      marginBottom: 20,
      textAlign: 'center',
    },
    reportContainer: {
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        borderLeftWidth: 6,
        borderLeftColor: '#007bff',
        position: 'relative', 
      },
    reportText: {
      fontSize: 17,
      color: '#4a4a4a',
      fontWeight: '500',
      marginBottom: 5,
    },
    reasonText: {
      fontSize: 15,
      color: '#6a6a6a',
      marginBottom: 10,
    },
    reportCount: {
        position: 'absolute',
        top: 10,
        right: 10,
        fontSize: 14,
        color: '#ff4d4d',
        fontWeight: 'bold',
      },
    userDetails: {
      marginTop: 20,
      padding: 20,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    },
    userHeader: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#3e3e3e',
      marginBottom: 10,
    },
    infoText: {
      fontSize: 16,
      color: '#4a4a4a',
      marginVertical: 6,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 15,
    },
    detailButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginRight: 'auto', 
        backgroundColor: '#007bff',
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        minWidth: 80, 
      },
    buttonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '600',
    },
    banButton: {
      padding: 10,
      backgroundColor: '#ff4d4d',
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      flex: 0.45,
      marginHorizontal: 5,
    },
    messageText: {
        fontSize: 15,
        color: '#4e4e4e',
        flex: 1,
      },
    eventText: {
      fontSize: 15,
      color: '#444',
      backgroundColor: '#f0f0f0',
      padding: 10,
      borderRadius: 6,
      marginBottom: 8,
    },
    loadingText: {
      fontSize: 17,
      color: '#888',
      textAlign: 'center',
      marginTop: 20,
      fontStyle: 'italic',
    },
    messageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#e0f0ff',
        borderRadius: 6,
        marginBottom: 8,
      },
      messageTime: {
        fontSize: 12,
        color: '#999',
        marginLeft: 10,
        alignSelf: 'flex-end',
      },
      confirmButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        padding: 5,
        backgroundColor: '#28a745',
        borderRadius: 5,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
      },
  });
  

export default AdminPage;
