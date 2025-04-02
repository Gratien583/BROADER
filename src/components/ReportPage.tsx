import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Platform,
  Keyboard, 
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseClient";
import { RootStackParamList } from "../types";

type ReportPageRouteProp = RouteProp<RootStackParamList, "ReportPage">;

type ReportPageProps = {
  isModalVisible: boolean;
  onClose: () => void;
};

const ReportPage: React.FC<ReportPageProps> = ({ isModalVisible, onClose }) => {
  const route = useRoute<ReportPageRouteProp>();
  const [reportedUserId, setReportedUserId] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [reporterUserId, setReporterUserId] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    //console.log('useEffectが実行されました');
    if (route.params?.userId) {
      setReportedUserId(route.params.userId);
      //console.log('ユーザーIDが取得できました:', route.params.userId);
      fetchUserInfo(route.params.userId);
    } else {
      //console.log('ユーザーIDが取得できませんでした');
    }
    fetchReporterUserId();
  }, [route.params?.userId]);

  const fetchReporterUserId = async () => {
    const userId = await AsyncStorage.getItem("supabase_user_id");
    setReporterUserId(userId);
  };

  const fetchUserInfo = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("icon, username")
      .eq("id", userId)
      .single();

    if (error) {
      //console.error('ユーザー情報取得エラー:', error);
    } else {
      //console.log('取得したユーザー情報:', data);
      setUserIconUrl(data?.icon || null);
      setUsername(data?.username || "不明なユーザー");
    }
  };

  const submitReport = async () => {
    if (!reportReason) {
      Alert.alert("エラー", "報告理由を入力してください");
      return;
    }

    if (!reporterUserId) {
      Alert.alert("エラー", "報告者のユーザーIDが取得できませんでした");
      return;
    }
    // 送信時間を日本時間に変換
    const currentTime = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });

    const confirmAndSubmit = async () => {
      const { error } = await supabase
        .from("user_reports")
        .insert([
          {
            reporter_user_id: reporterUserId,
            reported_user_id: reportedUserId,
            report_reason: reportReason,
          },
        ]);

      if (error) {
        //console.error('報告エラー:', error);
        Alert.alert("エラー", "報告の送信に失敗しました");
      } else {
        Alert.alert("送信完了", "報告が正常に送信されました");
        setReportReason("");
        onClose();
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("この内容で報告しますか？")) {
        confirmAndSubmit();
      }
    } else {
      Alert.alert("確認", "この内容で報告しますか？", [
        { text: "キャンセル", style: "cancel" },
        { text: "送信", onPress: confirmAndSubmit },
      ]);
    }
  };
  const dismissKeyboard = () => {
    Keyboard.dismiss(); // キーボードを閉じる
  };

  const content = (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={styles.container}>
      {userIconUrl ? (
        <Image source={{ uri: userIconUrl }} style={styles.userIcon} />
      ) : (
        <Image
          source={require("../../assets/user_default_icon.png")}
          style={styles.userIcon}
        />
      )}
      <Text style={styles.username}>{username}</Text>
      <TextInput
        style={[styles.input, styles.reasonInput]}
        value={reportReason}
        onChangeText={setReportReason}
        multiline
        autoFocus
        placeholder="報告内容"
      />
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[styles.checkboxBox, isChecked && styles.checkedBox]}
          onPress={() => setIsChecked(!isChecked)}
        >
          {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
        </TouchableOpacity>
        <Text style={styles.warningText}>
          不当な報告の場合、あなたが制限される場合があります。
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, !isChecked && styles.disabledButton]}
        onPress={submitReport}
        disabled={!isChecked}
      >
        <Text style={styles.buttonText}>報告を送信</Text>
      </TouchableOpacity>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  return Platform.OS === "web" ? (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          {content}
        </View>
      </View>
    </Modal>
  ) : (
    content
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  userIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    alignSelf: "center",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  reasonInput: {
    height: 100,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#007bff",
  },
  checkboxTick: {
    color: "#fff",
    fontSize: 14,
  },
  warningText: {
    fontSize: 14,
    color: "#555",
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    width: 150,
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default ReportPage;
