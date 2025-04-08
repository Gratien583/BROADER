import React from 'react';
import { View } from 'react-native';

export const WebMap: React.FC<WebMapProps> = ({ location, meetingplace }) => {
  const locationUrl = encodeURIComponent(`${location} ${meetingplace}`);

  return (
    <View style={{ width: '100%', height: 400 }}>
      <iframe
        src={`https://www.google.com/maps?q=${locationUrl}&output=embed&z=15`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
      />
    </View>
  );
};


export interface WebMapProps {
    location: string;
    meetingplace: string;
  }

  
export default WebMap;
