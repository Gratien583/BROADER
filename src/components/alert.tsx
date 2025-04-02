import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseClient";
import { LinearGradient } from "expo-linear-gradient";

type Notification = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  type?: string;
  senderUserId?: string;
  iconUrl?: string | null;
  isRead?: boolean;
};

// 時間表示用の関数
const formatNotificationTime = (receivedAt: string): string => {
  const receivedDate = new Date(receivedAt);
  const currentDate = new Date();
  const diffInMinutes = Math.floor(
    (currentDate.getTime() - receivedDate.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return `1日前`;
  } else if (diffInDays === 2) {
    return `2日前`;
  } else {
    return receivedDate.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
};

const Alert = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // アイコン取得関数
  const fetchSenderIcon = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("icon")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(`ユーザーID ${userId} のアイコン取得エラー:`, error);
        return null;
      }
      return data.icon || null;
    } catch (error) {
      console.error(
        `Unexpected error fetching icon for userId ${userId}:`,
        error
      );
      return null;
    }
  };

  // 通知を取得し、未読状態を管理
  const fetchNotifications = async () => {
    try {
      const data = await AsyncStorage.getItem("notifications");
      console.log("ローカルストレージから取得した通知:", data);

      let notifications: Notification[] = data ? JSON.parse(data) : [];

      // メッセージタイプを除外
      notifications = notifications.filter(
        (notification) => notification.type !== "message"
      );

      // 未読状態を取得
      const readNotifications = await AsyncStorage.getItem("readNotifications");
      const readIds: string[] = readNotifications
        ? JSON.parse(readNotifications)
        : [];

      const notificationsWithIcons = await Promise.all(
        notifications.map(async (notification) => {
          const iconUrl = notification.senderUserId
            ? await fetchSenderIcon(notification.senderUserId)
            : null;
          return {
            ...notification,
            iconUrl,
            isRead: readIds.includes(notification.id),
          };
        })
      );

      const sortedNotifications = notificationsWithIcons.sort(
        (a, b) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("通知の取得中にエラーが発生:", error);
    }
  };

  // 通知を既読にする関数
  const markAsRead = async (id: string) => {
    try {
      const readNotifications = await AsyncStorage.getItem("readNotifications");
      const readIds: string[] = readNotifications
        ? JSON.parse(readNotifications)
        : [];

      if (!readIds.includes(id)) {
        readIds.push(id);
        await AsyncStorage.setItem(
          "readNotifications",
          JSON.stringify(readIds)
        );
      }

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("通知を既読にする際にエラーが発生しました:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* グラデーション背景 */}
      <LinearGradient
        colors={["#ff00a1", "#040045"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.overlay} />
      <FlatList<Notification>
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationItem,
              !item.isRead && styles.unreadNotification,
            ]}
            onPress={() => markAsRead(item.id)}
          >
            <Image
              source={
                item.iconUrl
                  ? { uri: `${item.iconUrl}?timestamp=${new Date().getTime()}` }
                  : require("../../assets/user_default_icon.png")
              }
              style={[styles.icon, !item.iconUrl && styles.defaultIcon]}
            />
            <View style={styles.textContainer}>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.timestamp}>
                {formatNotificationTime(item.receivedAt)}
              </Text>
            </View>
            {!item.isRead && <Text style={styles.unreadBadge}>未読</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  contentContainer: {
    padding: 0,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  unreadNotification: {
    backgroundColor: "rgba(255, 255, 0, 0.1)",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultIcon: {
    resizeMode: "contain",
  },
  textContainer: {
    flex: 1,
  },
  body: {
    fontSize: 15,
    color: "#fff",
  },
  timestamp: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 5,
  },
  unreadBadge: {
    backgroundColor: "red",
    color: "white",
    fontSize: 12,
    padding: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});

export default Alert;
