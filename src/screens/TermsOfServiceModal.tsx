import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";

type TermsOfServiceModalProps = {
  onClose: () => void;
  visible: boolean;
};

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  onClose,
  visible,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalTitle}>利用規約</Text>
            <Text style={styles.modalText}>
              1. 本アプリは、利用者に対しサービスを提供します。{`\n`}
              2. ユーザーは法令を遵守し、他者に迷惑をかけないようにしてください。{`\n`}
              3. 運営の判断により、違反行為があった場合はアカウントを停止することがあります。{`\n`}
              4. 個人情報の取扱いはプライバシーポリシーに基づきます。{`\n`}
              5. 本規約の内容は予告なく変更される場合があります。
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "justify",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#800080",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TermsOfServiceModal;
