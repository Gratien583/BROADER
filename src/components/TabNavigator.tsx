import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6Icon from "react-native-vector-icons/FontAwesome6";
import TopScreen from "../screens/Home";
import UserPage from "./UserPage";
import ChatList from "./ChatList";
import EventList from "../screens/EventlistTab";
import alert from "./alert";
import Social from "./Social";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={30} // ぼかしの強さ（0-100）
            tint="light" // "dark", "extraLight", "default" も選べる
          />
        ),
        headerTitle: "",
        tabBarIcon: ({ focused }) => {
          let iconName = "";
          let IconComponent = Feather;
          let iconSize = focused ? 28 : 20;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "ChatList") {
            iconName = "message-circle";
          } else if (route.name === "UserPage") {
            iconName = "user";
            iconSize = focused && isOwnProfile ? 28 : 20;
          } else if (route.name === "EventList") {
            iconName = "event-note";
            IconComponent = MaterialIcons;
          } else if (route.name === "Social") {
            iconName = "users";
            IconComponent = FontAwesome6Icon;
          }

          return (
            <View style={styles.iconContainer}>
              <IconComponent
                name={iconName}
                size={iconSize}
                color={focused ? "#800080" : "#8e8e8f"}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="ChatList" component={ChatList} />
      <Tab.Screen
        name="EventList"
        component={EventList}
        options={{
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "rgba(255, 255, 255, 0)",
          },
        }}
      />
      <Tab.Screen
        name="Home"
        component={TopScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused }) => (
            <Feather
              name="home"
              size={focused ? 28 : 20}
              color={focused ? "#800080" : "#8e8e8f"}
            />
          ),
          headerShown: true,
          headerTitle: "",
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate("alert")}
            >
              <FontAwesome name="bell" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Social" component={Social} />
      <Tab.Screen
        name="UserPage"
        component={UserPage}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (isOwnProfile) {
              navigation.navigate("UserPage");
            } else {
              setIsOwnProfile(true);
              navigation.navigate("UserPage", { userId: "自分のユーザーID" });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    height: 70,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
});

export default TabNavigator;
