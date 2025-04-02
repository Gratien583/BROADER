import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSWR, { mutate } from "swr";
import { Button } from "react-native-elements";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";

//tsエラーが出たらアンコメントして　なければ消す
type AttributeListProps = {
  onAttributeIdsChange: (ids: number[]) => void; // 型定義
};

const fetchUserId = async () => {
  const storedUserId = await AsyncStorage.getItem("supabase_user_id");
  return storedUserId;
};

const fetchAttributes = async (userId: string) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("friend_attributes")
    .select("create_attributes")
    .eq("user_id", userId);

  supabase
    .channel(`friends_channel:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friend_attributes" },
      (payload) => {
        // 新しいデータが挿入されたときにSWRのキャッシュを更新
        mutate(`attributes-${userId}`);
      }
    )
    .subscribe();

  if (error) {
    console.error("Error fetching attributes:", error);
    return [];
  } else {
    return data;
  }
};

const AttributeList: React.FC<{
  onAttributeIdsChange: (ids: number[]) => void;
}> = ({ onAttributeIdsChange }) => {
  const {
    data: userId,
    error,
    isLoading,
  } = useSWR("supabase_user_id", fetchUserId);
  //useSWRは第一引数の値が有効な値になると動くっぽい　　nullだと動かないらしい
  const { data: attributes, error: attributeError } = useSWR(
    `attributes-${userId}`,
    () => fetchAttributes(userId!)
  );

  const [showInputField, setShowInputField] = useState(false); // 入力フィールドの表示状態
  const [newAttribute, setNewAttribute] = useState(""); // 新しい属性の入力内容
  const [createLoading, setCreateLoading] = useState(false); // ローディング状態
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>([]); //選択状態の属性
  const [attributeIds, setAttributeIds] = useState<number[]>([]); //これが選択中の属性id これをフレンドリストに渡したい
  const [deletemode, setDeletemode] = useState(false); //削除モードのオンオフ
  const [selectDeleteAttribute, setSelectDleteAttribute] = useState<number[]>(
    []
  ); //削除用選択中項目
  const [dleteIds, setDleteIds] = useState<number[]>([]); //削除用選択中のID

  // 新しい属性をデータベースに追加する
  const addAttribute = async () => {
    if (newAttribute.trim() === "") return; // 入力が空の場合は処理しない

    setCreateLoading(true); // ローディング開始

    const { error } = await supabase
      .from("friend_attributes")
      .insert([{ user_id: userId, create_attributes: newAttribute }]);

    setCreateLoading(false); // ローディング終了

    if (error) {
      console.error("Error adding attribute:", error);
    } else {
      setNewAttribute(""); // 入力フィールドをクリア
      setShowInputField(false); // 入力フィールドを非表示にする
    }
  };

  const handleDelete = async () => {
    setSelectedAttributes([]);

    //ここから削除コード　要件は　削除モードボタンを押してから　削除用の選択が始まり　削除を押して消す
    console.log("削除予定の属性" + attributeIds); //ソート用の選択useState　delete用を作れ
    const { error } = await supabase
      .from("friend_attributes")
      .delete()
      .in("id", dleteIds);
    if (error) {
      console.error("削除エラー:", error.message);
    } else {
      console.log("削除完了");
      setSelectDleteAttribute([]);
      setDleteIds([]);
    }
  };

  // 属性がタップされたときに呼ばれる関数
  const handleSelectAttribute = (id: number) => {
    // deleteモードがオンかどうかを見る
    if (deletemode) {
      setSelectDleteAttribute((prevState) => {
        const updatedState = prevState.includes(id)
          ? prevState.filter((attributeId) => attributeId !== id)
          : [...prevState, id];
        setDleteIds(updatedState);
        return updatedState;
      });
    } else {
      setSelectedAttributes((prevState) => {
        const updatedState = prevState.includes(id)
          ? prevState.filter((attributeId) => attributeId !== id)
          : [...prevState, id];

        // 更新後の状態を設定
        setAttributeIds(updatedState); // `attributeIds` を更新する
        return updatedState;
      });
    }
  };

  //データ渡すようのuseEffect
  useEffect(() => {
    onAttributeIdsChange(attributeIds);
  }, [attributeIds]);

  //選択中の属性のidを取りに行く　削除用とは別々になっているため　今後統合したほうがいいと思ってる　抽象クラスとか使うかも
  useEffect(() => {
    const getAttributeIds = async (
      userId: string | null | undefined,
      selectedAttributes: number[]
    ) => {
      if (!userId || selectedAttributes.length === 0) return;

      try {
        // 各属性に対してIDを取得
        const ids = [];
        for (const attribute of selectedAttributes) {
          const { data, error } = await supabase
            .from("friend_attributes")
            .select("id")
            .eq("user_id", userId)
            .eq("create_attributes", attribute);

          if (error) {
            console.error("Error fetching attribute id for", attribute, error);
            continue; // エラーが発生した場合は次の属性へ
          }

          if (data && data.length > 0) {
            ids.push(data[0].id); // IDを配列に追加
          }
        }

        // すべてのIDを一度にセット
        if (ids.length > 0) {
          setAttributeIds(ids);
        }
      } catch (error) {
        console.error("Error fetching attribute ids:", error);
      }
    };

    getAttributeIds(userId, selectedAttributes);
  }, [userId, selectedAttributes]);

  //これがその削除用
  useEffect(() => {
    const getAttributeIds = async (
      userId: string | null | undefined,
      selectDeleteAttribute: number[]
    ) => {
      if (!userId || selectDeleteAttribute.length === 0) return;

      try {
        // 各属性に対してIDを取得
        const ids = [];
        for (const attribute of selectDeleteAttribute) {
          const { data, error } = await supabase
            .from("friend_attributes")
            .select("id")
            .eq("user_id", userId)
            .eq("create_attributes", attribute);

          if (error) {
            console.error("Error fetching attribute id for", attribute, error);
            continue; // エラーが発生した場合は次の属性へ
          }

          if (data && data.length > 0) {
            ids.push(data[0].id); // IDを配列に追加
          }
        }

        // すべてのIDを一度にセット
        if (ids.length > 0) {
          setDleteIds(ids);
        }
      } catch (error) {
        console.error("Error fetching attribute ids:", error);
      }
    };

    getAttributeIds(userId, selectDeleteAttribute);
  }, [userId, selectDeleteAttribute]);

  console.log("選択中属性ID: " + attributeIds); //これが選択中の属性ｉｄ
  console.log("削除の選択中属性ID: " + dleteIds);
  console.log(selectedAttributes); //選択中の属性のログ

  if (isLoading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  if (error) return;

  console.log(attributes);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>属性</Text>
      
      {/* 属性リスト */}
      <ScrollView contentContainerStyle={styles.attributeListContainer}>
        {attributes?.map((item, index) => (
          <TouchableOpacity
            key={
              item.create_attributes ? item.create_attributes.toString() : index
            }
            onPress={() =>
              handleSelectAttribute(
                item.create_attributes
                  ? item.create_attributes.toString()
                  : index.toString()
              )
            }
            style={[
              styles.attributeItem,
              selectDeleteAttribute.includes(
                item.create_attributes
                  ? item.create_attributes.toString()
                  : index.toString()
              ) && styles.selectedDeleteAttributeItem,
              selectedAttributes.includes(
                item.create_attributes
                  ? item.create_attributes.toString()
                  : index.toString()
              ) && styles.selectedAttributeItem,
            ]}
          >
            <Text style={styles.attributeText}>{item.create_attributes}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ボタン */}
      <View style={styles.buttonContainer}>
        {!deletemode && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowInputField(!showInputField)}
          >
            <Text style={styles.addButtonText}>
              {showInputField ? "キャンセル" : "属性を追加"}
            </Text>
          </TouchableOpacity>
        )}
        {!showInputField && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setDeletemode((prev) => !prev);
              if (deletemode) {
                handleDelete();
              }
            }}
          >
            <Text style={styles.deleteButtonText}>
              {deletemode ? "削除モード終了" : "削除モード"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showInputField && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newAttribute}
            onChangeText={setNewAttribute}
            placeholder="新しい属性を入力"
          />
          <TouchableOpacity style={styles.saveButton} onPress={addAttribute}>
            {createLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AttributeList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    padding: 20,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    //justifyContent: "space-between",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50", // 緑色
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E53935", // 赤色
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  attributeListContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  attributeListContent: {
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    width: "80%",
  },
  input: {
    flex: 1,
    height: 35,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#d1d1d1",
    fontSize: 16,
    color: "#333",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  attributeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  attributeItem: {
    margin: 4,
    padding: 15,
    paddingBottom: 2,
    paddingTop: 2,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAttributeItem: {
    backgroundColor: "#2196F3",
    borderColor: "#1e88e5",
  },
  selectedDeleteAttributeItem: {
    backgroundColor: "#db592a",
    borderColor: "#1e88e5",
  },
  attributeText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    overflow: "visible",
  },
  loaderContainer: {},
});
