import React, { useEffect, useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseClient";
import QRCodeComponent from "./QRCodeComponent";
import SearchUser from "./SearchUser";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import SideBar from "./SideBar";
import { LinearGradient } from "expo-linear-gradient";
import AttributeList from "./AttributeList";
import AttributeSettings from "./AttributeSettings";
import { sendPushNotification } from "../utils/sendPushNotification";

const Tab = createMaterialTopTabNavigator();

const FriendList = ({ userId }: { userId: string | null }) => {
  const [list, setList] = useState<
    {
      id: string;
      username: string;
      icon: string | null;
      attributes: string[];
    }[]
  >([]);
  const [userIdsListArray, setUserIdsListArray] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [attributeIds, setAttributeIds] = useState<number[]>([]); // AttricleListから受け取るデータ
  const navigation = useNavigation();

  //  AttricleListコンポーネントからデータを受け取るコールバック関数
  const handleAttributeIdsChange = (ids: number[]) => {
    setAttributeIds(ids);
    console.log("リスト更新用属性情報「ID」: ", ids);
  };

  useEffect(() => {
    const fetchFriendList = async () => {
      console.log("フレンドリスト取得関数動作");
      console.log("useEffect内のフレンドリストソート用の要素; " + attributeIds);

      try {
        // Supabaseクエリを構築
        const { data, error } = await supabase
          .from("friends")
          .select("user_id, friend_id, attribute1, attribute2") // 必要なカラムを取得
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`) // 自分が関係する行を取得
          .eq("status", 1); // 承認済みの関係に限定

        if (error) {
          console.error("Error fetching friends:", error);
          return;
        }

        let filteredFriends;

        if (attributeIds.length === 0) {
          // `attributeIds` が空なら全データをそのまま使用
          filteredFriends = data;
        } else {
          // `attributeIds` が指定されている場合のみフィルタリングを適用
          filteredFriends = data.filter((item) => {
            if (item.user_id === userId) {
              // 自分が user_id 側の場合は attribute1 を利用してフィルタ
              return attributeIds.some((attrId) =>
                item.attribute1?.includes(String(attrId))
              );
            } else {
              // 自分が friend_id 側の場合は attribute2 を利用してフィルタ
              return attributeIds.some((attrId) =>
                item.attribute2?.includes(String(attrId))
              );
            }
          });
        }

        // フィルタ結果が空の場合は全てのユーザーを非表示
        if (!filteredFriends || filteredFriends.length === 0) {
          console.log(
            "選択した属性に一致するフレンドがいません。全て非表示にします。"
          );
          setUserIdsListArray([]); // リストを空にする
          setList([]); // 表示用リストも空にする
          return;
        }

        const friendsArray = filteredFriends.map((item) =>
          item.user_id === userId ? item.friend_id : item.user_id
        );

        console.log("Filtered Friends:", friendsArray);
        setUserIdsListArray(friendsArray); // フィルタ後のリストを保存
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    fetchFriendList();
    // friendsテーブルの変更を監視
    const subscription = supabase
      .channel("List-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // 作成、削除、更新のすべてのイベントを監視
          schema: "public",
          table: "friends",
        },
        () => {
          console.log("フレンドリストにてBD変化を検知 関数呼び出し");
          fetchFriendList(); // ステータスを再度フェッチ
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [attributeIds]);

  // UUIDからユーザーネームとアイコンURLを取得
  useEffect(() => {
    const fetchUserIdsAndUsernames = async (idArray: string[]) => {
      try {
        // usersテーブルからid, username, iconを取得
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, icon")
          .in("id", idArray);

        if (usersError) {
          console.error("Error fetching user ids and usernames:", usersError);
          return;
        }

        // friendsテーブルから属性情報を取得
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("user_id, friend_id, attribute1, attribute2")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq("status", 1); // 承認済みの関係に限定

        if (friendsError) {
          console.error("Error fetching friend attributes:", friendsError);
          return;
        }

        // friend_attributesテーブルから属性名を取得
        const { data: attributesData, error: attributesError } = await supabase
          .from("friend_attributes")
          .select("id, create_attributes");

        if (attributesError) {
          console.error("Error fetching attribute names:", attributesError);
          return;
        }

        // IDから属性名を検索するマップを作成
        const attributesMap = attributesData.reduce((map, attr) => {
          map[attr.id] = attr.create_attributes;
          return map;
        }, {} as Record<number, string>);

        // usersDataに属性情報をマッピング
        const updatedList = usersData.map((user) => {
          // friendデータから対応するユーザーの属性情報を検索
          const friendData = friendsData.find(
            (friend) =>
              (friend.user_id === userId && friend.friend_id === user.id) ||
              (friend.friend_id === userId && friend.user_id === user.id)
          );

          // 自分がuser_idかfriend_idかに応じて適切な属性IDを取得し、属性名に変換
          const attributes =
            friendData?.user_id === userId
              ? (friendData?.attribute1 || []).map(
                  //@ts-ignore
                  (id) => attributesMap[Number(id)] || `ID:${id}`
                )
              : (friendData?.attribute2 || []).map(
                  //@ts-ignore
                  (id) => attributesMap[Number(id)] || `ID:${id}`
                );

          return {
            id: user.id,
            username: user.username,
            icon: user.icon || null,
            attributes: attributes,
          };
        });

        // 非同期処理が完了した後にリストを更新
        setList(updatedList);
      } catch (error) {
        console.error("Error in fetchUserIdsAndUsernames:", error);
      }
    };

    if (userIdsListArray.length > 0) {
      fetchUserIdsAndUsernames(userIdsListArray);
    }
  }, [userIdsListArray, userId]);

  const openAttributeModal = (friendId: string) => {
    setSelectedFriendId(friendId);
    setModalVisible(true);
  };

  const closeAttributeModal = () => {
    setModalVisible(false);
  };

  const renderFriendItem = ({
    item,
    index,
  }: {
    item: {
      id: string;
      username: string;
      icon: string | null;
      attributes: string[];
    };
    index: number;
  }) => {
    console.log("レンダリングするアイテム:", item);

    // 属性を3つに制限し、それ以上は "..." を追加
    const displayAttributes =
      item.attributes.length > 3
        ? [...item.attributes.slice(0, 3), "..."]
        : item.attributes;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.listItem,
          index === 0 ? { marginTop: 10 } : { marginTop: 0 },
        ]}
        onPress={() => {
          console.log("フレンド選択:", item.id);
          if (Platform.OS === "web") {
            openAttributeModal(item.id);
          } else {
            //@ts-ignore
            navigation.navigate("AttributeSettings", { friendId: item.id });
          }
        }}
      >
        <Image
          source={
            item.icon
              ? { uri: item.icon }
              : require("../../assets/user_default_icon.png")
          }
          //@ts-ignore
          style={styles.avatar}
        />
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.attributes}>
          {displayAttributes.length > 0
            ? displayAttributes.join(", ")
            : "属性なし"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#ff00a1", "#040045"]}
      style={styles.backgroundGradient} // グラデーション全体のスタイル
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      
    >
      <View style={styles.attributeListContainer}>
        <AttributeList onAttributeIdsChange={handleAttributeIdsChange} />
      </View>

      <View style={styles.friendListContainer}>
        <FlatList
          data={list} // 表示するデータ
          renderItem={renderFriendItem} // 各フレンドのレンダリング
          keyExtractor={(item) => item.id.toString()} // ユニークなキー
          contentContainerStyle={styles.listContainer} // 内側のスタイル
        />
      </View>
      {/* AttributeSettings モーダル */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeAttributeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 右上の閉じるボタン */}
            <TouchableOpacity
              style={styles.AttributecloseButton}
              onPress={closeAttributeModal}
            >
              <Text style={styles.AttributecloseButtonText}>×</Text>
            </TouchableOpacity>

            {selectedFriendId ? (
              <AttributeSettings
                friendId={selectedFriendId}
                onClose={closeAttributeModal}
              />
            ) : (
              <Text>友達IDが無効です</Text>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const AddFriend = ({ userId }: { userId: string | null }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { id: string; username: string; icon: string | null }[]
  >([]);

  // 検索クエリが変更されるたびにSupabaseでユーザーを検索
  useEffect(() => {
    if (searchQuery.length > 0) {
      const fetchUsers = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, icon")
          .ilike("username", `%${searchQuery}%`); // 検索クエリに一致するユーザー名を取得

        if (error) {
          console.error("Error fetching users:", error);
          return;
        }

        setSuggestions(data || []); // サジェストとして表示するユーザーリストをセット
      };

      fetchUsers();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  // 検索結果のレンダリング
  const renderSuggestion = ({
    item,
    index,
  }: {
    item: { id: string; username: string; icon: string | null };
    index: number;
  }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.listItem,
        index === 0 ? { marginTop: 0 } : { marginTop: 0 },
      ]}
      onPress={() => {
        //@ts-ignore
        navigation.navigate("UserPage", { userId: item.id });
      }}
    >
      <Image
        source={
          item.icon
            ? { uri: item.icon }
            : require("../../assets/user_default_icon.png")
        }
        //@ts-ignore
        style={styles.avatar}
      />
      <Text style={styles.userName}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#ff00a1", "#040045"]}
      style={styles.container} // グラデーション全体のスタイル
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {Platform.OS === "web" ? (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ユーザーを検索"
            placeholderTextColor="#fff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      ) : (
        <View style={styles.fixedHeader}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.qrButton}
              //@ts-ignore
              onPress={() => navigation.navigate("QRCodeComponent", { userId })}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={50}
                color="#fff"
              />
              <Text style={styles.qrButtonText}>QRコード</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              //@ts-ignore
              onPress={() => navigation.navigate("SearchUser", { userId })}
            >
              <MaterialCommunityIcons name="magnify" size={50} color="#fff" />
              <Text style={styles.searchButtonText}>検索</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* サジェストリスト */}
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          style={styles.suggestionList}
        />
      )}
    </LinearGradient>
  );
};

const PendingList = ({
  userId,
  width,
}: {
  userId: string | null;
  width: number;
}) => {
  // サイドバーの幅を決定
  // const sidebarWidth = Platform.OS === 'web' ? (width < 748 ? 60 : 250) : 0;
  //申請中リスト   pendinglistないに申請中も入れることにした
  const [Applications, setApplications] = useState<
    { id: string; username: string }[]
  >([]);
  const [userIdsApplicationsArray, setUserIdsApplicationsArray] = useState<
    string[]
  >([]); //保留中のフレンドuuidからユーザネームを取得の際に利用
  // 申請中のuuidを取得
  useEffect(() => {
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", userId) // 自分のUUIDが user_id にある
        .eq("status", 0); // ステータスが 0 （保留中）

      if (error) {
        console.error(
          "Error fetching Applications friend requests received:",
          error
        );
      } else {
        console.log("Applications friend requests received:", data);
        const userIdsArray = data.map((item) => item.friend_id);
        setUserIdsApplicationsArray(userIdsArray);
      }
    };
    fetchApplications();
    // friendsテーブルの変更を監視
    const subscription = supabase
      .channel("Applications-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // 作成、削除、更新のすべてのイベントを監視
          schema: "public",
          table: "friends",
        },
        () => {
          console.log("DBの変更を確認");
          fetchApplications(); // ステータスを再度フェッチ
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  //uuidからユーザネームを取得
  useEffect(() => {
    const fetchUserIdsAndUsernames = async (idArray: string[]) => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username") // idとusernameの両方を取得
        .in("id", idArray); // userIdsArrayに含まれるidでフィルタリング

      if (error) {
        console.error("Error fetching user ids and usernames:", error);
        return [];
      }

      // id（UUID）とusernameのペアをオブジェクト形式で返す
      setApplications(
        data.map((user) => ({ id: user.id, username: user.username }))
      );
      console.log(
        data.map((user) => ({ id: user.id, username: user.username }))
      );
    };
    fetchUserIdsAndUsernames(userIdsApplicationsArray);
  }, [userIdsApplicationsArray]);

  //ここから保留中リスト
  const navigation = useNavigation();
  const [pending, setPending] = useState<{ id: string; username: string }[]>(
    []
  );
  const [userIdsPendingArray, setUserIdsPendingArray] = useState<string[]>([]); //保留中のフレンドuuidからユーザネームを取得の際に利用

  const handleApprove = async (friendId: string) => {
    //friendIdはDBでのuser_idと思われます
    // 承認処理
    console.log(`Approve ${friendId}`);
    const { data, error } = await supabase
      .from("friends")
      .update({ status: 1 }) // statusを1に設定
      .eq("user_id", friendId)
      .eq("friend_id", userId);
    //ここから下に承認通知処理　　通知は変数userIdに対して行う（多分）

    // 承認通知の送信
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("pushNotificationToken, username")
        .eq("id", friendId)
        .single();

      const { data: ownData, error: ownError } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (userError || ownError) {
        console.error(
          "Error fetching usernames or notification token:",
          userError || ownError
        );
        return;
      }

      const notificationBody = `${ownData.username}さんがフレンドリクエストを承認しました`;

      if (userData.pushNotificationToken) {
        console.log("Sending notification with approval type");
        sendPushNotification(userData.pushNotificationToken, notificationBody, {
          senderUserId: userId || "",
          type: "approved", // リクエストのタイプを追加
        });
      } else {
        console.warn("Push notification token is not available");
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }

    //ここから下に個人チャット作成処理
    try {
      const { data: existingChatRoom, error: checkError } = await supabase
        .from("personal_chats")
        .select("id")
        .or(
          `and(host_user_id.eq.${userId},receiver_user_id.eq.${friendId}),and(host_user_id.eq.${friendId},receiver_user_id.eq.${userId})`
        )
        .limit(1);

      if (checkError) {
        console.error("Error checking existing chat room:", checkError);
        return;
      }

      // 既存のチャットルームがない場合のみ新しく作成
      if (existingChatRoom && existingChatRoom.length === 0) {
        const { data: chatData, error: chatError } = await supabase
          .from("personal_chats")
          .insert([
            {
              host_user_id: userId, // 自分のユーザーIDをホストとして設定
              receiver_user_id: friendId, // フレンドのユーザーIDを受信者として設定
              created_at: new Date().toISOString(),
            },
          ]);

        if (chatError) {
          console.error("Error creating chat room:", chatError);
          return;
        }

        console.log("Chat room created successfully:", chatData);
      } else {
        console.log("Chat room already exists, no new room created.");
      }
    } catch (error) {
      console.error("Failed to check or create chat room:", error);
    }
  };
  const handleReject = async (friendId: string) => {
    // 拒否処理をここに追加
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("user_id", friendId)
      .eq("friend_id", userId);

    if (error) {
      console.error("Error deleting friend relationship:", error);
    } else {
      console.log("Friend relationship deleted successfully.");
    }
  };

  // 保留中のuuidを取得
  useEffect(() => {
    const fetchPending = async () => {
      console.log("保留中の取得関数動作");
      const { data, error } = await supabase
        .from("friends")
        .select("*") // 必要に応じてカラムを指定できます
        .eq("friend_id", userId) // 自分が受け取ったフレンドリクエストを取得
        .eq("status", 0); // ステータスが保留中（0）のもの

      if (error) {
        console.error(
          "Error fetching pending friend requests received:",
          error
        );
      } else {
        console.log("Pending friend requests received:", data);
        const userIdsArray = data.map((item) => item.user_id);
        console.log("保留中のhook" + userIdsArray);
        setUserIdsPendingArray(userIdsArray);
      }
    };
    fetchPending();
    // friendsテーブルの変更を監視
    const subscription = supabase
      .channel("Pending-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // 作成、削除、更新のすべてのイベントを監視
          schema: "public",
          table: "friends",
        },
        () => {
          console.log("保留中にてBD変化を検知　関数呼び出し");
          fetchPending(); // ステータスを再度フェッチ
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  //uuidからユーザネームを取得
  useEffect(() => {
    const fetchUserIdsAndUsernames = async (idArray: string[]) => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username,icon") // idとusernameの両方を取得
        .in("id", idArray); // userIdsArrayに含まれるidでフィルタリング

      if (error) {
        console.error("Error fetching user ids and usernames:", error);
        return [];
      }

      // id（UUID）とusernameのペアをオブジェクト形式で返す
      setPending(
        data.map((user) => ({
          id: user.id,
          username: user.username,
          icon: user.icon || null, // iconがなければnull
        }))
      );
    };  
    fetchUserIdsAndUsernames(userIdsPendingArray);
  }, [userIdsPendingArray]);

  // リスト項目のレンダリング
  const renderPendingItem = ({
    item,
    index,
  }: {
    item: { id: string; username: string; icon: string | null };
    index: number;
  }) => (
    <View key={item.id} style={styles.listItem}>
      {/* ユーザー名やアイコンをタップしたらUserPageへ遷移 */}
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center" }}
        //@ts-ignore
        onPress={() => navigation.navigate("UserPage", { userId: item.id })}
        activeOpacity={0.7} // 押下時の透明度調整
      >
        <Image
          source={
            item.icon
              ? { uri: item.icon }
              : require("../../assets/user_default_icon.png")
          }
          //@ts-ignore
          style={styles.avatar}
        />
        <Text style={styles.PendingUserName}>{item.username}</Text>
      </TouchableOpacity>

      {/* 承認/拒否ボタン */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.approveButton} // 元のスタイル
          onPress={(e) => {
            e.stopPropagation(); // 承認ボタンのイベントがリスト全体に伝わらないように
            handleApprove(item.id);
          }}
        >
          <Text style={styles.approveButtonText}>承認</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton} // 元のスタイル
          onPress={(e) => {
            e.stopPropagation(); // 拒否ボタンのイベントがリスト全体に伝わらないように
            handleReject(item.id);
          }}
        >
          <Text style={styles.rejectButtonText}>拒否</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApplicationItem = ({
    item,
    index,
  }: {
    item: { id: string; username: string; icon: string | null };
    index: number;
  }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.listItem,
        index === 0 ? { marginTop: 10 } : { marginTop: 0 },
      ]}
      //@ts-ignore
      onPress={() => navigation.navigate("UserPage", { userId: item.id })}
    >
      <Image
        source={
          item.icon
            ? { uri: item.icon }
            : require("../../assets/user_default_icon.png")
        }
        //@ts-ignore
        style={styles.avatar}
      />
      <Text style={styles.userName}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#ff00a1", "#040045"]}
      style={[styles.container]} // グラデーション全体のスタイル
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.sectionLabel}>保留中</Text>

        <FlatList
          data={pending} // 保留中のフレンドデータ
          renderItem={renderPendingItem} // 各項目のレンダリング
          keyExtractor={(item) => item.id} // ユニークキー
          contentContainerStyle={[
            styles.listContainer,
            pending.length === 0 && styles.emptyContainer, // 空の場合のスタイル
          ]}
          ListEmptyComponent={
            <View style={styles.noData}>
              <Text style={styles.noDataText}>
                誰からも申請がきてないよ！！
              </Text>
            </View>
          } // 空データの場合の表示
        />

        {/* 申請中のエリアをFlatListの直後に配置する */}
        <Text style={styles.sectionLabel}>申請中</Text>
        <FlatList
          data={Applications} // 申請中のフレンドデータ
          renderItem={renderApplicationItem} // 各項目のレンダリング
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.id} // ユニークキー
          ListEmptyComponent={
            <View style={styles.noData}>
              <Text style={styles.noDataText}>
                友達にフレンドリクエストを送ろう！！
              </Text>
            </View>
          } // 空データの場合の表示
        />
      </View>
    </LinearGradient>
  );
};

const Social = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions(); // ウィンドウの幅を取得
  const { height: screenHeight } = Dimensions.get("window");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const windowHeight = Dimensions.get("window").height;
  // サイドバーの幅を決定
  const sidebarWidth = Platform.OS === "web" ? (width < 748 ? 60 : 250) : 0;

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("supabase_user_id");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          console.error("ユーザーIDが見つかりません");
        }
      } catch (error) {
        console.error("ユーザーIDの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    // サイドバー分　コンテントを右にずらす
    <View style={[styles.container, { paddingRight: sidebarWidth }]}>
      {Platform.OS === "web" && (
        <SideBar style={{ zIndex: 2, width: sidebarWidth }} />
      )}

      <Tab.Navigator
        screenOptions={{
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "bold",
            color: "#fff",
            fontSize: 13,
          },
          tabBarStyle: {
              backgroundColor: "#000",
              justifyContent: "center",
              ...(Platform.OS === "web" && {
                position: "fixed", // 固定
                top: 0, // 画面上部に配置
                left: sidebarWidth, // サイドバーの幅に応じて左にスペースを確保
                width: `calc(100% - ${sidebarWidth}px)`, // サイドバーを除いた幅を計算
                zIndex: 10, // 他の要素の上に表示
              }),
            },
        }}
        style={[
          styles.innerContainer,
          Platform.OS === "web" ? { marginLeft: sidebarWidth, paddingTop: 49 } : {}, // Webの場合コンテンツを下げる
        ]}
      >
        <Tab.Screen name="FriendList" options={{ title: "フレンド一覧" }}>
          {() => <FriendList userId={userId} />}
        </Tab.Screen>
        <Tab.Screen name="AddFriend" options={{ title: "フレンド追加" }}>
          {() => <AddFriend userId={userId} />}
        </Tab.Screen>
        <Tab.Screen
          name="PendingList"
          options={{
            title: "フレンド申請中/保留中",
            tabBarLabelStyle: { fontSize:11, color: "#fff",fontWeight: "bold",  },
          }}
        >
  {() => <PendingList userId={userId} width={width} />}
</Tab.Screen>

        {/* <Tab.Screen name="ApplicationsList" options={{ title: '申請中' }}>
          {() => <ApplicationsList userId={userId} />}
        </Tab.Screen> */}
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    width: "100%",
    //@ts-ignore
    background: "#000",
    //@ts-ignore
    minHeight: "94vh", //高さはこれが適切？（暫定）
    overflow: Platform.OS === "web" ? "hidden" : "visible", 
  },
  backgroundGradient: {
    position: "absolute", // 背景を固定
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -1, // 背景として配置
  },
  innerContainer: {
    flex: 1,
    width: "100%",
    //@ts-ignore
    minHeight: "0vh",
  },
  PendingListContainer: {
    width: "100%",
    // width:Platform.OS === 'web' ? '98%' : '100%',
    flexGrow: 0, // 余分な高さを防ぐために0に設定
  },
  emptyContainer: {
    paddingVertical: 0, // 空の場合は高さを縮める
  },
  noData: {
    padding: 16,
    // alignItems: 'center',
  },
  noDataText: {
    fontWeight: "bold",
    color: "#fff",
  },
  fixedHeader: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    width: "100%",
    alignItems: "center",
    zIndex: 1000,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "100%",
    marginVertical: 5,
    borderRadius: 8,
    justifyContent: "space-between",
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  approveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  attributeListContainer: {
    height: "35%", // 画面の40%
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  friendListContainer: {
    height: "65%",
    //@ts-ignore
    overflowY: Platform.OS === "web" ? "auto" : "",
    paddingHorizontal: 10,
  },
  qrButton: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 10,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.1,
    borderColor: "#A9A9A9",
  },
  qrButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  searchButton: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 10,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.1,
    borderColor: "#A9A9A9",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  qrText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  copyButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  userIdText: {
    marginTop: 20,
    alignItems: "center",
    color: "#333",
  },
  PendingUserName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginTop: 10,
    marginHorizontal: 20,
    color: "#fff",
  },
  suggestionList: {
    marginTop: 10,
  },
  suggestionItem: {
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  suggestionText: {
    fontSize: 16,
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    height: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    position: "relative",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  AttributecloseButtonText: {
    fontSize: 40,
    color: "#000",
    fontWeight: "bold",
  },
  AttributecloseButton: {
    position: "absolute",
    top: -17,
    right: -5,
    zIndex: 10,
    padding: 10,
  },
  attributes: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "left",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 5,
  },
});

export default Social;
