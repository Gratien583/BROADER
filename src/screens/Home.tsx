import React from "react";
import { View, Text, StyleSheet } from "react-native";
import WeeklyCalendar from "../components/WeeklyCalendar"; // 週カレンダーコンポーネントをインポート
import AnalogClockInput from "../components/AnalogClockInput";

const BlankScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>フレンドのスケジュール</Text>
      </View>
      <View style={styles.calendarContainer}>
        <WeeklyCalendar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 10,
  },
  titleContainer: {
    backgroundColor: "#53BF49", // 背景色
    borderRadius: 10, // 角丸
    padding: 10, // 内側の余白
    marginBottom: 10, // 下のコンテンツとの間隔
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#ffffff", // テキストの色を白に変更
  },
  calendarContainer: {
    borderWidth: 1, // 枠線の幅
    borderColor: "#cccccc", // 枠線の色
    borderRadius: 10, // 角丸
    padding: 10, // 内側の余白
    marginBottom: 10, // 下のコンポーネントとの間隔
  },
});

export default BlankScreen;
