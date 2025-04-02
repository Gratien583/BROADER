import { EXPO_PUSH_ENDPOINT } from "@env";
export async function sendPushNotification(
  expoPushToken: string,
  pushBody: string,
  data: { senderUserId: string; type: string }
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "BROADER",
    body: pushBody,
    data,
  };

  await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
