import React, { useState, useEffect } from "react";
import { View, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { BlurView } from "expo-blur";
import EventList from "./EventList/EventList";
import MyPostsScreen from "./EventList/MyPostsScreen";
import ParticipatingPostsScreen from "./EventList/ParticipatingPostsScreen";
import SideBar from "../components/SideBar";

const Tab = createMaterialTopTabNavigator();

const EventListTab: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const { width } = useWindowDimensions();
  const sidebarWidth = Platform.OS === "web" ? (width < 748 ? 60 : 250) : 0;

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsAdmin(true);
    };
    checkAdminStatus();
  }, []);

  return (
    <View style={styles.container}>
      {/* 全体の背景を黒のブラーにする */}
      <BlurView style={styles.blurContainer} intensity={80} tint="dark">
        <View style={styles.innerContainer}>
          {/* Web の場合にサイドバーを表示 */}
          {Platform.OS === "web" && (
            <SideBar
              style={{ zIndex: 2, width: sidebarWidth }}
              onNavigate={() => {}}
              //@ts-ignore
              isAdmin={isAdmin}
            />
          )}

          {/* タブナビゲーション */}
          <BlurView style={styles.tabContainer} intensity={80} tint="dark">
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarItemStyle: {
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                },
                tabBarLabelStyle: {
                  fontSize: 15,
                  fontWeight: "bold",
                  color: "#fff",
                },
                //@ts-ignore
                tabBarStyle: {
                  backgroundColor: "transparent",
                  justifyContent: "center",
                  ...(Platform.OS === "web" && {
                    position: "fixed",
                    top: 0,
                    left: sidebarWidth,
                    width: `calc(100% - ${sidebarWidth}px)`,
                    zIndex: 10,
                  }),
                },
                tabBarBackground: () => (
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    intensity={80}
                    tint="dark"
                  />
                ),
              }}
            >
              <Tab.Screen name="イベント一覧" component={EventList} />
              <Tab.Screen name="自分のイベント" component={MyPostsScreen} />
              <Tab.Screen name="参加中のイベント" component={ParticipatingPostsScreen} />
            </Tab.Navigator>
          </BlurView>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  innerContainer: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingTop: Platform.OS === "ios" || Platform.OS === "android" ? 60 : 0,
  },
});

export default EventListTab;
