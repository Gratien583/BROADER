import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useRoute,
  useFocusEffect,
  useNavigation,
  RouteProp,
} from "@react-navigation/native";
import { supabase } from "../supabaseClient";

type RootStackParamList = {
  AttributeSettings: { friendId: string };
  UserPage: { userId: string };
};

type AttributeSettingsProps = {
  friendId: string;
  onClose: () => void;
};

type AttributeSettingsRouteProp = RouteProp<
  RootStackParamList,
  "AttributeSettings"
>;

const AttributeSettings = ({
  friendId: propFriendId,
  onClose,
}: AttributeSettingsProps) => {
  const route = useRoute<AttributeSettingsRouteProp>();
  const routeFriendId = route.params?.friendId;
  const friendId = propFriendId || routeFriendId;
  const [attributes, setAttributes] = useState<
    { id: number; create_attributes: string }[]
  >([]);
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>([]);
  const [reporterUserId, setReporterUserId] = useState<string | null>(null);
  const navigation = useNavigation();
  const [userName, setUserName] = useState<string>("");
  const [userIcon, setUserIcon] = useState<string>("");

  useEffect(() => {
    if (!friendId) {
      console.error("friendIdが渡されていません");
      return;
    }
  }, [friendId]);

  // ログイン中のユーザーIDを取得する関数
  const fetchReporterUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem("supabase_user_id");
      setReporterUserId(userId);
    } catch (error) {
      console.error("Error fetching reporter user ID:", error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("users") // ユーザー情報を保持するテーブル
        .select("username, icon")
        .eq("id", friendId) // friendId で指定されたユーザーを検索
        .single();

      if (error) {
        console.error(
          "エラー: ユーザー情報の取得に失敗しました:",
          error.message
        );
        return;
      }

      setUserName(data?.username || "不明なユーザー");
      setUserIcon(data?.icon || "");
    } catch (error) {
      console.error(
        "エラー: ユーザー情報の取得中に予期しないエラーが発生しました:",
        error
      );
    }
  };

  // 自分が作成した属性の一覧を取得する関数
  const fetchAttributes = async () => {
    if (!reporterUserId) return; // ログイン中のユーザーIDが取得できていない場合は終了

    try {
      const { data, error } = await supabase
        .from("friend_attributes")
        .select("id, create_attributes")
        .eq("user_id", reporterUserId);

      if (error) {
        console.error("Error fetching attributes:", error);
        return;
      }

      // 自分の属性リストをセット
      setAttributes(data || []);
    } catch (error) {
      console.error("Error fetching attributes:", error);
    }
  };

  // 初期選択状態を取得する関数
  const fetchInitialAttributes = async () => {
    try {
      if (!reporterUserId || !friendId) return;

      const { data: friendData, error: fetchError } = await supabase
        .from("friends")
        .select("user_id, friend_id, attribute1, attribute2")
        .or(
          `and(user_id.eq.${reporterUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${reporterUserId})`
        );

      if (fetchError) {
        console.error(
          "エラー: friends テーブルのデータ取得中に失敗しました:",
          fetchError.message
        );
        return;
      }

      if (!friendData || friendData.length === 0) {
        console.log("エラー: 該当する友達データが見つかりません");
        return;
      }

      const friend = friendData[0];
      console.log("取得した友達データ:", friend);

      const initialSelectedAttributes = new Set<number>();

      if (friend.user_id === reporterUserId) {
        // attribute1をパースしてセット
        friend.attribute1?.forEach((attr: string) => {
          initialSelectedAttributes.add(parseInt(attr, 10));
        });
      } else if (friend.friend_id === reporterUserId) {
        // attribute2をパースしてセット
        friend.attribute2?.forEach((attr: string) => {
          initialSelectedAttributes.add(parseInt(attr, 10));
        });
      }

      const attributesArray = Array.from(initialSelectedAttributes);
      console.log("再取得した選択中の属性ID:", attributesArray);

      // ステートにセット
      setSelectedAttributes(attributesArray);
    } catch (error) {
      console.error(
        "エラー: 初期選択状態の取得中に予期しないエラーが発生しました:",
        error
      );
    }
  };

  // 属性を保存する関数
  const saveAttributes = async () => {
    try {
      // reporterUserId または friendId が null の場合のエラーログ
      if (!reporterUserId || !friendId) {
        console.log("エラー: reporterUserId または friendId が null です");
        console.log("reporterUserId:", reporterUserId);
        console.log("friendId:", friendId);
        return;
      }

      console.log("選択された属性 (保存前):", selectedAttributes.map(String));

      // 修正したクエリを適用
      const { data: friendData, error: fetchError } = await supabase
        .from("friends")
        .select("user_id, friend_id, attribute1, attribute2")
        .or(
          `and(user_id.eq.${reporterUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${reporterUserId})`
        );

      if (fetchError) {
        console.log(
          "エラー: friends テーブルのデータ取得中に失敗しました:",
          fetchError.message
        );
        console.log("Supabase クエリ:", {
          user_id: reporterUserId,
          friend_id: friendId,
        });
        return;
      }

      if (!friendData || friendData.length === 0) {
        console.log("エラー: 該当する友達データが見つかりません");
        console.log("クエリ結果:", friendData);
        return;
      }

      const friend = friendData[0];
      console.log("取得した友達データ:", friend);

      if (friend.user_id === reporterUserId) {
        console.log("自分が user_id 側として attribute1 を更新します");
        const { error: updateError } = await supabase
          .from("friends")
          .update({ attribute1: selectedAttributes.map(String) })
          .eq("user_id", reporterUserId)
          .eq("friend_id", friendId);

        if (updateError) {
          console.log(
            "エラー: attribute1 の更新に失敗しました:",
            updateError.message
          );
          return;
        }
        console.log("attribute1 の更新が正常に完了しました");
      } else if (friend.friend_id === reporterUserId) {
        console.log("自分が friend_id 側として attribute2 を更新します");
        const { error: updateError } = await supabase
          .from("friends")
          .update({ attribute2: selectedAttributes.map(String) })
          .eq("user_id", friendId)
          .eq("friend_id", reporterUserId);

        if (updateError) {
          console.log(
            "エラー: attribute2 の更新に失敗しました:",
            updateError.message
          );
          return;
        }
        console.log("attribute2 の更新が正常に完了しました");
      } else {
        console.log("エラー: 条件に合致するレコードが見つかりません");
        console.log("friend.user_id:", friend.user_id);
        console.log("friend.friend_id:", friend.friend_id);
        console.log("reporterUserId:", reporterUserId);
      }

      console.log("属性の保存が正常に完了しました");

      // 保存後の動作
      if (Platform.OS === "web") {
        console.log("Web 環境: モーダルを閉じます");
        onClose();
      } else {
        console.log("モバイル環境: 前の画面に戻ります");
        navigation.goBack();
      }
    } catch (error) {
      console.error("予期しないエラー:", error);
      console.error("エラーの詳細:", {
        reporterUserId,
        friendId,
        selectedAttributes,
      });
    }
  };

  useEffect(() => {
    fetchReporterUserId();
    fetchUserDetails(); // ユーザー情報を取得
  }, [friendId]);

  useFocusEffect(
    React.useCallback(() => {
      if (reporterUserId) {
        fetchInitialAttributes();
        fetchAttributes();
      }
    }, [reporterUserId, friendId])
  );

  // 属性を選択・解除する関数
  const toggleAttributeSelection = (attributeId: number) => {
    if (selectedAttributes.includes(attributeId)) {
      setSelectedAttributes((prev) => prev.filter((id) => id !== attributeId));
    } else {
      setSelectedAttributes((prev) => [...prev, attributeId]);
    }
  };

  const renderAttributeItem = ({
    item,
  }: {
    item: { id: number; create_attributes: string };
  }) => (
    <TouchableOpacity
      style={[
        styles.attributeItem,
        selectedAttributes.includes(item.id) && styles.selectedItem,
      ]}
      onPress={() => toggleAttributeSelection(item.id)}
    >
      <Text
        style={[
          styles.attributeText,
          selectedAttributes.includes(item.id) && styles.selectedText,
        ]}
      >
        {item.create_attributes}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.userHeaderTouchable}
        onPress={() => {
          navigation.navigate("UserPage", {
            userId: friendId,
          });

          if (Platform.OS === "web") {
            setTimeout(() => {
              onClose(); // Web環境では遷移後にモーダルを閉じる
            }, 100); // 適切な遅延を設定
          }
        }}
      >
        {userIcon ? (
          <Image
            source={{ uri: `${userIcon}?t=${new Date().getTime()}` }} // 常に最新の画像を取得
            style={styles.userIcon}
          />
        ) : (
          <Image
            source={require("../../assets/user_default_icon.png")} // デフォルトアイコン
            style={styles.userIcon}
          />
        )}
        <Text style={styles.userName}>{userName}</Text>
      </TouchableOpacity>

      <FlatList
        data={attributes}
        renderItem={renderAttributeItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveAttributes}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AttributeSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    ...(Platform.OS === "web" && {
      width: "90%",
      maxWidth: 600,
      borderRadius: 10,
      alignSelf: "center",
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  attributeItem: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedItem: {
    backgroundColor: "#ff00a1",
    borderColor: "#ff0081",
  },
  attributeText: {
    fontSize: 16,
  },
  selectedText: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#040045",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#ddd",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userHeaderTouchable: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
});
