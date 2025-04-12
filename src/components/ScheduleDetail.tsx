import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import moment from "moment";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../supabaseClient";
import AnalogClockInput from "./AnalogClockInput";

const generateTimeOptions = () => {
  const times = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const time = moment({ hour: i, minute: j }).format("HH:mm");
      times.push({ label: time, value: time });
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const ScheduleDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { date: selectedDate, userId } = route.params || {}; // Calendar から受け取る

  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [startEndTimes, setStartEndTimes] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 0 });

  const handleSetTimeChange = (times: { start: number; end: number }) => {
    setStartEndTimes(times); //ここでuseStateに格納
    console.log("コンボから取得した時間: ", times);
  };

  console.log(startEndTimes);

  const handleSave = async () => {
    if (
      !startTime ||
      !endTime ||
      startTime === "Invalid date" ||
      endTime === "Invalid date"
    ) {
      // Alert.alert("エラー", "有効な開始時刻と終了時刻を選択してください。");
      // return;
    }

    const noteData = {
      user_id: userId,
      date: selectedDate,
      startTime: moment(startEndTimes.start, "HH:mm").format("HH:mm"),
      endTime: moment(startEndTimes.end, "HH:mm").format("HH:mm"),
    };

    try {
      const { error } = await supabase
        .from("user_calendar_events")
        .insert(noteData);
      if (error) {
        console.error("Supabaseに保存できませんでした:", error);
        Alert.alert("エラー", "データの保存に失敗しました。");
      } else {
        Alert.alert("成功", "予定が保存されました！");
        console.log("Supabaseに保存されました:", noteData);
        navigation.goBack();
      }
    } catch (err) {
      console.error("保存中にエラーが発生しました:", err);
      Alert.alert("エラー", "予期しないエラーが発生しました。");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>日付: {selectedDate}</Text>
      <Text style={styles.text}>空いている時間帯を設定してください </Text>

      <AnalogClockInput onSetTimeChange={handleSetTimeChange} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    color: "#555",
    marginBottom: 30,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#00adf5",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    margin: 4,
  },
});

const pickerStyles = {
  inputIOS: {
    height: 60,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#333",
    marginBottom: 20,
    fontSize: 16,
  },
  inputAndroid: {
    height: 60,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#333",
    marginBottom: 20,
    fontSize: 16,
  },
};

export default ScheduleDetail;
