import React, { useEffect, useState } from "react";
import { View, StyleSheet, PanResponder, Dimensions } from "react-native";
import { Text } from "react-native-elements";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

// type startEndTimeProps = {
//   onSetTimeChange: (ids: number[]) => void; // 型定義
// };

const ClockInput: React.FC<{
  onSetTimeChange: (times: { start: number; end: number }) => void;
}> = ({ onSetTimeChange }) => {
  const screenWidth = Dimensions.get("window").width;
  const clockRadius = screenWidth / 2 - 40; // 時計のサイズ
  const center = { x: clockRadius, y: clockRadius }; // 中心座標
  const [angle, setAngle] = useState(0);
  const [angle2, setAngle2] = useState(0);
  const [startClockTime, setStartClockTime] = useState(0);
  const [endClockTime, setEndClockTime] = useState(0);

  //データ渡すようのuseEffect
  useEffect(() => {
    onSetTimeChange({ start: startClockTime, end: endClockTime });
  }, [startClockTime, endClockTime]);

  // 角度を時間に変換する関数
  const angleToTime = (angle: number) => Math.floor(angle / 15);

  // angle が変更されたときに startClockTime を更新
  useEffect(() => {
    setStartClockTime(angleToTime(angle));
  }, [angle]);

  // angle2 が変更されたときに endClockTime を更新
  useEffect(() => {
    setEndClockTime(angleToTime(angle2));
  }, [angle2]);

  // パンジェスチャーを設定
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const dx = gestureState.moveX - center.x - 20; // タッチ位置のX
      const dy = gestureState.moveY - center.y - 340; // タッチ位置のY
      const computedAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // 角度を計算
      const normalizedAngle = (computedAngle + 360) % 360; // 正の角度に正規化
      const snappedAngle = Math.round(normalizedAngle / 15) * 15; // 30度単位にスナップ
      setAngle(snappedAngle); // スナップされた角度を保存
    },
  });

  // パンジェスチャーを設定
  const panResponder2 = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const dx = gestureState.moveX - center.x - 20; // タッチ位置のX
      const dy = gestureState.moveY - center.y - 340; // タッチ位置のY
      const computedAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // 角度を計算
      const normalizedAngle = (computedAngle + 360) % 360; // 正の角度に正規化
      const snappedAngle2 = Math.round(normalizedAngle / 15) * 15; // 30度単位にスナップ
      setAngle2(snappedAngle2); // スナップされた角度を保存
    },
  });

  console.log("開始" + angle);
  console.log("終了" + angle2);

  return (
    <View style={styles.container}>
      {/* 開始時刻と終了時刻の表示 */}
      <View style={styles.timeDisplay}>
        <Text style={styles.timeText}>開始時刻: {startClockTime}:00</Text>
        <Text style={styles.timeText}>終了時刻: {endClockTime}:00</Text>
      </View>
      <Svg
        height={clockRadius * 2}
        width={clockRadius * 2}
        style={styles.clock}
      >
        {/* 外枠 */}
        <Circle
          cx={center.x}
          cy={center.y}
          r={clockRadius}
          stroke="black"
          strokeWidth="2.5"
          fill="#f8f8f8"
        />
        {/* 数字（1から12） */}
        {Array.from({ length: 24 }, (_, i) => {
          const numberAngle = (i + 1) * 15; // 各数字の角度
          const rad = (numberAngle * Math.PI) / 180; // ラジアンに変換
          const x = center.x + (clockRadius - 30) * Math.sin(rad); // X座標
          const y = center.y - (clockRadius - 30) * Math.cos(rad); // Y座標
          return (
            <SvgText
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="18"
              fill="black"
            >
              {i + 1}
            </SvgText>
          );
        })}

        {/* 時計の針 */}
        <Line
          x1={center.x}
          y1={center.y}
          x2={center.x + (clockRadius - 40) * Math.sin((angle * Math.PI) / 180)}
          y2={center.y - (clockRadius - 40) * Math.cos((angle * Math.PI) / 180)}
          stroke="blue" // 青色に設定
          strokeWidth="7" // 針の太さ
          strokeLinecap="round" // 丸みを帯びた針の先端
          {...panResponder.panHandlers}
        />
        {/* タッチ領域を広げる透明な針 */}
        <Line
          x1={center.x}
          y1={center.y}
          x2={center.x + (clockRadius - 40) * Math.sin((angle * Math.PI) / 180)}
          y2={center.y - (clockRadius - 40) * Math.cos((angle * Math.PI) / 180)}
          stroke="transparent" // 透明に設定
          strokeWidth="30" // タッチ領域を広げる
          {...panResponder.panHandlers} // タッチイベントを適用
        />

        {/* 時計の内針 */}
        <Line
          x1={center.x}
          y1={center.y}
          x2={
            center.x + (clockRadius - 75) * Math.sin((angle2 * Math.PI) / 180)
          }
          y2={
            center.y - (clockRadius - 75) * Math.cos((angle2 * Math.PI) / 180)
          }
          stroke="red"
          strokeWidth="7"
          strokeLinecap="round" // 丸みを帯びた針の先端
          {...panResponder2.panHandlers}
        />
        {/* タッチ領域を広げる透明な針 */}
        <Line
          x1={center.x}
          y1={center.y}
          x2={center.x + (clockRadius - 90) * Math.sin((angle * Math.PI) / 180)}
          y2={center.y - (clockRadius - 90) * Math.cos((angle * Math.PI) / 180)}
          stroke="transparent" // 透明に設定
          strokeWidth="40" // タッチ領域を広げる
          {...panResponder2.panHandlers} // タッチイベントを適用
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa", // 背景色を柔らかいグレーに変更
    padding: 20, // 余白を追加
  },
  timeDisplay: {
    marginBottom: 30, // 時刻表示と時計の間の余白
    alignItems: "center", // 中央寄せ
  },
  timeText: {
    fontSize: 20, // 文字サイズを大きく
    fontWeight: "bold", // 太字に
    color: "#333", // 文字色をダークグレーに
    marginVertical: 5, // 上下の余白を調整
  },
  clock: {
    margin: 20,
    shadowColor: "#000", // 時計にシャドウを追加
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Android用のシャドウ
  },
});

export default ClockInput;
