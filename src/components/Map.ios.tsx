import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

export const LeafletMapScreen: React.FC<WebMapProps> = ({ location, meetingplace }) => {
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  // 住所から緯度経度を取得
  const getCoordinates = async (fullAddress: string) => {
    try {
      console.log("住所:", fullAddress);
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: fullAddress,
          format: 'json',
          limit: 1,
        },
      });

      console.log("取得結果:", response.data);
      if (response.data && response.data[0]) {
        const { lat, lon } = response.data[0];
        return [parseFloat(lat), parseFloat(lon)] as [number, number];
      } else {
        setError('位置情報が見つかりませんでした。');
        return null;
      }
    } catch (err) {
      console.error('緯度と経度の取得エラー', err);
      setError('位置情報の取得に失敗しました。');
      return null;
    }
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      const fullAddress = `${location} ${meetingplace}`;
      const coords = await getCoordinates(fullAddress);
      if (coords) {
        setCoordinates(coords);
      }
    };

    fetchCoordinates();
  }, [location, meetingplace]);

  // 地図のHTML生成
  useEffect(() => {
    if (coordinates) {
      const content = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Leaflet Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <style>
            #map { height: 100%; width: 100%; }
            body, html { margin: 0; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map("map").setView(${JSON.stringify(coordinates)}, 16);
            L.tileLayer("https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            L.marker(${JSON.stringify(coordinates)}).addTo(map).bindPopup(${JSON.stringify(location + ' ' + meetingplace)}).openPopup();
          </script>
        </body>
        </html>
      `;
      setHtmlContent(content);
    }
  }, [coordinates]);

  const handleError = (error: any) => {
    console.log("WebView Error", error.nativeEvent);
    setError("マップの読み込みに失敗しました。後ほど再試行してください。");
  };

  const handleLoad = () => {
    console.log("WebView loaded successfully");
  };

  return (
    <View style={{ flex: 1, height: 300 }}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      ) : htmlContent ? (
        <WebView
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text>地図の読み込み中...</Text>
        </View>
      )}
    </View>
  );
};

export interface WebMapProps {
  location: string;
  meetingplace: string;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 20,
  },
  errorMessage: {
    color: '#721c24',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LeafletMapScreen;
